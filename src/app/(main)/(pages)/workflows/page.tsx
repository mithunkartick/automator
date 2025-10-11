'use-client'
import React from 'react'
import WorkflowButton from './_components/workflow-button'
import Workflows from './_components'


type Props = {}

const Page = (props: Props) => {
  return (
    <div className="flex flex-col relative">
      <div className="text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg items-center border-b justify-start gap-2">
        <h1>Workflows</h1>
        <WorkflowButton />
      </div>
      <Workflows />
    </div>
  )
}

export default Page