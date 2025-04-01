import React, { useState } from 'react'
import { Card } from "@/components/ui/card"
import PeriodGain from './PeriodGain'
import { Separator } from "@/components/ui/separator"
import { DepositData } from '@/constants/DepositData'
import { formatNumberFromNumber } from '@/utils/utils'
import { RewardsData } from '@/constants/RewardsData'

const GlobalIndicators = ({ userData, rewardsData }: { userData: DepositData[], rewardsData: RewardsData }) => {
    const [showShortPeriods, setShowShortPeriods] = useState(false);
    const totalDeposits = userData?.reduce((acc, curr) => acc + curr.amount, 0) ?? 0;

    return (
        <div>
            <div className="flex justify-between mt-4">
                <div className="w-[25%] flex flex-col items-center">
                    <Card className="p-4 space-y-12 flex flex-col items-center w-[100%] h-[100%] bg-gradient-to-r from-white to-gray-600">
                        <h2 className="text-xl">Trésorerie engagée</h2>
                        <p className="text-3xl font-bold">{formatNumberFromNumber(totalDeposits)} €</p>
                    </Card>
                </div>
                <div className="w-[50%] flex flex-col items-center">
                    <Card className="p-4 flex flex-col items-center w-[90%] bg-gradient-to-r from-white to-gray-600">
                        <h2 className="text-xl mb-4">Intérêts</h2>
                        <div className="flex w-full justify-between items-center">
                            <div className="flex flex-col items-center w-1/2">
                                <p className="text-sm text-gray-600">Récupérés</p>
                                <p className="text-xl font-bold text-green-500">{formatNumberFromNumber(rewardsData.claimedRewards)} €</p>
                            </div>
                            <div className="h-12 w-px bg-gray-400"></div>
                            <div className="flex flex-col items-center w-1/2">
                                <p className="text-sm text-gray-600">En attente</p>
                                <p className="text-xl font-bold text-yellow-500">{formatNumberFromNumber(rewardsData.totalRewards - rewardsData.claimedRewards)} €</p>
                            </div>
                        </div>
                    </Card>
                    <Card 
                        className="flex flex-row items-center w-[90%] justify-evenly px-4 mt-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 relative group"
                        onClick={() => setShowShortPeriods(!showShortPeriods)}
                    >
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            {showShortPeriods ? "Voir long terme" : "Voir court terme"}
                        </div>
                        {showShortPeriods ? (
                            <>
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-gray-500 mb-1">1min</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastMinuteRewards}/>
                                    </div>
                                </div>
                                <Separator orientation="vertical" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-gray-500 mb-1">5min</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastFiveMinutesRewards} />
                                    </div>
                                </div>
                                <Separator orientation="vertical" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-gray-500 mb-1">1h</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastHourRewards} />
                                    </div>
                                </div>
                                <Separator orientation="vertical" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-gray-500 mb-1">24h</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastDayRewards} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-gray-500 mb-1">24h</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastDayRewards}/>
                                    </div>
                                </div>
                                <Separator orientation="vertical" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-gray-500 mb-1">7j</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastWeekRewards} />
                                    </div>
                                </div>
                                <Separator orientation="vertical" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-gray-500 mb-1">30j</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastMonthRewards} />
                                    </div>
                                </div>
                                <Separator orientation="vertical" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-gray-500 mb-1">1an</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastYearRewards} />
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
                <div className="w-[25%] bg-blue-500">1/4</div>
            </div>
        </div>
    )
}

export default GlobalIndicators