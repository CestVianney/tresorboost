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
}

const Profile: React.FC<ProfileProps> = ({ pool, farmProfileName: profileName, claimableRewards, rewards: depositInFarm, annualRate, monthlyGain, yearlyGain, bgColor = "bg-gray-300", textColor = "text-black", balance }) => {
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
            <div className={`w-64 p-6 rounded-xl shadow-lg ${bgColor} ${textColor} text-center`}>
                <h2 className="font-bold text-lg">{`Profil ${profileName.toUpperCase()}`}</h2>
                <p className="text-3xl font-bold my-2">{`${formatNumberFromNumber(depositInFarm)} €`}</p>
                <p className="text-md font-semibold">Taux annualisé : {annualRate}%</p>
                <div className="bg-yellow-100 rounded-lg p-2 mt-2 mb-4">
                    <p className="text-sm text-yellow-800 font-medium">Intérêts récupérables</p>
                    <p className="text-lg text-yellow-600 font-bold">{`${formatNumberFromNumber(claimableRewards)} €`}</p>
                </div>

                <div className="flex justify-between mt-4 font-semibold">
                    <div className='shadow-lg p-2 rounded-lg'>
                        <p>Ce mois</p>
                        <p className='text-green-500'>{`${formatNumberFromNumber(monthlyGain)} €`}</p>
                    </div>
                    <div className='shadow-lg p-2 rounded-lg'>
                        <p>Cette année</p>
                        <p className='text-green-500'>{`${formatNumberFromNumber(yearlyGain)} €`}</p>
                    </div>
                </div>
                <div className="flex justify-between mt-4 font-bold">
                    <button
                        onClick={() => setIsDepositModalOpen(true)}
                        className="hover:shadow-md hover:shadow-gray-500/50"
                    >
                        DÉPOSER
                    </button>
                    <button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="hover:shadow-md hover:shadow-gray-500/50"
                    >
                        RETIRER
                    </button>
                </div>
            </div>

            {isDepositModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-xl font-bold text-center mb-6">Déposer des EURe</h3>
                        <div className="relative">
                            <div className="absolute -top-4 right-2 bg-white px-4 py-1">
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
            {isWithdrawModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-xl font-bold text-center mb-6">Retirer des EURe</h3>
                        <div className="relative">
                            <div className="absolute -top-4 right-2 bg-white px-4 py-1">
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
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsWithdrawModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleWithdraw(pool, Number(withdrawAmount))}
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