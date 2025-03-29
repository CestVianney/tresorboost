'use client'
import React, { useState, useEffect } from 'react'
import Welcome from '@/components/dashboard/Welcome'
import GlobalIndicators from '@/components/dashboard/GlobalIndicators'
import ProfileDetails from '@/components/dashboard/ProfileDetails'
import ActivityHistory from '@/components/dashboard/ActivityHistory'
import { Separator } from "@/components/ui/separator"
import { useExistingFarms } from '@/hooks/useFarms'
import { useAccount, useReadContract } from 'wagmi'
import { EURE_ADDRESS, EURE_ABI } from '@/constants/EUReContract'


export default function Dashboard() {

    const { farms } = useExistingFarms()
    const { address } = useAccount()

    const [balance, setBalance] = useState<BigInt>(BigInt(0))

    const { data: balanceData } = useReadContract({
        address: EURE_ADDRESS, 
        abi: EURE_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      })
    
      useEffect(() => {
        if (balanceData) {
          console.log("BALANCE DATA",balanceData)
          setBalance(balanceData as BigInt)
        }
      }, [balanceData])

    return (
        <div className="flex flex-col items-center h-screen">
            <div className="w-full h-[4vh]">
                <Welcome username={address} balance={balance} />
            </div>
            <Separator />

            <div className="flex flex-1 flex-col w-full">
                <div className="flex-[1_1_20%] mb-5">
                    <GlobalIndicators />
                </div>
                <Separator />
                <div className="flex-[2_1_35%] mt-5">
                    <ProfileDetails farms={farms} balance={balance} />
                </div>
                <Separator />
                <div className="flex-[2_1_45%]">
                    <ActivityHistory />
                </div>
            </div>
        </div>
    )
}
