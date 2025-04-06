'use client';
import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableHead, TableRow } from '../../components/ui/table'
import { UserActivityData } from '../../constants/UserActivityData'
import { formatNumberFromNumber, formatDateFromTimestamp } from '../../utils/utils'
import { EventTypesEnum } from '@/enums/EventTypesEnum'
import { useEventData } from '@/hooks/useEventData';
import { checkOwnerage } from '@/hooks/useOwner';
import { Separator } from '@/components/ui/separator';
const page = () => {

    const isOwner = checkOwnerage()
    const { userActivity } = useEventData()

    const [activity, setActivity] = useState<UserActivityData[]>([])

    useEffect(() => {
        if (!userActivity) return;
        // Filtrer pour ne garder que les événements admin
        const adminActivity = userActivity.filter(activity =>
            activity.type === EventTypesEnum.FeesClaimed ||
            activity.type === EventTypesEnum.CoveredSlippage
        )
        setActivity(adminActivity)
    }, [userActivity])

    return (
        <div className="p-8">
            {isOwner ? (
                <>
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className='flex flex-row justify-center'>
                                <h1 className="text-3xl font-bold mb-8 text-center">
                                    <Separator /> Activités de trésorerie<Separator />
                                </h1>
                            </div>
                            <div className='max-h-[600px] overflow-y-auto'>
                                <Table className='w-full'>
                                    <TableRow>
                                        <TableHead className='w-[25%] text-lg font-bold text-black-500'>Date</TableHead>
                                        <TableHead className='w-[25%] text-lg font-bold text-black-500'>Événement</TableHead>
                                        <TableHead className='w-[25%] text-lg font-bold text-black-500'>Transaction</TableHead>
                                        <TableHead className='w-[25%] text-lg font-bold text-black-500'>Montant</TableHead>
                                    </TableRow>
                                    <TableBody>
                                        {activity.slice(0, 10).map((activity: UserActivityData, index) => (
                                            <TableRow key={index} className="hover:bg-gray-200 transition-colors duration-200">
                                                <td className='text-lg py-4'>{formatDateFromTimestamp(activity.timestamp)}</td>
                                                <td className='text-lg py-4'>{activity.type}</td>
                                                <td className='text-lg py-4'>
                                                    <a 
                                                        href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${activity.hash}`} 
                                                        target='_blank' 
                                                        rel='noopener noreferrer'
                                                        className="text-blue-500 hover:text-blue-700 cursor-pointer underline"
                                                    >
                                                        {activity.hash.slice(0, 6)}...{activity.hash.slice(-4)}
                                                    </a>
                                                </td>
                                                <td className={`text-lg py-4 ${activity.type === EventTypesEnum.FeesClaimed ? 'text-green-500' :
                                                        activity.type === EventTypesEnum.CoveredSlippage ? 'text-red-500' :
                                                            'text-gray-500'}`}>
                                                    {activity.type === EventTypesEnum.FeesClaimed ? '+' + formatNumberFromNumber(activity.amount) + ' €' : '-' + formatNumberFromNumber(activity.amount) + ' €'}
                                                </td>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <h1 className="text-2xl text-red-500">Vous n'êtes pas le propriétaire du contrat</h1>
                    </div>
                </div>
            )}
        </div>
    )
}

            export default page