import { Sidebar } from 'lucide-react'
import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

const DashboardPage = async () => {
  
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className='flex flex-col gap-4 relative'>
        <h1 className='text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg flex items-center'></h1>
    </div>
  )
}

export default DashboardPage