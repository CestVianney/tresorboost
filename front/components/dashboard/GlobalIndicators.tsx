import React from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PeriodGain from './PeriodGain'
import { Separator } from "@/components/ui/separator"

const GlobalIndicators = () => {
    const dailyGain = 10
    const weeklyGain = 50
    const monthlyGain = 200
    const yearlyGain = 2400
    return (
        <div>
            <div className="flex justify-between mt-4">
                <div className="w-[25%] flex flex-col items-center">
                    <Card className="p-4 space-y-4 flex flex-col items-center w-[70%] bg-gradient-to-r from-white to-gray-600">
                        <h2 className="text-xl">Trésorerie déposée</h2>
                        <p className="text-2xl font-bold">Value</p>
                    </Card>
                    <div className="mt-4 flex space-x-2">
                        <Button>Déposer</Button>
                        <Button>Répartir</Button>
                        <Button>Retirer</Button>
                    </div>
                </div>
                <div className="w-[50%] flex flex-col items-center">
                    <Card className="p-4  flex flex-row items-center w-[70%] bg-gradient-to-r from-white to-gray-600">
                        <h2 className="text-xl flex-shrink-0">Intérêts (total)</h2>
                        <p className="text-2xl font-bold flex-grow text-center">Value €</p>
                    </Card>
                    <Card className="p-4 flex flex-row items-center w-[70%] justify-between">
                        <PeriodGain period="Day" value={dailyGain}/>
                        <Separator orientation="vertical" />
                        <PeriodGain period="Week" value={weeklyGain} />
                        <Separator orientation="vertical" />
                        <PeriodGain period="Month" value={monthlyGain} />
                        <Separator orientation="vertical" />
                        <PeriodGain period="Year" value={yearlyGain} />
                    </Card>
                </div>
                <div className="w-[25%] bg-blue-500">1/4</div>
            </div>
        </div>
    )
}

export default GlobalIndicators