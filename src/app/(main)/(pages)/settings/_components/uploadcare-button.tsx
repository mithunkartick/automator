'use client'
import React, { useEffect, useRef } from 'react'
import * as LR from '@uploadcare/blocks'
import { useRouter } from 'next/navigation'

// import * as UC from 'https://cdn.jsdelivr.net/npm/@uploadcare/file-uploader@1/web/uc-file-uploader-regular.min.js';
// UC.defineComponents(UC);

type Props = {
  onUpload: (e: string) => any
}

LR.registerBlocks(LR)

const UploadCareButton = ({ onUpload }: Props) => {
  const router = useRouter()
  const ctxProviderRef = useRef<
    typeof LR.UploadCtxProvider.prototype & LR.UploadCtxProvider
  >(null)

  useEffect(() => {
    const handleUpload = async (e: any) => {
      const file = await onUpload(e.detail.cdnUrl)
      if (file) {
        router.refresh()
      }
    }
    ctxProviderRef.current.addEventListener('file-upload-success', handleUpload)
  }, [])

  return (
    <div>
       <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@uploadcare/file-uploader@1/web/uc-file-uploader-regular.min.css"
    />
    <script type="module">
      
    </script>

    <uc-config
      ctx-name="my-uploader"
      source-list="local, url, camera, dropbox"
      pubkey="77fc21efc3a911db1a42"
    ></uc-config>

    <uc-file-uploader-regular
      ctx-name="my-uploader"
      class="uc-light"
    ></uc-file-uploader-regular>

    </div>
  )
}

export default UploadCareButton