import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from '../ui/table'
import { UserActivityData } from '../../constants/UserActivityData'
import { formatNumberFromNumber, formatDateFromTimestamp } from '../../utils/utils'
import { FarmData } from '../../constants/FarmData'
import { FarmTypeEnum } from '@/enums/FarmTypeEnum'
import { EventTypesEnum } from '@/enums/EventTypesEnum'

const ActivityHistory = ({ userActivity, farms }: { userActivity: UserActivityData[], farms: FarmData[] }) => {
    const [activity, setActivity] = useState<UserActivityData[]>([])

    useEffect(() => {
        const filteredActivity = userActivity.filter(activity => 
            activity.type !== EventTypesEnum.FeesClaimed && 
            activity.type !== EventTypesEnum.CoveredSlippage
        );
        setActivity(filteredActivity);
    }, [userActivity]);

    const formatActivityType = (type: string, pool: string) => {
        switch (type) {
            case EventTypesEnum.Deposit:
                return 'Dépot sur profil ' + formatFarmName(pool)
            case EventTypesEnum.Withdraw:
                return 'Retrait de profil ' + formatFarmName(pool)
            case EventTypesEnum.RewardsClaimed:
                return 'Récupération des récompenses de profil ' + formatFarmName(pool)
            default:
                return 'Action inconnue'
        }
    }

    const formatFarmName = (farmId: string) => {
        const farm = farms.find(farm => farm.farmAddress === farmId)
        if (farm?.farmType === FarmTypeEnum.PRUDENT) {
            return 'PRUDENT'
        } else if (farm?.farmType === FarmTypeEnum.EQUILIBRE) {
            return 'EQUILIBRE'
        } else {            
            return 'DYNAMIQUE'
        }   
    }

    return (
        <div className="rounded-xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.1)]">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Historique des opérations</h2>
            <div className="bg-white/80 rounded-xl shadow-inner p-4 max-h-[400px] overflow-y-auto">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow className="bg-slate-100/80 sticky top-0">
                            <TableHead className="w-[25%] py-4 text-slate-700 text-sm font-semibold">Date</TableHead>
                            <TableHead className="w-[50%] text-slate-700 text-sm font-semibold">Action</TableHead>
                            <TableHead className="w-[25%] text-right text-slate-700 text-sm font-semibold">Montant</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activity.map((activity: UserActivityData, index) => (
                            <TableRow 
                                key={index}
                                className="border-b border-slate-200 hover:bg-slate-100/100 transition-colors duration-150"
                            >
                                <TableCell className="py-3 text-sm text-slate-600">
                                    {formatDateFromTimestamp(activity.timestamp)}
                                </TableCell>
                                <TableCell className="py-3 text-sm text-slate-700 font-medium">
                                    {formatActivityType(activity.type, activity.pool)}
                                </TableCell>
                                <TableCell className={`py-3 text-sm font-semibold text-right ${
                                    activity.type === EventTypesEnum.Deposit ? 'text-emerald-600' :
                                    activity.type === EventTypesEnum.Withdraw ? 'text-red-600' :
                                    activity.type === EventTypesEnum.RewardsClaimed ? 'text-amber-600' :
                                    'text-slate-600'
                                }`}>
                                    {activity.type === EventTypesEnum.Deposit ? '+' + formatNumberFromNumber(activity.amount) + ' €' : '-' + formatNumberFromNumber(activity.amount) + ' €'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {activity.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        Aucune opération à afficher
                    </div>
                )}
            </div>
        </div>
    )
}

export default ActivityHistory