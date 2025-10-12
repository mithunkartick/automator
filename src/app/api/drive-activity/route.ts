import { google } from 'googleapis'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    )

    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ message: 'User not found' }, { status: 401 })
    }

    const clerkResponse = await clerkClient.users.getUserOauthAccessToken(userId, 'oauth_google')

    if (!clerkResponse || !clerkResponse.length) {
      return NextResponse.json({ message: 'No Google oauth token found for user' }, { status: 401 })
    }

  const tokenEntry = clerkResponse[0]
  const accessToken = tokenEntry?.token
  // tokenEntry is typed by Clerk; some installs store refresh tokens in different shapes. Cast to any for safe access.
  const tokenAny = tokenEntry as any
  const refreshToken = tokenAny?.refresh_token ?? tokenAny?.meta?.refresh_token ?? tokenAny?.meta?.refreshToken

    if (!accessToken) {
      return NextResponse.json({ message: 'Google oauth token missing' }, { status: 401 })
    }

    oauth2Client.setCredentials({
      access_token: accessToken,
      ...(refreshToken ? { refresh_token: refreshToken } : {}),
    })

    const drive = google.drive({
      version: 'v3',
      auth: oauth2Client,
    })
    
    // Ensure NGROK_URI or webhook address is configured
    if (!process.env.NGROK_URI) {
      return NextResponse.json({ message: 'NGROK_URI is not configured. Please set NGROK_URI env var to a public webhook URL.' }, { status: 500 })
    }

    const channelId = uuidv4()

    const startPageTokenRes = await drive.changes.getStartPageToken({})
    const startPageToken = startPageTokenRes.data.startPageToken
    if (startPageToken == null) {
      return NextResponse.json({ message: 'No start page token returned' }, { status: 500 })
    }

    let listener
    try {
      listener = await drive.changes.watch({
        pageToken: startPageToken,
        supportsAllDrives: true,
        supportsTeamDrives: true,
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: `${process.env.NGROK_URI}/api/drive-activity/notification`,
          kind: 'api#channel',
        },
      })
    } catch (googleErr) {
      console.error('Google Drive watch error:', (googleErr as any)?.message ?? googleErr)
      const googleMsg = (googleErr as any)?.message ?? String(googleErr)
      const isMissingRefresh = googleMsg?.includes('oauth_missing_refresh_token') || (googleErr as any)?.errors?.some((e: any) => String(e?.reason).includes('oauth_missing_refresh_token'))

      if (isMissingRefresh) {
        return NextResponse.json({
          code: 'oauth_missing_refresh_token',
          message: 'Cannot refresh OAuth access token',
          longMessage: "The current access token has expired and we cannot refresh it, because the authorization server hasn't provided us with a refresh token",
          error: googleMsg,
        }, { status: 401 })
      }

      return NextResponse.json({ message: 'Google Drive API error creating watch', error: googleMsg }, { status: 500 })
    }

    if (listener.status === 200) {
      //if listener created store its channel id in db
      const channelStored = await db.user.updateMany({
        where: {
          clerkId: userId,
        },
        data: {
          googleResourceId: listener.data.resourceId,
        },
      })

      if (channelStored) {
        return NextResponse.json({ message: 'Listening to changes...' }, { status: 200 })
      }
    }

    return NextResponse.json({ message: 'Oops! something went wrong, try again' }, { status: 500 })
  } catch (err) {
    console.error('drive-activity error', err)
    return NextResponse.json(
      { message: 'Failed to create listener', error: (err as any)?.message ?? String(err) },
      { status: 500 }
    )
  }
}
