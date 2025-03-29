'use client';
import { TBC_ABI } from '@/constants/TresorBoostCoreContract';
import { TBC_ADDRESS } from '@/constants/TresorBoostCoreContract';
import { EURE_ABI, EURE_ADDRESS } from '@/constants/EUReContract';
import React, { useState } from 'react'
import { useWriteContract } from 'wagmi';

interface ProfileProps {
    pool: string;
    profileName: string;
    value: number;
    annualRate: string;
    monthlyGain: number;
    yearlyGain: number;
    bgColor?: string;
    textColor?: string;
    balance: BigInt;
}

const Profile: React.FC<ProfileProps> = ({ pool, profileName, value, annualRate, monthlyGain, yearlyGain, bgColor = "bg-gray-300", textColor = "text-black", balance }) => {
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    
    const { writeContract } = useWriteContract();

    const handleDeposit = async (_toPool: string, _amount: number) => {
        try {
            await writeContract({
                address: EURE_ADDRESS,
                abi: EURE_ABI,
                functionName: "approve",
                args: [TBC_ADDRESS, BigInt(_amount) * BigInt(1e18)],
            });

            console.log("POOL SELECTED", _toPool, "AMOUNT", _amount);

            const tx = await writeContract({
                address: TBC_ADDRESS,
                abi: TBC_ABI,
                functionName: "depositTo",
                args: [_toPool, BigInt(_amount) * BigInt(1e18)],
            });
            
            setIsDepositModalOpen(false);
            setDepositAmount('');
        } catch (error) {
            console.error("Error during deposit", error);
            throw error;
        }
    }

    return (
        <>
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
                    <button 
                        onClick={() => setIsDepositModalOpen(true)}
                        className="hover:shadow-md hover:shadow-gray-500/50"
                    >
                        DÉPOSER
                    </button>
                    <button className="hover:shadow-md hover:shadow-gray-500/50">RETIRER</button>
                </div>
            </div>

            {isDepositModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-xl font-bold text-center mb-6">Déposer des EURe</h3>
                        <div className="relative">
                            <div className="absolute -top-4 right-2 bg-white px-4 py-1  shadow-sm">
                                <span className="text-sm text-gray-600">Solde disponible :</span>
                                <span className="ml-2 font-semibold text-yellow-500">
                                    {balance ? Number(balance) / 1e18 : '0'} EURe
                                </span>
                            </div>
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                placeholder="Montant en EURe"
                                className="border p-3 rounded-lg mb-4 w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsDepositModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleDeposit(pool, Number(depositAmount))}
                                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Profile