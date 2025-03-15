import React from 'react'
import Welcome from '@/components/Welcome'
import GlobalIndicators from '@/components/GlobalIndicators'
import ProfileDetails from '@/components/ProfileDetails'
import ActivityHistory from '@/components/ActivityHistory'
import { Separator } from "@/components/ui/separator"

export default function Dashboard() {
    const username = 'John Doe'
    return (
        <div className="flex flex-col items-center h-screen">
            <div className="w-full h-[4vh]">
                <Welcome username={username} />
            </div>
            <Separator />

            <div className="flex flex-1 flex-col w-full">
                <div className="flex-[1_1_20%] mb-5">
                    <GlobalIndicators />
                </div>
                <Separator />
                <div className="flex-[2_1_35%] mt-5">
                    <ProfileDetails />
                </div>
                <Separator />
                <div className="flex-[2_1_45%]">
                    <ActivityHistory />
                </div>
            </div>
        </div>
    )
}
