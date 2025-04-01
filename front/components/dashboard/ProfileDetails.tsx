import React from 'react'
import Profile from './Profile'
import { FarmData } from '@/constants/FarmData'
import { FarmTypeEnum } from '@/enums/FarmTypeEnum'
import { formatPercentage } from '@/utils/utils'
import { UserActivityData } from '@/constants/UserActivityData'
import { EventTypesEnum } from '@/enums/EventTypesEnum'

const ProfileDetails = ({ farms, userActivity, userEuroBalance: balance }: { farms: FarmData[], userActivity: UserActivityData[], userEuroBalance: BigInt }) => {
    const distinguishRewards = () => {
        const pools = userActivity.reduce((acc: Record<string, UserActivityData[]>, curr: UserActivityData) => {
            const pool = curr.pool;
            if (!acc[pool]) {
                acc[pool] = [];
            }
            acc[pool].push(curr);
            return acc;
        }, {} as Record<string, UserActivityData[]>);

        const poolRewards: Record<string, {
            claimableRewards: number;
            deposited: number;
            monthlyRewards: number;
            yearlyRewards: number;
        }> = {};

        for (const pool in pools) {
            let currentDeposit = 0;
            let rewardRate = 0;
            const farm = farms.find((farm) => farm.farmAddress === pool);
            if (farm) {
                rewardRate = farm.rewardRate / 10000;
            }

            const lastEventTimestamp = Math.floor(Date.now() / 1000);

            let monthlyRewards = 0;
            let yearlyRewards = 0;
            let totalRewards = 0;
            let claimedRewards = 0;
            for (const event of pools[pool]) {
                const adjustedTimestamp = event.timestamp + (27 * 60);
                const timeElapsed = lastEventTimestamp - adjustedTimestamp;
                if(event.type === EventTypesEnum.Deposit) {
                currentDeposit += event.amount;
                totalRewards += event.amount * rewardRate * timeElapsed / (365 * 86400);
                monthlyRewards += timeElapsed > 2629746 ? event.amount * rewardRate * 2629746 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                yearlyRewards += timeElapsed > 31536000 ? event.amount * rewardRate * 31536000 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                } else if(event.type === EventTypesEnum.Withdraw) {
                    totalRewards -= event.amount * rewardRate * timeElapsed / (365 * 86400);
                    currentDeposit -= event.amount;
                    monthlyRewards -= timeElapsed > 2629746 ? event.amount * rewardRate * 2629746 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                    yearlyRewards -= timeElapsed > 31536000 ? event.amount * rewardRate * 31536000 / (365 * 86400) : event.amount * rewardRate * timeElapsed / (365 * 86400);
                } else if(event.type === EventTypesEnum.RewardsClaimed) {
                    claimedRewards += event.amount;
                } 
            }

            poolRewards[pool] = {
                claimableRewards: totalRewards - claimedRewards,
                deposited: currentDeposit,
                monthlyRewards,
                yearlyRewards,
            };
        }

        return poolRewards;
    };

    const poolRewards = distinguishRewards();

    // Trier les farms pour avoir PRUDENT à gauche, EQUILIBRE au milieu et DYNAMIQUE à droite
    const sortedFarms = [...farms].sort((a, b) => {
        if (a.farmType === FarmTypeEnum.PRUDENT) return -1;
        if (b.farmType === FarmTypeEnum.PRUDENT) return 1;
        if (a.farmType === FarmTypeEnum.EQUILIBRE) return -1;
        if (b.farmType === FarmTypeEnum.EQUILIBRE) return 1;
        return 0;
    });

    return (
        <div className="flex flex-row justify-center items-center gap-x-44">
            {sortedFarms.map((farm) => {
                const rewards = poolRewards[farm.farmAddress] || { deposited: 0, monthlyRewards: 0, yearlyRewards: 0, claimableRewards: 0 };
                return (
                    <Profile
                        key={farm.farmAddress}
                        pool={farm.farmAddress}
                        farmProfileName={FarmTypeEnum[farm.farmType]}
                        claimableRewards={rewards.claimableRewards}
                        rewards={rewards.deposited}
                        annualRate={formatPercentage(farm.rewardRate)}
                        monthlyGain={rewards.monthlyRewards}
                        yearlyGain={rewards.yearlyRewards}
                        balance={balance}
                        bgColor={farm.farmType === FarmTypeEnum.PRUDENT ? "bg-gray-300" : farm.farmType === FarmTypeEnum.EQUILIBRE ? "bg-yellow-300" : "bg-gray-600"}
                        textColor={farm.farmType === FarmTypeEnum.DYNAMIQUE ? "text-white" : farm.farmType === FarmTypeEnum.EQUILIBRE ? "text-black" : "text-black"} />
                );
            })}
        </div>
    )
}

export default ProfileDetails