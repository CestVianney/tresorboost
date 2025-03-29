import React from 'react'
import Profile from './Profile'
import { FarmData } from '@/constants/FarmData'
import { FarmTypeEnum } from '@/enums/FarmTypeEnum'
import { formatPercentage } from '@/utils/utils'

const ProfileDetails = ({ farms, balance }: { farms: FarmData[], balance: BigInt }) => {
    return (
        <div className="flex flex-row justify-center items-center gap-x-44">
            {farms.map((farm) => (
                <Profile 
                    pool={farm.farmAddress}
                    profileName={FarmTypeEnum[farm.farmType]} 
                    value={farm.value} 
                    annualRate={formatPercentage(farm.rewardRate)} 
                    monthlyGain={farm.monthlyGain} 
                    yearlyGain={farm.yearlyGain}
                    balance={balance}
                bgColor={farm.farmType === FarmTypeEnum.PRUDENT ? "bg-gray-300" : farm.farmType === FarmTypeEnum.EQUILIBRE ? "bg-yellow-300" : "bg-gray-600"}
                textColor={farm.farmType === FarmTypeEnum.DYNAMIQUE ? "text-white" : farm.farmType === FarmTypeEnum.EQUILIBRE ? "text-black" : "text-black"} />
            ))}
        </div>
    )
}

export default ProfileDetails