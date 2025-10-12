import { google } from 'googleapis'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const clerkResp = await clerkClient.users.getUserOauthAccessToken(userId, 'oauth_google')
    const tokenEntry = (clerkResp && clerkResp[0]) as any
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

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const listRes = await drive.files.list({
      fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,owners,size)',
      orderBy: 'createdTime desc',
      pageSize: 1,
    })

    const file = listRes?.data?.files?.[0] ?? null

    return NextResponse.json({ file }, { status: 200 })
  } catch (err) {
    console.error('Error in /api/drive/latest', err)
    return NextResponse.json({ message: 'Failed to fetch latest file', error: (err as any)?.message ?? String(err) }, { status: 500 })
  }
}
