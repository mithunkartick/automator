import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const workflow = await db.workflows.findUnique({
      where: { id: params.workflowId },
      select: {
        id: true,
        discordTemplate: true,
        slackTemplate: true,
        slackChannels: true,
        slackAccessToken: true,
        notionTemplate: true,
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}