import React from 'react'

interface ProfileProps {
    profileName: string;
    value: number;
    annualRate: number;
    monthlyGain: number;
    yearlyGain: number;
    bgColor?: string;
    textColor?: string;
}

const Profile: React.FC<ProfileProps> = ({ profileName, value, annualRate, monthlyGain, yearlyGain, bgColor = "bg-gray-300", textColor = "text-black" }) => {
    return (
        <div className={`w-64 p-6 rounded-xl shadow-lg ${bgColor} ${textColor} text-center`}>
            <h2 className="font-bold text-lg">{`Profil ${profileName.toUpperCase()}`}</h2>
            <p className="text-3xl font-bold my-2">{`${value} €`}</p>
            <p className="text-md font-semibold">Taux annualisé : {annualRate}%</p>

            <div className="flex justify-between mt-4 font-semibold">
                <div className='shadow-lg p-2 rounded-lg'>
                    <p>Ce mois</p>
                    <p className='text-green-500'>{`${monthlyGain} €`}</p>
                </div>
                <div className='shadow-lg p-2 rounded-lg'>
                    <p>Cette année</p>
                    <p className='text-green-500'>{`${yearlyGain} €`}</p>
                </div>
            </div>
            <div className="flex justify-between mt-4 font-bold">
                <button className="hover:shadow-md hover:shadow-gray-500/50">DÉPOSER</button>
                <button className="hover:shadow-md hover:shadow-gray-500/50">RETIRER</button>
            </div>
        </div>
    )
}

export default Profile