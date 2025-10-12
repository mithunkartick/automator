import { postContentToWebHook } from '@/app/(main)/(pages)/connections/_actions/discord-connection'
import { onCreateNewPageInDatabase } from '@/app/(main)/(pages)/connections/_actions/notion-connection'
import { postMessageToSlack, listBotChannels } from '@/app/(main)/(pages)/connections/_actions/slack-connection'
import { google } from 'googleapis'
import { clerkClient } from '@clerk/nextjs'
import { db } from '@/lib/db'
import axios from 'axios'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // This endpoint is intended to be called by the external cron job (cron-job.org)
  // It supports an optional ?flow_id=<id> query param so cron jobs created earlier
  // (which use NGROK_URI?flow_id=...) can call this URL for a specific workflow.
  try {
    const url = new URL(req.url)
    const flowId = url.searchParams.get('flow_id')

    let workflows: any[] = []
    if (flowId) {
      const single = await db.workflows.findUnique({ where: { id: flowId } })
      if (single) workflows = [single]
    } else {
      workflows = await db.workflows.findMany({ where: { publish: true } })
    }

    for (const flow of workflows) {
      // find the user Clerk id
      const user = await db.user.findFirst({ where: { clerkId: flow.userId }, select: { clerkId: true, credits: true } })
      if (!user) continue
      if (!(parseInt(user.credits ?? '0') > 0 || user.credits === 'Unlimited')) continue

      // fetch the user's google oauth token
      let recentFiles: any[] = []
      try {
        const clerkResp = await clerkClient.users.getUserOauthAccessToken(user.clerkId, 'oauth_google')
        const tokenEntry = clerkResp[0] as any
        const accessToken = tokenEntry?.token
        const refreshToken = tokenEntry?.refresh_token ?? tokenEntry?.meta?.refresh_token ?? tokenEntry?.meta?.refreshToken

        if (accessToken) {
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.OAUTH2_REDIRECT_URI
          )
          oauth2Client.setCredentials({ access_token: accessToken, ...(refreshToken ? { refresh_token: refreshToken } : {}) })
          const drive = google.drive({ version: 'v3', auth: oauth2Client })

          // look for files created in the last 5 minutes (cron frequency should be set accordingly)
          const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()
          const listRes = await drive.files.list({
            q: `createdTime > '${cutoff}'`,
            fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,owners,size)',
            orderBy: 'createdTime desc',
            pageSize: 20,
          })

          recentFiles = listRes?.data?.files ?? []
        }
      } catch (e) {
        console.error('Cron drive poll: error fetching recent files for user', user.clerkId, e)
      }

      if (!recentFiles.length) continue

  // load the flow path and for each recent file run the nodes
  const flowPath = JSON.parse(flow.flowPath ?? '[]')
      const formatTemplate = (template: string, file: any) => {
        if (!template) return template
        const fileWithFormattedDates = {
          ...file,
          createdTime: file.createdTime ? new Date(file.createdTime).toLocaleString() : undefined,
          modifiedTime: file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : undefined,
          size: file.size ? `${(parseInt(String(file.size)) / (1024 * 1024)).toFixed(2)} MB` : undefined,
          owners: file.owners?.map((o: any) => o.displayName || o.emailAddress).join(', '),
        }
        return template.replace(/{{\s*([^}\s]+)\s*}}/g, (_m, key) => {
          const val = fileWithFormattedDates[key] ?? file[key]
          if (val == null) return ''
          if (typeof val === 'object') return JSON.stringify(val)
          return String(val)
        })
      }

      const replacePlaceholdersInObj = (obj: any, file: any): any => {
        if (obj == null) return obj
        if (typeof obj === 'string') return formatTemplate(obj, file)
        if (Array.isArray(obj)) return obj.map((v) => replacePlaceholdersInObj(v, file))
        if (typeof obj === 'object') {
          const out: any = {}
          for (const k of Object.keys(obj)) {
            out[k] = replacePlaceholdersInObj(obj[k], file)
          }
          return out
        }
        return obj
      }

      for (const file of recentFiles) {
        const pathForFile = Array.isArray(flowPath) ? [...flowPath] : []
        let current = 0
        while (current < pathForFile.length) {
          const node = pathForFile[current]
          if (node == 'Discord') {
            const discordMessage = await db.discordWebhook.findFirst({ where: { userId: flow.userId }, select: { url: true } })
            if (discordMessage) {
              const content = formatTemplate(flow.discordTemplate ?? '', file)
              await postContentToWebHook(content, discordMessage.url)
            }
            pathForFile.splice(current, 1)
            continue
          }

          if (node == 'Slack') {
            try {
              const channelsResponse = await listBotChannels(flow.slackAccessToken!)
              const channels = flow.slackChannels.map((channelId: string) => {
                const channelInfo = channelsResponse.find((ch: any) => ch.value === channelId)
                return { label: channelInfo?.label ?? channelId, value: channelId }
              })
              const content = formatTemplate(flow.slackTemplate ?? '', file)
              await postMessageToSlack(flow.slackAccessToken!, channels, content)
            } catch (e) {
              console.error('Cron drive poll: error sending slack message', e)
            }
            pathForFile.splice(current, 1)
            continue
          }

          if (node == 'Notion') {
            try {
              const parsed = JSON.parse(flow.notionTemplate ?? '{}')
              const body = replacePlaceholdersInObj(parsed, file)
              await onCreateNewPageInDatabase(flow.notionDbId!, flow.notionAccessToken!, body)
            } catch (e) {
              console.error('Cron drive poll: error formatting notion template', e)
            }
            pathForFile.splice(current, 1)
            continue
          }

          current++
        }
      }

      // decrement credits for the user (best-effort)
      try {
        await db.user.update({ where: { clerkId: user.clerkId }, data: { credits: `${parseInt(user.credits ?? '0') - 1}` } })
      } catch (e) {
        console.warn('Cron: failed to decrement credits for user', user.clerkId, e)
      }
    }

    return NextResponse.json({ message: 'Cron drive poll completed' }, { status: 200 })
  } catch (err) {
    console.error('Cron drive poll error', err)
    return NextResponse.json({ message: 'Failed', error: (err as any)?.message ?? String(err) }, { status: 500 })
  }
}
