import React from 'react'

const Welcome = ({ username }: { username: string }) => {
  return (
    <div>
      <h1 className="font-bold text-3xl">
        Welcome <span className="text-yellow-500">{username}</span> !
      </h1>
    </div>
  )
}

export default Welcome