'use client'
import React from 'react'
import Welcome from '@/components/dashboard/Welcome'
import GlobalIndicators from '@/components/dashboard/GlobalIndicators'
import ProfileDetails from '@/components/dashboard/ProfileDetails'
import ActivityHistory from '@/components/dashboard/ActivityHistory'
import { Separator } from "@/components/ui/separator"
import { useExistingFarms } from '@/hooks/useFarms'
import { useAccount } from 'wagmi'
import shortenAddress from '@/utils/utils'
import { FarmData } from '@/constants/FarmData'
import { useState, useEffect } from 'react'

export default function Dashboard() {

    const { farms } = useExistingFarms()
    const { address } = useAccount()

    return (
        <div className="flex flex-col items-center h-screen">
            <div className="w-full h-[4vh]">
                <Welcome username={shortenAddress(address as string)} />
            </div>
            <Separator />

            <div className="flex flex-1 flex-col w-full">
                <div className="flex-[1_1_20%] mb-5">
                    <GlobalIndicators />
                </div>
                <Separator />
                <div className="flex-[2_1_35%] mt-5">
                    <ProfileDetails farms={farms} />
                </div>
                <Separator />
                <div className="flex-[2_1_45%]">
                    <ActivityHistory />
                </div>
            </div>
        </div>
    )
}
