import React from 'react'
import {CONNECTIONS} from '@/lib/constant'
import { ConnectionProviderProps } from '@/providers/connections-provider'
import ConnectionCard from './_components/connection_card'
import { connect } from 'http2'

type Props = {}

const ConnectionsPage = (props: Props) => {
  return (
    <div>
        <div className="sticky top-10 z-[10] flex items-center justify-between  bg-background/50 py-4 backdrop-blur-lg px-4">
        <h1 className="text-4xl top-10 z-[10] px-6 bg-background/50 backdrop-blur-lg flex items-center">Connections</h1>
        <p className="text-base text-white/50 px-6">
          Manage your connected accounts and integrations.</p></div>
    <div className="relative justify-center flex flex-col gap-2 max-w-170 px-10 pt-5">
        
    <div className="p-6 flex flex-col gap-4 justify-center">
      {CONNECTIONS.map((connection) => (
        <ConnectionCard key={connection.title} description={connection.description} icon={connection.image} title={connection.title} type={connection.title} 
        //connected={connections}   
        />
      ))}
    </div>
    </div>
    </div>
  )
}

export default ConnectionsPage