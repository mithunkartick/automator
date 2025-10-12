import { listBotChannels } from '@/app/(main)/(pages)/connections/_actions/slack-connection'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    )
  }

  try {
    const channels = await listBotChannels(token)
    return NextResponse.json(channels)
  } catch (error) {
    console.error('Error fetching Slack channels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}