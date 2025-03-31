import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableHead, TableRow } from '../ui/table'
import { UserActivityData } from '../../constants/UserActivityData'
import { formatNumberFromNumber, formatDateFromTimestamp } from '../../utils/utils'
import { FarmData } from '../../constants/FarmData'
import { FarmTypeEnum } from '@/enums/FarmTypeEnum'
const ActivityHistory = ({ userActivity, farms }: { userActivity: UserActivityData[], farms: FarmData[] }) => {
    const [activity, setActivity] = useState<UserActivityData[]>([])
    useEffect(() => {
        setActivity(userActivity)
    }, [userActivity])

    const formatActivityType = (type: string, pool: string) => {
        switch (type) {
            case 'deposit':
                return 'Dépot sur profil ' + formatFarmName(pool)
            case 'withdraw':
                return 'Retrait'
        }
    }

    const formatFarmName = (farmId: string) => {
        const farm = farms.find(farm => farm.farmAddress === farmId)
        console.log(FarmTypeEnum.PRUDENT)
        console.log(farm?.farmType)
        if (farm?.farmType === FarmTypeEnum.PRUDENT) {
            return 'PRUDENT'
        } else if (farm?.farmType === FarmTypeEnum.EQUILIBRE) {
            return 'EQUILIBRE'
        } else {            
            return 'DYNAMIQUE'
        }
        
    }
    return (
        <div>
            <div className='mt-2 text-2xl'>Historique des opérations</div>
            <Table className='w-[60%] mx-auto'>
                <TableRow>
                    <TableHead className='w-[30%]'>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className='w-[20%]'>Amount</TableHead>
                </TableRow>
                <TableBody>
                    {activity.map((activity: UserActivityData, index) => (
                        <TableRow key={index}>
                            <td className='text-xl'>{formatDateFromTimestamp(activity.timestamp)}</td>
                            <td className='text-xl'>{formatActivityType(activity.type, activity.pool)}</td>
                            <td className={`text-xl ${activity.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {activity.amount > 0 ? '+' + formatNumberFromNumber(activity.amount) + ' €' : formatNumberFromNumber(activity.amount) + ' €'}
                            </td>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default ActivityHistory