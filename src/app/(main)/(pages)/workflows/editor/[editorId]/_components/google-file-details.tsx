import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { onAddTemplate } from '@/lib/editor-utils'
import { ConnectionProviderProps } from '@/providers/connections-provider'
import React from 'react'

type Props = {
  nodeConnection: ConnectionProviderProps
  title: string
  gFile: any
}

// All supported Google Drive file fields that can be used in templates
const AVAILABLE_FILE_FIELDS = [
  { key: 'name', description: 'File name' },
  { key: 'id', description: 'File ID' },
  { key: 'mimeType', description: 'File type' },
  { key: 'createdTime', description: 'Creation time' },
  { key: 'modifiedTime', description: 'Last modified time' },
  { key: 'webViewLink', description: 'View in browser link' },
  { key: 'webContentLink', description: 'Direct download link' },
  { key: 'size', description: 'File size in bytes' },
  { key: 'owners', description: 'File owners' }
]

const isGoogleFileNotEmpty = (file: any): boolean => {
  return Object.keys(file).length > 0 && file.kind !== ''
}

const GoogleFileDetails = ({ gFile, nodeConnection, title }: Props) => {
  if (!isGoogleFileNotEmpty(gFile)) {
    return null
  }

  const handleFieldClick = (field: string) => {
    // Add field as {{field}} in template
    onAddTemplate(nodeConnection, title, `{{${field}}}`)
  }

  const getFieldValue = (field: string): string => {
    const value = gFile[field]
    if (value == null) return 'N/A'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-sm text-muted-foreground">
        Click a field to add it to your message template as {'{{'}<span className="font-mono">fieldname</span>{'}}'}
      </p>
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          {AVAILABLE_FILE_FIELDS.map(({ key, description }) => (
            <div
              key={key}
              onClick={() => handleFieldClick(key)}
              className="flex cursor-pointer items-center gap-2 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{description}</span>
                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                    {'{{'}{key}{'}}'}
                  </code>
                </div>
                <CardDescription className="mt-0.5">
                  {getFieldValue(key)}
                </CardDescription>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default GoogleFileDetails
