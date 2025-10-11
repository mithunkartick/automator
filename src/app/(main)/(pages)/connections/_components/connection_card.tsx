"use client";
import { BackgroundGradient } from '@/components/ui/background-gradient'
import { Card, CardTitle, CardHeader } from '@/components/ui/card';
import { ConnectionTypes } from '@/lib/types'
import Link from 'next/link';
import React from 'react'

type Props = {
  type: ConnectionTypes
  icon: string
  title: ConnectionTypes
  description: string
  callback?: () => void
  //connected: {} & any
}

const ConnectionCard = ({
  description,
  type,
  icon,
  title,
  //connected,
}: Props) => {
  return (
    <div>
        <BackgroundGradient className="rounded-[22px] w-full py-4 justify-between sm:p-5 bg-white dark:bg-zinc-900">
        <CardHeader className='flex flex-col gap-2 py-4'>
            <div className='flex flex-row gap-2'>
                <img
          src={icon}
          alt="{title}"
          height="40"
          width="40"
          className="object-contain"
        />
            </div>
        {/* <p className="text-base sm:text-xl text-black mt-4 mb-2 dark:text-neutral-200">
          {title}
        </p> */}
        <div className='margin-t-4'>
            <CardTitle className="text-black dark:text-white text-lg sm:text-2xl font-bold">{title}</CardTitle>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
        </CardHeader>
        <div className="flex flex-col items-center gap-2">
        {/* {connected[type] ? (
          <div className="border-bg-primary rounded-lg border-2 px-3 py-2 font-bold text-white">
            Connected
          </div>
        ) : ( */}
          <Link
            href={
              title == 'Discord'
                ? process.env.NEXT_PUBLIC_DISCORD_REDIRECT!
                : title == 'Notion'
                ? process.env.NEXT_PUBLIC_NOTION_AUTH_URL!
                : title == 'Slack'
                ? process.env.NEXT_PUBLIC_SLACK_REDIRECT!
                : '#'
            }
            className=" rounded-lg bg-blue-500/70 px-4 py-2 font-bold text-white hover:bg-blue-500"
          >
            Connect
          </Link>
    
      </div>
        
        {/* <button className="rounded-full pl-4 pr-1 py-1 text-white flex items-center space-x-1 bg-black mt-4 text-xs font-bold dark:bg-zinc-800">
          
        </button> */}
      </BackgroundGradient>
    </div>
  )
}

export default ConnectionCard