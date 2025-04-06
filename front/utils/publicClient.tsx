import { createPublicClient, http } from 'viem'
import { sepolia } from './sepolia' 

export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_ETH_RPC_URL)
})