import React from 'react'

interface PeriodGainProps {
  period: string;
  value: number;
}

const PeriodGain: React.FC<PeriodGainProps> = ({ period, value }) => {
  return (
    <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg">
      <h2 className="text-xl">{period}</h2>
      <p className="text-2xl font-bold">{value} €</p>
    </div>
  )
}

export default PeriodGain