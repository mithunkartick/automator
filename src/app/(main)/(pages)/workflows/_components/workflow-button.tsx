'use client'
import WorkflowForm from '@/components/forms/workflow-form';
import CustomModal from '@/components/global/custom-modal';
import { Button } from '@/components/ui/button';
import { useModal } from '@/providers/modal-provider';
import { Plus } from 'lucide-react';
import React from 'react'

type Props = {}

const WorkflowButton = (props: Props) => {
    const { setOpen, setClose } = useModal()
    const handleClick = () =>{
        setOpen(
            <CustomModal
             title="Create a Workflow Automation"
             subheading="Workflow is an order of tasks that is to be automated.">
                <WorkflowForm/>
             </CustomModal>
        )}
      
  return (
    <Button
    className='bg-white text-black hover:bg-white/30' 
    size={'icon'}
    onClick={handleClick}
    ><Plus /></Button>
  )
}

export default WorkflowButton