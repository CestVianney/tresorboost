'use client';
import React, { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { TBC_ADDRESS, TBC_ABI } from "@/constants/tresorboostcorecontract"
import { FARM_MANAGER_ADDRESS, FARM_MANAGER_ABI } from "@/constants/farmmanagercontract"
import { useReadContract } from "wagmi"
import { checkOwnerage } from "@/hooks/useOwner"

const Sidebar = ({ className }: { className?: string }) => {

  const isOwner = checkOwnerage();

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
          {isOwner && (
            <li>
              <a href="/managefarms" className="block w-full text-left p-2 rounded hover:bg-gray-600">
                Manage farms
              </a>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar