import { Sidebar } from 'lucide-react'
import React from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { GlowingEffectDemo } from '@/components/ui/aceternity/glow'
import { Wavy } from '@/components/ui/aceternity/hero-wave'
import { SparklesPreview } from '@/components/ui/aceternity/sparkle'

const DashboardPage = async () => {

  const authUser = await currentUser()
  
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className='items-center justify-center flex flex-col gap-5'>
      {/* <Wavy name={authUser?.firstName}/> */}
      <SparklesPreview name={authUser?.firstName}/>
      <div className='p-5 max-w-120'><GlowingEffectDemo /></div>
    </div>
    
        
  )
}

export default DashboardPage