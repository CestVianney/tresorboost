import { createPublicClient, http } from 'viem'
import { hardhat } from 'wagmi/chains' 

export const publicClient = createPublicClient({
    chain: hardhat,
    transport: http(process.env.ETH_RPC_URL)
})