'use client'
import React, { useState, useEffect } from 'react'
import Welcome from '@/components/dashboard/Welcome'
import GlobalIndicators from '@/components/dashboard/GlobalIndicators'
import ProfileDetails from '@/components/dashboard/ProfileDetails'
import ActivityHistory from '@/components/dashboard/ActivityHistory'
import { Separator } from "@/components/ui/separator"
import { useExistingFarms } from '@/hooks/useFarms'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { EURE_ADDRESS, EURE_ABI } from '@/constants/EUReContract'
import { TBC_ADDRESS, TBC_ABI } from '@/constants/TresorBoostCoreContract'
import { useEventData } from '@/hooks/useEventData'
import { UserActivityData } from '@/constants/UserActivityData'
import { DepositData } from '@/constants/DepositData'
import { Abi, formatEther } from 'viem'
import { formatNumberFromNumber } from '@/utils/utils'

export default function Dashboard() {

    const { farms } = useExistingFarms()
    const { address, isConnected } = useAccount()
    const { userActivity } = useEventData()

    const [balance, setBalance] = useState<BigInt>(BigInt(0))
    const { data: balanceData } = useReadContract({
        address: EURE_ADDRESS, 
        abi: EURE_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        query: {
            enabled: !!address
        }
    })
    
    const [userData, setUserData] = useState<DepositData[]>([])

    const contracts = userActivity
        .filter((activity: UserActivityData, index: number, self: UserActivityData[]) => 
            index === self.findIndex((a: UserActivityData) => a.pool === activity.pool)
        )
        .map((activity: UserActivityData) => {
            return {
                address: TBC_ADDRESS as `0x${string}`,
                abi: TBC_ABI as Abi,
                functionName: 'deposits',
                args: [activity.user as `0x${string}`, activity.pool as `0x${string}`],
            }
        })

    const { data: data } = useReadContracts({
        contracts: contracts,
        query: {enabled: userActivity.length > 0 && !!address}
    })

    useEffect(() => {
        if (!isConnected || !address) {
            setBalance(BigInt(0));
            setUserData([]);
            return;
        }
        
        setBalance(balanceData ? balanceData as BigInt : BigInt(0));
        
        if (data) {
            const validData: DepositData[] = data
                .filter((item): item is { result: { amount: bigint; rewardAmount: bigint; lastTimeRewardCalculated: bigint; pool: string }; status: "success" } => 
                    item.status === "success" && item.result !== undefined)
                .map((item: any) => {
                    const [pool, amount, rewardAmount, lastTimeRewardCalculated] = item.result;
                    return {
                        pool: pool as `0x${string}`,
                        amount: Number(formatEther(amount)),
                        rewardAmount: Number(formatEther(rewardAmount)),
                        lastTimeRewardCalculated: Number(lastTimeRewardCalculated)
                    };
                });
            setUserData(validData);
        }
    }, [isConnected, address, balanceData, data])

    const calculateRewards = () => {
        const pools = userActivity.reduce((acc: Record<string, UserActivityData[]>, curr) => {
            const pool = curr.pool;
            if (!acc[pool]) {
                acc[pool] = [];
            }
            acc[pool].push(curr);
            return acc;
        }, {} as Record<string, UserActivityData[]>);

        let totalRewards = 0;
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
                if (event.type === 'deposit') {
                    const timeElapsed = lastEventTimestamp - adjustedTimestamp;
                    totalRewards += event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastMinuteRewards += timeElapsed > 60 ? event.amount * rewardRate * 60 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastFiveMinutesRewards += timeElapsed > 300 ? event.amount * rewardRate * 300 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastHourRewards += timeElapsed > 3600 ? event.amount * rewardRate * 3600 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastDayRewards += timeElapsed > 86400 ? event.amount * rewardRate * 86400 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastWeekRewards += timeElapsed > 604800 ? event.amount * rewardRate * 604800 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastMonthRewards += timeElapsed > 2629746 ? event.amount * rewardRate * 2629746 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastYearRewards += timeElapsed > 31536000 ? event.amount * rewardRate * 31536000 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                } else if (event.type === 'withdrawal') {
                    const timeElapsed = lastEventTimestamp - adjustedTimestamp;
                    totalRewards -= event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastMinuteRewards -= timeElapsed > 60 ? event.amount * rewardRate * 60 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastFiveMinutesRewards -= timeElapsed > 300 ? event.amount * rewardRate * 300 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastHourRewards -= timeElapsed > 3600 ? event.amount * rewardRate * 3600 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastDayRewards -= timeElapsed > 86400 ? event.amount * rewardRate * 86400 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastWeekRewards -= timeElapsed > 604800 ? event.amount * rewardRate * 604800 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastMonthRewards -= timeElapsed > 2629746 ? event.amount * rewardRate * 2629746 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    lastYearRewards -= timeElapsed > 31536000 ? event.amount * rewardRate * 31536000 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                }
            }
        }
        
        return {
            totalRewards: Number(formatNumberFromNumber(totalRewards)),
            lastMinuteRewards: Number(formatNumberFromNumber(lastMinuteRewards)),
            lastFiveMinutesRewards: Number(formatNumberFromNumber(lastFiveMinutesRewards)),
            lastHourRewards: Number(formatNumberFromNumber(lastHourRewards)),
            lastDayRewards: Number(formatNumberFromNumber(lastDayRewards)),
            lastWeekRewards: Number(formatNumberFromNumber(lastWeekRewards)),
            lastMonthRewards: Number(formatNumberFromNumber(lastMonthRewards)),
            lastYearRewards: Number(formatNumberFromNumber(lastYearRewards)),
        };
    };

    return (
        <div className="flex flex-col items-center h-screen">
            <div className="w-full h-[4vh]">
                <Welcome username={address} balance={balance} />
            </div>
            <Separator />

            <div className="flex flex-1 flex-col w-full">
                <div className="flex-[1_1_20%] mb-5">
                    <GlobalIndicators userData={userData} rewardsData={calculateRewards()} />
                </div>
                <Separator />
                <div className="flex-[2_1_35%] mt-5">
                    <ProfileDetails 
                    farms={farms} 
                    balance={balance}  
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
