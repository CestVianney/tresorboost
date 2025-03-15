import React from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex">
      <Sidebar className="bg-gray-800 text-white w-[12vw] min-h-screen p-4" />
      <div className="flex flex-col flex-grow">
        <Header className="bg-gray-800 text-white p-4 shadow-md max-h-[10vh]" />
        <main className="flex-grow p-5">{children}</main>
      </div>
    </div>
  )
}

export default Layout