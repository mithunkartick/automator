import InfoBar from '@/components/infobar'
import Sidebar from '@/components/sidebar'
import React from 'react'

type Props = {children: React.ReactNode}

const Layout = (props: Props) => {
  return (
    <div className="w-full">
        <InfoBar />
        {props.children}
      </div>
  )
}

export default Layout