'use client';
import { TBC_ABI } from '@/constants/TresorBoostCoreContract';
import { TBC_ADDRESS } from '@/constants/TresorBoostCoreContract';
import { EURE_ABI, EURE_ADDRESS } from '@/constants/EUReContract';
import React, { useState } from 'react'
import { useWriteContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { formatNumberFromNumber } from '@/utils/utils';

interface ProfileProps {
    pool: string;
    farmProfileName: string;
    claimableRewards: number;
    rewards: number;
    annualRate: string;
    monthlyGain: number;
    yearlyGain: number;
    bgColor?: string;
    textColor?: string;
    balance: BigInt;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

const Profile: React.FC<ProfileProps> = ({ pool, farmProfileName: profileName, claimableRewards, rewards: depositInFarm, annualRate, monthlyGain, yearlyGain, bgColor = "bg-gray-300", textColor = "text-black", balance, isExpanded, onToggleExpand }) => {
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    const { writeContract } = useWriteContract();

    const handleWithdraw = async (_toPool: string, _amount: number) => {
        try {
            const amountInWei = parseEther(_amount.toString());
            const withdrawTx = await writeContract({
                address: TBC_ADDRESS,
                abi: TBC_ABI,
                functionName: 'withdrawFrom',
                args: [_toPool, amountInWei],
            });
            setIsWithdrawModalOpen(false);
            setWithdrawAmount('');
        } catch (error: any) {
            throw error;
        }
    }

    const handleDeposit = async (_toPool: string, _amount: number) => {
        try {
            const amountInWei = parseEther(_amount.toString());
            if (Number(balance) < Number(amountInWei)) {
                throw new Error("Solde insuffisant pour ce dépôt");
            }
            const approveTx = await writeContract({
                address: EURE_ADDRESS,
                abi: EURE_ABI,
                functionName: 'approve',
                args: [TBC_ADDRESS, amountInWei],
            });
            // Attendre la confirmation de l'approbation
            await new Promise(resolve => setTimeout(resolve, 2000));
            const depositTx = await writeContract({
                address: TBC_ADDRESS,
                abi: TBC_ABI,
                functionName: 'depositTo',
                args: [_toPool, amountInWei],
            });
            setIsDepositModalOpen(false);
            setDepositAmount('');
        } catch (error: any) {
            throw error;
        }
    }

    return (
        <>
            <div className={`w-64 rounded-xl shadow-lg ${bgColor} ${textColor} overflow-hidden transition-all duration-300 relative`}>
                <div 
                    className="p-3 cursor-pointer hover:bg-white/10 transition-colors duration-200"
                    onClick={onToggleExpand}
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold tracking-wide">{`Profil ${profileName.toUpperCase()}`}</h2>
                        <svg 
                            className={`w-4 h-4 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    {!isExpanded && (
                        <div className="mt-2 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Solde :</span>
                                <span className="text-lg font-bold text-gray-800">{`${formatNumberFromNumber(depositInFarm)} €`}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Intérêts :</span>
                                <span className="text-lg font-bold text-yellow-600">{`${formatNumberFromNumber(claimableRewards)} €`}</span>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[400px] opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}>
                    <div className={`p-3 space-y-4 transition-all duration-500 ease-in-out ${isExpanded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-gray-800">{`${formatNumberFromNumber(depositInFarm)} €`}</p>
                            <p className="text-xs font-medium text-gray-600">Taux annualisé : {annualRate}%</p>
                        </div>

                        <div className="bg-white/50 rounded-xl p-3 shadow-inner">
                            <p className="text-xs font-medium text-gray-700">Intérêts récupérables</p>
                            <p className="text-xl font-bold text-yellow-600 mt-1">{`${formatNumberFromNumber(claimableRewards)} €`}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className='bg-white/50 rounded-xl p-2 shadow-inner'>
                                <p className="text-xs text-gray-600">Ce mois</p>
                                <p className='text-base font-bold text-green-600 mt-1'>{`${formatNumberFromNumber(monthlyGain)} €`}</p>
                            </div>
                            <div className='bg-white/50 rounded-xl p-2 shadow-inner'>
                                <p className="text-xs text-gray-600">Cette année</p>
                                <p className='text-base font-bold text-green-600 mt-1'>{`${formatNumberFromNumber(yearlyGain)} €`}</p>
                            </div>
                        </div>

                        <div className="flex justify-between gap-3">
                            <button
                                onClick={() => setIsDepositModalOpen(true)}
                                className="flex-1 px-3 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 text-sm"
                            >
                                DÉPOSER
                            </button>
                            <button
                                onClick={() => setIsWithdrawModalOpen(true)}
                                className="flex-1 px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 text-sm"
                            >
                                RETIRER
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isDepositModalOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setIsDepositModalOpen(false)}
                >
                    <div 
                        className="bg-white p-8 rounded-xl shadow-xl w-96 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-2 right-2">
                            <button
                                onClick={() => setIsDepositModalOpen(false)}
                                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                                <span className="text-gray-600">&times;</span>
                            </button>
                        </div>
                        <div className="absolute top-2 right-12">
                            <span className={`px-3 py-1 bg-white border-2 ${bgColor.replace('bg-', 'border-').replace('300', '500')} ${textColor.replace('black', bgColor.replace('bg-', 'text-').replace('300', '500'))} text-xs font-semibold rounded-full`}>
                                Profil {profileName.toUpperCase()}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-center mb-6">Déposer des EURe</h3>
                        <div className="relative">
                            <div className="absolute -top-4 right-2 bg-white px-4 py-1 rounded-lg shadow-sm">
                                <span className="text-sm text-gray-600">Trésorerie engageable :</span>
                                <span className="ml-2 font-semibold text-yellow-500">
                                    {balance ? formatNumberFromNumber(Number(formatEther(balance as bigint))) : '0'} €
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
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDepositModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleDeposit(pool, Number(depositAmount))}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isWithdrawModalOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setIsWithdrawModalOpen(false)}
                >
                    <div 
                        className="bg-white p-8 rounded-xl shadow-xl w-96 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-2 right-2">
                            <button
                                onClick={() => setIsWithdrawModalOpen(false)}
                                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                                <span className="text-gray-600">&times;</span>
                            </button>
                        </div>
                        <div className="absolute top-2 right-12">
                            <span className={`px-3 py-1 bg-white border-2 ${bgColor.replace('bg-', 'border-').replace('300', '500')} ${textColor.replace('black', bgColor.replace('bg-', 'text-').replace('300', '500'))} text-xs font-semibold rounded-full`}>
                                Profil {profileName.toUpperCase()}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-center mb-6">Retirer des EURe</h3>
                        <div className="relative">
                            <div className="absolute -top-4 right-2 bg-white px-4 py-1 rounded-lg shadow-sm">
                                <span className="text-sm text-gray-600">Trésorerie désengageable :</span>
                                <span className="ml-2 font-semibold text-yellow-500">
                                    {depositInFarm ? formatNumberFromNumber(depositInFarm) : '0'} €
                                </span>
                            </div>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="Montant en EURe"
                                className="border p-3 rounded-lg mb-4 w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                        </div>
                        <div className="flex justify-end gap-3 mb-4">
                            <button
                                onClick={() => setIsWithdrawModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleWithdraw(pool, Number(withdrawAmount))}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                            >
                                Confirmer
                            </button>
                        </div>
                        <p className="text-xs text-red-500 italic text-center border-t border-gray-200 pt-4">
                            *Tout retrait engendre la récupération des intérêts disponibles associés à ce profil.
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}

export default Profile