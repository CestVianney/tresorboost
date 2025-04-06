import React from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex">
      <Sidebar className="fixed top-0 left-0 bg-gray-800 text-white w-[12vw] h-screen p-4 z-40" />
      <div className="flex flex-col flex-grow ml-[12vw]">
        <Header className="fixed top-0 right-0 left-[12vw] bg-gray-800 text-white p-4 shadow-md h-[10vh] z-40" />
        <main className="flex-grow p-5 mt-[10vh]">{children}</main>
      </div>
    </div>
  )
}

export default Layout