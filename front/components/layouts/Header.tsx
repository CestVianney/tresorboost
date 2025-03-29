import React from "react"
import Image from 'next/image'
import { ConnectButton } from "@rainbow-me/rainbowkit"

const Header = ({ className }: { className?: string }) => {
  return (
    <header className={`flex items-center justify-between p-4 ${className}`}>
      <div className="w-[100px]"></div>
      <div className="flex-shrink-0">
        <Image src="/images/tresorBoostHeader.png" width={100} height={100} alt="TresorBoostHeader" />
      </div>
      <ConnectButton />
    </header>
  )
}

export default Header