import { ConnectionsProvider } from '@/providers/connections-provider'
import EditorProvider from '@/providers/editor-provider'
import React from 'react'
import EditorCanvas from './[editorId]/_components/editor-canvas'

type Props = {}

const Page = (props: Props) => {
  //CHALLENGE: If the user tries to access this route you should send them to their first workflow they have or create one or you can have your own behavior.
  return (
    <div className='h-full'>
        <EditorProvider>
            <ConnectionsProvider>
                <EditorCanvas />
            </ConnectionsProvider>
        </EditorProvider>
    </div>
  )
}

export default Page
