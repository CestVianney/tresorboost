import shortenAddress from '@/utils/utils'
import { formatEther, formatNumbers } from '@/lib/utils'

const Welcome = ({ username, userEuroBalance: balance }: { username: string | undefined, userEuroBalance: BigInt }) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="font-bold text-3xl">
        Bienvenue <span className="text-yellow-500">{shortenAddress(username)}</span> !
      </h1>
      <div className="text-xl">
        Trésorerie déposée : <span className="text-yellow-500">{balance ? formatNumbers(formatEther(balance)) : '0'}</span>
      </div>
    </div>
  )
}

export default Welcome