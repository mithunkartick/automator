import { google } from 'googleapis'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const clerkResponse = await clerkClient.users.getUserOauthAccessToken(userId, 'oauth_google')
    const tokenEntry = clerkResponse[0] as any
    const accessToken = tokenEntry?.token
    const refreshToken = tokenEntry?.refresh_token ?? tokenEntry?.meta?.refresh_token ?? tokenEntry?.meta?.refreshToken

    if (!accessToken) {
      return NextResponse.json({ message: 'No Google OAuth token found for user' }, { status: 404 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      access_token: accessToken,
      ...(refreshToken ? { refresh_token: refreshToken } : {}),
    })

    if (!process.env.NGROK_URI) {
      return NextResponse.json({ message: 'NGROK_URI is not configured' }, { status: 500 })
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    const channelId = uuidv4()

    const startPageTokenRes = await drive.changes.getStartPageToken({})
    const startPageToken = startPageTokenRes.data.startPageToken
    if (startPageToken == null) return NextResponse.json({ message: 'No start page token' }, { status: 500 })

    const listener = await drive.changes.watch({
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

    if (listener.status === 200) {
      await db.user.updateMany({ where: { clerkId: userId }, data: { googleResourceId: listener.data.resourceId } })
      return NextResponse.json({ message: 'Listener ensured' }, { status: 200 })
    }

    return NextResponse.json({ message: 'Failed to create listener' }, { status: 500 })
  } catch (err) {
    console.error('ensure drive watch error', err)
    return NextResponse.json({ message: 'Failed to ensure listener', error: (err as any)?.message ?? String(err) }, { status: 500 })
  }
}
