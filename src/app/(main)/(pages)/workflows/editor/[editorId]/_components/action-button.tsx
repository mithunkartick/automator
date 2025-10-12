import React, { useCallback } from 'react'
import { Option } from './content-based-on-title'
import { ConnectionProviderProps } from '@/providers/connections-provider'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { postContentToWebHook } from '@/app/(main)/(pages)/connections/_actions/discord-connection'
import { onCreateNodeTemplate } from '../../../_actions/workflow-connections'
import { toast } from 'sonner'
import { onCreateNewPageInDatabase } from '@/app/(main)/(pages)/connections/_actions/notion-connection'
import { postMessageToSlack } from '@/app/(main)/(pages)/connections/_actions/slack-connection'

type Props = {
  currentService: string
  nodeConnection: ConnectionProviderProps
  channels?: Option[]
  setChannels?: (value: Option[]) => void
}

const ActionButton = ({
  currentService,
  nodeConnection,
  channels,
  setChannels,
}: Props) => {
  const pathname = usePathname()

  const onSendDiscordMessage = useCallback(async () => {
    // fetch latest drive file to format template
    let latestFile: any = null
    try {
      const res = await fetch('/api/drive/latest')
      if (res.ok) {
        const json = await res.json()
        latestFile = json.file ?? null
      }
    } catch (e) {
      console.error('Error fetching latest drive file for discord test:', e)
    }

    if (!latestFile) {
      toast.error('No recent Drive file available to preview the template for Discord.')
      return
    }

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

    const content = formatTemplate(nodeConnection.discordNode.content, latestFile)
    const response = await postContentToWebHook(content, nodeConnection.discordNode.webhookURL)

    if (response.message == 'success') {
      nodeConnection.setDiscordNode((prev: any) => ({
        ...prev,
        content: '',
      }))
    }
  }, [nodeConnection.discordNode])

  const onStoreNotionContent = useCallback(async () => {
    // fetch latest drive file to format notion template
    let latestFile: any = null
    try {
      const res = await fetch('/api/drive/latest')
      if (res.ok) {
        const json = await res.json()
        latestFile = json.file ?? null
      }
    } catch (e) {
      console.error('Error fetching latest drive file for notion test:', e)
    }

    if (!latestFile) {
      toast.error('No recent Drive file available to preview the template for Notion.')
      return
    }

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

    try {
      const parsed = JSON.parse(nodeConnection.notionNode.content ?? '{}')
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

      const body = replacePlaceholdersInObj(parsed, latestFile)
      const response = await onCreateNewPageInDatabase(nodeConnection.notionNode.databaseId, nodeConnection.notionNode.accessToken, body)
      if (response) {
        nodeConnection.setNotionNode((prev: any) => ({
          ...prev,
          content: '',
        }))
      }
    } catch (e) {
      console.error('Error processing notion template', e)
      toast.error('Failed to preview Notion template')
    }
  }, [nodeConnection.notionNode])

  const onStoreSlackContent = useCallback(async () => {
    // Fetch the latest Drive file for the logged-in user to use in template interpolation
    let latestFile: any = null
    try {
      const res = await fetch('/api/drive/latest')
      if (res.ok) {
        const json = await res.json()
        latestFile = json.file ?? null
      } else {
        console.warn('Failed to fetch latest drive file for template preview')
      }
    } catch (e) {
      console.error('Error fetching latest drive file:', e)
    }

    if (!latestFile) {
      toast.error('No recent Drive file available to preview the template. Ensure Drive is connected and a file was created recently.')
      return
    }

    // Use the same template formatting as the notification handler
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

    // Format the message with the fetched file
    const formattedContent = formatTemplate(nodeConnection.slackNode.content, latestFile)

    const response = await postMessageToSlack(
      nodeConnection.slackNode.slackAccessToken,
      channels!,
      formattedContent
    )

    if (response.message == 'Success') {
      toast.success('Message sent successfully')
      nodeConnection.setSlackNode((prev: any) => ({
        ...prev,
        content: '',
      }))
      setChannels!([])
    } else {
      toast.error(response.message)
    }
  }, [nodeConnection.slackNode, channels])

  const onCreateLocalNodeTempate = useCallback(async () => {
    if (currentService === 'Discord') {
      const response = await onCreateNodeTemplate(
        nodeConnection.discordNode.content,
        currentService,
        pathname.split('/').pop()!
      )

      if (response) {
        toast.message(response)
      }
    }
    if (currentService === 'Slack') {
      const response = await onCreateNodeTemplate(
        nodeConnection.slackNode.content,
        currentService,
        pathname.split('/').pop()!,
        channels,
        nodeConnection.slackNode.slackAccessToken
      )

      if (response) {
        toast.message(response)
      }
    }

    if (currentService === 'Notion') {
      const response = await onCreateNodeTemplate(
        JSON.stringify(nodeConnection.notionNode.content),
        currentService,
        pathname.split('/').pop()!,
        [],
        nodeConnection.notionNode.accessToken,
        nodeConnection.notionNode.databaseId
      )

      if (response) {
        toast.message(response)
      }
    }
  }, [nodeConnection, channels])

  const renderActionButton = () => {
    switch (currentService) {
      case 'Discord':
        return (
          <>
            <Button
              variant="outline"
              onClick={onSendDiscordMessage}
            >
              Test Message
            </Button>
            <Button
              onClick={onCreateLocalNodeTempate}
              variant="outline"
            >
              Save Template
            </Button>
          </>
        )

      case 'Notion':
        return (
          <>
            <Button
              variant="outline"
              onClick={onStoreNotionContent}
            >
              Test
            </Button>
            <Button
              onClick={onCreateLocalNodeTempate}
              variant="outline"
            >
              Save Template
            </Button>
          </>
        )

      case 'Slack':
        return (
          <>
            <Button
              variant="outline"
              onClick={onStoreSlackContent}
            >
              Send Message
            </Button>
            <Button
              onClick={onCreateLocalNodeTempate}
              variant="outline"
            >
              Save Template
            </Button>
          </>
        )

      default:
        return null
    }
  }
  return renderActionButton()
}

export default ActionButton
