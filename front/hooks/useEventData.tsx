import { FARM_MANAGER_ADDRESS, FARM_MANAGER_ABI } from "@/constants/FarmManagerContract";
import { TBC_ADDRESS } from "@/constants/TresorBoostCoreContract";
import { publicClient } from "@/utils/publicClient";
import { useEffect, useState } from "react";
import { parseAbiItem } from "viem";
import { useWatchContractEvent, useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import { UserActivityData } from "@/constants/UserActivityData";

export const useEventData = () => {
    const [existingFarms, setExistingFarms] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userActivity, setUserActivity] = useState<UserActivityData[]>([]);
    const { address, isConnected } = useAccount();

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!isConnected || !address) return;
            
            setIsLoading(true);
            await Promise.all([
                handleExistingFarms(),
                handleUserActivity()
            ])
            setIsLoading(false);
        }
        fetchInitialData();
    }, [isConnected, address]);

    const handleExistingFarms = async () => {
        const farmAddresses = await publicClient.getLogs({
            address: FARM_MANAGER_ADDRESS,
            event: parseAbiItem("event FarmAdded(address indexed farmAddress)"),
            fromBlock: BigInt(`${process.env.NEXT_PUBLIC_BLOCK_NUMBER}`),
            toBlock: 'latest'  
        })

        farmAddresses.map((log) => {
            const farmAddress = log.args.farmAddress as string
            setExistingFarms(prev => {
                if(!prev.includes(farmAddress)) {
                    return [...prev, farmAddress]
                }
                return prev;
            })
        })   
    }

    const handleUserActivity = async () => {
        if (!isConnected || !address) return;
        
        console.log("address", address);
        const deposits = await publicClient.getLogs({
            address: TBC_ADDRESS,
            event: parseAbiItem("event Deposit(address indexed user, address indexed pool, uint256 amount)"),
            args: {
                user: address
            },
            fromBlock: BigInt(`${process.env.NEXT_PUBLIC_BLOCK_NUMBER}`),
            toBlock: 'latest'
        });

        // Récupérer les retraits
        const withdrawals = await publicClient.getLogs({
            address: TBC_ADDRESS,
            event: parseAbiItem("event Withdraw(address indexed user, address indexed pool, uint256 amount)"),
            args: {
                user: address
            },
            fromBlock: BigInt(`${process.env.NEXT_PUBLIC_BLOCK_NUMBER}`),
            toBlock: 'latest'
        });

        // Combiner et trier les événements par date
        const allEvents = [...deposits, ...withdrawals].sort((a, b) => {
            return Number((b.blockNumber ?? BigInt(0)) - (a.blockNumber ?? BigInt(0)));
        });

        // Formater les événements
        const formattedEvents = await Promise.all(allEvents.map(async (event): Promise<UserActivityData> => {
            const isDeposit = event.eventName === 'Deposit';
            const block = await publicClient.getBlock({ blockNumber: event.blockNumber ?? BigInt(0) });
            return {
                type: isDeposit ? 'deposit' : 'withdraw',
                user: event.args.user ?? '0x0',
                pool: event.args.pool ?? '0x0',
                amount: Number(formatEther(event.args.amount ?? BigInt(0))),
                blockNumber: event.blockNumber ?? BigInt(0),
                timestamp: Number(block.timestamp)
            };
        }));
        setUserActivity(formattedEvents);
        return formattedEvents;
    }
    
    useWatchContractEvent({
        address: FARM_MANAGER_ADDRESS,
        abi: FARM_MANAGER_ABI,
        eventName: "FarmAdded",
        onLogs: (logs: any[]) => {
            logs.map((log) => {
                const farmAddress = log.args.farmAddress as string
                setExistingFarms(prev => {
                    if(!prev.includes(farmAddress)) {
                        return [...prev, farmAddress]
                    } else {
                        handleExistingFarms();
                    }
                    return prev;
                })
            })
        }
    })

    return {
        existingFarms,
        isLoading,
        userActivity
    }
}

