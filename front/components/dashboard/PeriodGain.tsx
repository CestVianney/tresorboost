import React from 'react'

interface PeriodGainProps {
  period: string;
  value: number;
}

const PeriodGain: React.FC<PeriodGainProps> = ({ period, value }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg">
      <p className="text-1xl font-bold">{value} €</p>
    </div>
  )
}

export default PeriodGain