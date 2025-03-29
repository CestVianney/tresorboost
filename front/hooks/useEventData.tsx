import { FARM_MANAGER_ADDRESS, FARM_MANAGER_ABI } from "@/constants/FarmManagerContract";
import { TBC_ADDRESS } from "@/constants/TresorBoostCoreContract";
import { publicClient } from "@/utils/publicClient";
import { useEffect, useState } from "react";
import { FarmData } from "@/constants/FarmData";
import { parseAbiItem } from "viem";
import { useWatchContractEvent } from "wagmi";
import { BlockTag } from "viem";

export const useEventData = () => {

    const [existingFarms, setExistingFarms] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            await Promise.all([
                handleExistingFarms()
            ])
            setIsLoading(false);
        }
        fetchInitialData();
    }, []);

    const handleExistingFarms = async () => {
        console.log('BLOCK_NUMBER:', process.env.NEXT_PUBLIC_BLOCK_NUMBER);
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
        isLoading
    }
}

