import React from 'react'

interface TitleDividerProps {
    title: string
}

const TitleDivider = ({ title }: TitleDividerProps) => {
  return (
    <div className="relative !mt-10 w-full">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
            <span className="bg-white px-3 text-base font-semibold text-gray-900">
                {title}
            </span>
        </div>
    </div>
  )
}

export default TitleDivider