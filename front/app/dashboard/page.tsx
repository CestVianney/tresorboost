'use client'
import React, { useState, useEffect } from 'react'
import Welcome from '@/components/dashboard/Welcome'
import GlobalIndicators from '@/components/dashboard/GlobalIndicators'
import ProfileDetails from '@/components/dashboard/ProfileDetails'
import ActivityHistory from '@/components/dashboard/ActivityHistory'
import { Separator } from "@/components/ui/separator"
import { useExistingFarms } from '@/hooks/useFarms'
import { useAccount } from 'wagmi'
import { useEventData } from '@/hooks/useEventData'
import { formatNumberFromNumber } from '@/utils/utils'
import { EventTypesEnum } from '@/enums/EventTypesEnum'
import { UserActivityData } from '@/constants/UserActivityData'

export default function Dashboard() {
    const [isClient, setIsClient] = useState(false);
    const { farms } = useExistingFarms()
    const { address, isConnected } = useAccount()
    const { userActivity, userEuroBalance, userData } = useEventData()

    useEffect(() => {
        setIsClient(true);
    }, []);

    const calculateRewards = () => {
        if (!isClient) return {
            totalRewards: 0,
            claimedRewards: 0,
            lastMinuteRewards: 0,
            lastFiveMinutesRewards: 0,
            lastHourRewards: 0,
            lastDayRewards: 0,
            lastWeekRewards: 0,
            lastMonthRewards: 0,
            lastYearRewards: 0,
        };

        const pools = userActivity.reduce((acc: Record<string, UserActivityData[]>, curr) => {
            const pool = curr.pool;
            if (!acc[pool]) {
                acc[pool] = [];
            }
            acc[pool].push(curr);
            return acc;
        }, {} as Record<string, UserActivityData[]>);

        let totalRewards = 0;
        let claimedRewards = 0;
        let lastMinuteRewards = 0;
        let lastFiveMinutesRewards = 0;
        let lastHourRewards = 0;
        let lastDayRewards = 0;
        let lastWeekRewards = 0;
        let lastMonthRewards = 0;
        let lastYearRewards = 0;

        for (const pool in pools) {
            let rewardRate = 0;
            const farm = farms.find((farm) => farm.farmAddress === pool);
            if (farm) {
                rewardRate = farm.rewardRate/10000;
            }

            // Convertir le timestamp en secondes
            const lastEventTimestamp = Math.floor(Date.now() / 1000);
            for (const event of pools[pool]) {
                const adjustedTimestamp = event.timestamp + (27 * 60); // Ajouter 27 minutes
                if (event.type === EventTypesEnum.Deposit) {
                    const timeElapsed = lastEventTimestamp - adjustedTimestamp;
                    totalRewards += event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastMinuteRewards += timeElapsed > 60 ? event.amount * rewardRate * 60 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastFiveMinutesRewards += timeElapsed > 300 ? event.amount * rewardRate * 300 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastHourRewards += timeElapsed > 3600 ? event.amount * rewardRate * 3600 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastDayRewards += timeElapsed > 86400 ? event.amount * rewardRate * 86400 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastWeekRewards += timeElapsed > 604800 ? event.amount * rewardRate * 604800 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastMonthRewards += timeElapsed > 2629746 ? event.amount * rewardRate * 2629746 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastYearRewards += timeElapsed > 31536000 ? event.amount * rewardRate * 31536000 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                } else if (event.type === EventTypesEnum.Withdraw) {
                    const timeElapsed = lastEventTimestamp - adjustedTimestamp;
                    totalRewards -= event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastMinuteRewards -= timeElapsed > 60 ? event.amount * rewardRate * 60 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastFiveMinutesRewards -= timeElapsed > 300 ? event.amount * rewardRate * 300 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastHourRewards -= timeElapsed > 3600 ? event.amount * rewardRate * 3600 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastDayRewards -= timeElapsed > 86400 ? event.amount * rewardRate * 86400 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastWeekRewards -= timeElapsed > 604800 ? event.amount * rewardRate * 604800 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastMonthRewards -= timeElapsed > 2629746 ? event.amount * rewardRate * 2629746 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastYearRewards -= timeElapsed > 31536000 ? event.amount * rewardRate * 31536000 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                } else if (event.type === EventTypesEnum.RewardsClaimed) {
                    claimedRewards += event.amount;
                }
            }
        }
        
        return {
            totalRewards: Number(formatNumberFromNumber(totalRewards)),
            claimedRewards: Number(formatNumberFromNumber(claimedRewards)),
            lastMinuteRewards: Number(formatNumberFromNumber(lastMinuteRewards)),
            lastFiveMinutesRewards: Number(formatNumberFromNumber(lastFiveMinutesRewards)),
            lastHourRewards: Number(formatNumberFromNumber(lastHourRewards)),
            lastDayRewards: Number(formatNumberFromNumber(lastDayRewards)),
            lastWeekRewards: Number(formatNumberFromNumber(lastWeekRewards)),
            lastMonthRewards: Number(formatNumberFromNumber(lastMonthRewards)),
            lastYearRewards: Number(formatNumberFromNumber(lastYearRewards)),
        };
    };

    if (!isClient) {
        return null;
    }

    return (
        <div className="flex flex-col items-center h-screen">
            <div className="w-full h-[4vh]">
                <Welcome username={address} userEuroBalance={userEuroBalance} />
            </div>
            <Separator />

            <div className="flex flex-1 flex-col w-full">
                <div className="flex-[1_1_20%] mb-5">
                    <GlobalIndicators userData={userData} rewardsData={calculateRewards()} userActivity={userActivity} farmActivity={farms} />
                </div>
                <Separator />
                <div className="flex-[2_1_35%] mt-5">
                    <ProfileDetails 
                    farms={farms} 
                    userEuroBalance={userEuroBalance}  
                    userActivity={userActivity} />
                </div>
                <Separator />
                <div className="flex-[2_1_45%]">
                    <ActivityHistory userActivity={userActivity} farms={farms} />
                </div>
            </div>
        </div>
    )
}
