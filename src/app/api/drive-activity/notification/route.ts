import { postContentToWebHook } from '@/app/(main)/(pages)/connections/_actions/discord-connection'
import { onCreateNewPageInDatabase } from '@/app/(main)/(pages)/connections/_actions/notion-connection'
import { postMessageToSlack, postMessageInSlackChannel, listBotChannels } from '@/app/(main)/(pages)/connections/_actions/slack-connection'
import { google } from 'googleapis'
import { clerkClient } from '@clerk/nextjs'
import { db } from '@/lib/db'
import axios from 'axios'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('🔴 Changed')
  const headersList = headers()
  let channelResourceId
  headersList.forEach((value, key) => {
    if (key == 'x-goog-resource-id') {
      channelResourceId = value
    }
  })

  if (channelResourceId) {
    const user = await db.user.findFirst({
      where: {
        googleResourceId: channelResourceId,
      },
      select: { clerkId: true, credits: true },
    })
    if ((user && parseInt(user.credits!) > 0) || user?.credits == 'Unlimited') {
      // try to fetch recent files using user's Clerk-stored Google oauth token
      let recentFiles: any[] = []
      try {
        const clerkResp = await clerkClient.users.getUserOauthAccessToken(
          user.clerkId,
          'oauth_google'
        )
        const tokenEntry = clerkResp[0] as any
        const accessToken = tokenEntry?.token
        const refreshToken = tokenEntry?.refresh_token ?? tokenEntry?.meta?.refresh_token ?? tokenEntry?.meta?.refreshToken

        if (accessToken) {
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

          // Find files created in the last 2 minutes (webhook should be timely)
          const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString()
          const listRes = await drive.files.list({
            q: `createdTime > '${cutoff}'`,
            fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,owners,size)',
            orderBy: 'createdTime desc',
            pageSize: 10,
          })

          recentFiles = listRes?.data?.files ?? []
        }
      } catch (e) {
        console.error('Error fetching recent Drive files for notification:', (e as any)?.message ?? e)
      }
      const workflow = await db.workflows.findMany({
        where: {
          userId: user.clerkId,
        },
      })
      if (workflow) {
        workflow.map(async (flow) => {
          const flowPath = JSON.parse(flow.flowPath!)
          // helper: replace {{placeholder}} in a string using file data
          const formatTemplate = (template: string, file: any) => {
            if (!template) return template
            
            // Format date fields for better readability
            const fileWithFormattedDates = {
              ...file,
              createdTime: file.createdTime ? new Date(file.createdTime).toLocaleString() : undefined,
              modifiedTime: file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : undefined,
              // Format other fields as needed
              size: file.size ? `${(parseInt(file.size) / (1024 * 1024)).toFixed(2)} MB` : undefined,
              owners: file.owners?.map((o: any) => o.displayName || o.emailAddress).join(', '),
            }

            return template.replace(/{{\s*([^}\s]+)\s*}}/g, (_m, key) => {
              const val = fileWithFormattedDates[key] ?? file[key]
              if (val == null) return ''
              if (typeof val === 'object') return JSON.stringify(val)
              return String(val)
            })
          }

          // recursively replace placeholders in a parsed JSON template
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

          // For each recent file, send messages according to a copy of flowPath and node templates
          for (const file of recentFiles) {
            // Log each new Drive file detected for observability
            console.log(`New Drive file detected: ${file?.name ?? '<unknown>'} (id: ${file?.id ?? '<no-id>'})`)
            const pathForFile = Array.isArray(flowPath) ? [...flowPath] : []
            let current = 0
            while (current < pathForFile.length) {
              const node = pathForFile[current]
              if (node == 'Discord') {
                const discordMessage = await db.discordWebhook.findFirst({
                  where: { userId: flow.userId },
                  select: { url: true },
                })
                if (discordMessage) {
                  const content = formatTemplate(flow.discordTemplate ?? '', file)
                  await postContentToWebHook(content, discordMessage.url)
                }
                pathForFile.splice(current, 1)
                continue
              }
              if (node == 'Slack') {
                try {
                  // Fetch channel names for better logging
                  const channelsResponse = await listBotChannels(flow.slackAccessToken!)
                  const channels = flow.slackChannels.map((channelId: string) => {
                    const channelInfo = channelsResponse.find((ch: any) => ch.value === channelId)
                    return {
                      label: channelInfo?.label ?? channelId,
                      value: channelId
                    }
                  })

                  const content = formatTemplate(flow.slackTemplate ?? '', file)

                  // Use the batched poster which returns per-channel results
                  try {
                    const res = await postMessageToSlack(flow.slackAccessToken!, channels, content)
                    if (res?.results) {
                      const successes = res.results.filter(r => r.status === 'fulfilled').map(r => r.channel)
                      const failures = res.results.filter(r => r.status === 'rejected').map(r => ({ channel: r.channel, reason: r.reason }))
                      if (successes.length) console.log(`Sent Slack message about ${file.name} to channels:`, successes.join(', '))
                      if (failures.length) console.error('Slack channel failures:', failures)
                    } else if (res?.message && res.message !== 'Success') {
                      console.error('Slack send returned non-success:', res)
                    } else {
                      console.log(`Sent Slack message about ${file.name}`)
                    }
                  } catch (e) {
                    console.error('Error sending Slack message via postMessageToSlack:', e)
                  }
                } catch (e) {
                  console.error('Error sending Slack message:', e)
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
                  console.error('Error formatting notion template', e)
                }
                pathForFile.splice(current, 1)
                continue
              }

              if (node == 'Wait') {
                const res = await axios.put(
                  'https://api.cron-job.org/jobs',
                  {
                    job: {
                      url: `${process.env.NGROK_URI}?flow_id=${flow.id}`,
                      enabled: 'true',
                      schedule: {
                        timezone: 'Europe/Istanbul',
                        expiresAt: 0,
                        hours: [-1],
                        mdays: [-1],
                        minutes: ['*****'],
                        months: [-1],
                        wdays: [-1],
                      },
                    },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.CRON_JOB_KEY!}`,
                      'Content-Type': 'application/json',
                    },
                  }
                )
                if (res) {
                  pathForFile.splice(current, 1)
                  const cronPath = await db.workflows.update({ where: { id: flow.id }, data: { cronPath: JSON.stringify(pathForFile) } })
                  if (cronPath) break
                }
                break
              }

              current++
            }
          }

         await db.user.update({
            where: {
              clerkId: user.clerkId,
            },
            data: {
              credits: `${parseInt(user.credits!) - 1}`,
            },
          })
        })
        return Response.json(
          {
            message: 'flow completed',
          },
          {
            status: 200,
          }
        )
      }
    }
  }
  return Response.json(
    {
      message: 'success',
    },
    {
      status: 200,
    }
  )
}
