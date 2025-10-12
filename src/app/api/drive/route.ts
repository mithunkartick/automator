import { google } from 'googleapis'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.OAUTH2_REDIRECT_URI
  )

  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ message: 'User not found' })
  }

  const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
    userId,
    'oauth_google'
  )

  const tokenEntry = clerkResponse[0]
  const accessToken = tokenEntry?.token
  // tokenEntry is typed by Clerk; some installs store refresh tokens in different shapes. Cast to any for safe access.
  const tokenAny = tokenEntry as any
  // clerk may provide refresh token directly or inside meta — try common locations
  const refreshToken = tokenAny?.refresh_token ?? tokenAny?.meta?.refresh_token ?? tokenAny?.meta?.refreshToken

  if (!accessToken) {
    return NextResponse.json({ message: 'Google oauth token missing' }, { status: 401 })
  }

  // Set credentials; include refresh_token when available so google lib can refresh transparently
  oauth2Client.setCredentials({
    access_token: accessToken,
    ...(refreshToken ? { refresh_token: refreshToken } : {}),
  })

  const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
  })
  
  try {
    const response = await drive.files.list()

    if (response) {
      return NextResponse.json(
        {
          message: response.data,
        },
        {
          status: 200,
        }
      )
    } else {
      return NextResponse.json(
        {
          message: 'No files found',
        },
        {
          status: 200,
        }
      )
    }
  } catch (error) {
    const msg = (error as any)?.message ?? String(error)
    const isMissingRefresh = msg?.includes('oauth_missing_refresh_token') || (error as any)?.errors?.some((e: any) => String(e?.reason).includes('oauth_missing_refresh_token'))

    if (isMissingRefresh) {
      return NextResponse.json(
        {
          code: 'oauth_missing_refresh_token',
          message: 'Access token expired and cannot be refreshed. The authorization server did not provide a refresh token. Re-authentication is required.',
          longMessage: 'The current access token has expired and we cannot refresh it because the authorization server hasn\'t provided a refresh token. Please reconnect your Google account from Connections to grant a refresh token.',
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        message: 'Something went wrong',
        error: msg,
      },
      {
        status: 500,
      }
    )
  }
}
