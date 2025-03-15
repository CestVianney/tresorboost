import React from "react"

const Sidebar = ({ className }: { className?: string }) => {
  return (
    <aside className={`p-4 bg-gray-800 text-white ${className}`}>
      <nav>
        <ul className="space-y-2 mt-[50%]">
          <li>
            <a href="/dashboard" className="block w-full text-left p-2 rounded hover:bg-gray-600">
              Mon tableau de bord
            </a>
          </li>
          <li>
            <a href="/documentation" className="block w-full text-left p-2 rounded hover:bg-gray-600">
              Documentation
            </a>
          </li>
          <li>
            <a href="/settings" className="block w-full text-left p-2 rounded hover:bg-gray-600">
              Mes paramètres
            </a>
          </li>
          <li>
            <a href="/tax-certificates" className="block w-full text-left p-2 rounded hover:bg-gray-600">
              Mes attestations fiscales
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar