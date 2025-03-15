import React from 'react'
import Profile from './Profile'

const ProfileDetails = () => {
    return (
<div className="flex flex-row justify-center items-center gap-x-44">
    <Profile profileName="PRUDENT" value={1000} annualRate={4} monthlyGain={30} yearlyGain={500} bgColor="bg-gray-300" />
    <Profile profileName="EQUILIBRE" value={2000} annualRate={6} monthlyGain={40} yearlyGain={700} bgColor="bg-yellow-300" />
    <Profile profileName="DYNAMIQUE" value={3000} annualRate={8} monthlyGain={50} yearlyGain={1000} bgColor="bg-gray-600" textColor="text-white" />
</div>
    )
}

export default ProfileDetails