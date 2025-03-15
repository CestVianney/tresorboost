import React from "react"
import Image from 'next/image'

const Header = ({ className }: { className?: string }) => {
  return (
    <header className={`flex items-center justify-center p-4 ${className}`}>
      <div className="flex-shrink-0">
        <Image src="/images/tresorBoostHeader.png" width={100} height={100} alt="TresorBoostHeader" />
      </div>
    </header>
  )
}

export default Header