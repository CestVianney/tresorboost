import React, { useState } from 'react'
import { Card } from "@/components/ui/card"
import PeriodGain from './PeriodGain'
import { Separator } from "@/components/ui/separator"
import { DepositData } from '@/constants/DepositData'
import { formatNumberFromNumber } from '@/utils/utils'
import { RewardsData } from '@/constants/RewardsData'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { UserActivityData } from '@/constants/UserActivityData'
import { FarmData } from '@/constants/FarmData'
import { EventTypesEnum } from '@/enums/EventTypesEnum'

const GlobalIndicators = ({ userData, rewardsData, userActivity, farmActivity }: { userData: DepositData[], rewardsData: RewardsData, userActivity: UserActivityData[], farmActivity: FarmData[] }) => {
    const [showShortPeriods, setShowShortPeriods] = useState(false);
    const totalDeposits = userData?.reduce((acc, curr) => acc + curr.amount, 0) ?? 0;

    const pieData = userActivity?.reduce((acc: { name: string; value: number; color: string }[], curr) => {
        const farm = farmActivity.find(f => f.farmAddress === curr.pool);
        if (!farm) return acc;

        const profileType = farm.farmType;
        const profileName = profileType === 0 ? "Prudent" : profileType === 1 ? "Équilibre" : "Dynamique";
        const existingProfile = acc.find(item => item.name === profileName);

        if (existingProfile) {
            if(curr.type === EventTypesEnum.Deposit) {
                existingProfile.value += curr.amount;
            } else if(curr.type === EventTypesEnum.Withdraw) {
                existingProfile.value -= curr.amount;
            }
        } else {
            if(curr.type === EventTypesEnum.Deposit) {
                acc.push({
                    name: profileName,
                    value: curr.amount,
                    color: profileType === 0 ? "#3B82F6" : 
                           profileType === 1 ? "#F59E0B" : 
                           "#F97316"
                });
            } else if(curr.type === EventTypesEnum.Withdraw) {
                acc.push({
                    name: profileName,
                    value: -curr.amount,
                    color: profileType === 0 ? "#3B82F6" : 
                           profileType === 1 ? "#F59E0B" : 
                           "#F97316"
                });
            }
        }
        return acc;
    }, []) ?? [];

    const COLORS = pieData.map(item => item.color);

    return (
        <div>
            <div className="flex justify-between items-start mt-4">
                <div className="w-[25%] flex items-start justify-center">
                    <div className="relative w-48 h-48 rounded-full flex items-center justify-center">
                        {/* Bordure argentée */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-500 via-gray-300 to-white shadow-[0_0_50px_rgba(0,0,0,0.2)]"></div>
                        {/* Centre doré */}
                        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-300 via-amber-200 to-amber-100 shadow-inner"></div>
                        {/* Effet de brillance dorée */}
                        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-100/80 via-transparent to-transparent opacity-70"></div>
                        {/* Effet de relief */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-gray-400/10 opacity-30"></div>
                        {/* Contenu */}
                        <div className="relative flex flex-col items-center justify-center space-y-2">
                            <h2 className="text-sm font-semibold text-slate-800">Trésorerie engagée</h2>
                            <p className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">{formatNumberFromNumber(totalDeposits)} €</p>
                        </div>
                    </div>
                </div>

                <div className="w-[50%] flex flex-col items-center">
                    <Card className="p-4 flex flex-col items-center w-[90%] bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                        <h2 className="text-xl font-semibold text-slate-800 mb-4">Intérêts</h2>
                        <div className="flex w-full justify-between items-center">
                            <div className="flex flex-col items-center w-1/2">
                                <p className="text-sm text-slate-700">Récupérés</p>
                                <p className="text-xl font-bold text-emerald-700">{formatNumberFromNumber(rewardsData.claimedRewards)} €</p>
                            </div>
                            <div className="h-12 w-px bg-slate-500"></div>
                            <div className="flex flex-col items-center w-1/2">
                                <p className="text-sm text-slate-700">En attente</p>
                                <p className="text-xl font-bold text-amber-700">{formatNumberFromNumber(rewardsData.totalRewards - rewardsData.claimedRewards)} €</p>
                            </div>
                        </div>
                    </Card>
                    <Card 
                        className="flex flex-row items-center w-[90%] justify-evenly px-4 mt-4 cursor-pointer hover:bg-slate-400 transition-all duration-200 relative group bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                        onClick={() => setShowShortPeriods(!showShortPeriods)}
                    >
                        <div className="absolute -bottom-2 bg-slate-800 text-white text-xs px-2 py-1 rounded-full shadow-md">
                            {showShortPeriods ? "Voir long terme" : "Voir court terme"}
                        </div>
                        {showShortPeriods ? (
                            <>
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-slate-700 mb-1">1min</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastMinuteRewards}/>
                                    </div>
                                </div>
                                <Separator orientation="vertical" className="bg-slate-500" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-slate-700 mb-1">5min</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastFiveMinutesRewards} />
                                    </div>
                                </div>
                                <Separator orientation="vertical" className="bg-slate-500" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-slate-700 mb-1">1h</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastHourRewards} />
                                    </div>
                                </div>
                                <Separator orientation="vertical" className="bg-slate-500" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-slate-700 mb-1">24h</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastDayRewards} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-slate-700 mb-1">24h</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastDayRewards}/>
                                    </div>
                                </div>
                                <Separator orientation="vertical" className="bg-slate-500" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-slate-700 mb-1">7j</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastWeekRewards} />
                                    </div>
                                </div>
                                <Separator orientation="vertical" className="bg-slate-500" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-slate-700 mb-1">30j</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastMonthRewards} />
                                    </div>
                                </div>
                                <Separator orientation="vertical" className="bg-slate-500" />
                                <div className="flex flex-col items-center w-[80px]">
                                    <span className="text-xs text-slate-700 mb-1">1an</span>
                                    <div className="text-center w-full">
                                        <PeriodGain period="" value={rewardsData.lastYearRewards} />
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>
                </div>

                <div className="w-[25%] flex items-start justify-center">
                    <div className="relative w-48 h-48 rounded-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                {pieData.length > 0 ? (
                                    <>
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg p-2">
                                                            <p className="text-sm font-medium text-slate-800">
                                                                {`${data.name} : ${formatNumberFromNumber(data.value)} €`}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            innerRadius={0}
                                            outerRadius={90}
                                            fill="#8884d8"
                                            dataKey="value"
                                            onMouseEnter={(_, index) => {
                                                const sector = document.querySelector(`#pie-sector-${index}`);
                                                if (sector) {
                                                    sector.setAttribute('opacity', '0.7');
                                                }
                                            }}
                                            onMouseLeave={(_, index) => {
                                                const sector = document.querySelector(`#pie-sector-${index}`);
                                                if (sector) {
                                                    sector.setAttribute('opacity', '1');
                                                }
                                            }}
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                const RADIAN = Math.PI / 180;
                                                const radius = (innerRadius + outerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                                return (
                                                    <text
                                                        x={x}
                                                        y={y}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        fill="#1E293B"
                                                        fontSize={14}
                                                    >
                                                        {`${percent != 0 ? (percent * 100).toFixed(0) + "%" : ""}`}
                                                    </text>
                                                );
                                            }}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={COLORS[index]}
                                                    id={`pie-sector-${index}`}
                                                    style={{
                                                        transition: 'opacity 0.2s ease-out'
                                                    }}
                                                />
                                            ))}
                                        </Pie>
                                    </>
                                ) : (
                                    <text
                                        x="50%"
                                        y="50%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-slate-700 text-sm"
                                    >
                                        Aucun dépôt
                                    </text>
                                )}
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GlobalIndicators