import { FARM_MANAGER_ADDRESS, FARM_MANAGER_ABI } from "@/constants/FarmManagerContract";
import { TBC_ABI, TBC_ADDRESS } from "@/constants/TresorBoostCoreContract";
import { EURE_ADDRESS, EURE_ABI } from "@/constants/EUReContract";
import { publicClient } from "@/utils/publicClient";
import { useEffect, useState, useCallback } from "react";
import { parseAbiItem } from "viem";
import { useWatchContractEvent, useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { UserActivityData } from "@/constants/UserActivityData";
import { DepositData } from "@/constants/DepositData";
import { Abi } from "viem";

export const useEventData = () => {
    const [existingFarms, setExistingFarms] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userActivity, setUserActivity] = useState<UserActivityData[]>([]);
    const [userData, setUserData] = useState<DepositData[]>([]);
    const { address, isConnected } = useAccount();

    const { data: balanceData, refetch: refetchBalance } = useReadContract({
        address: EURE_ADDRESS, 
        abi: EURE_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        query: {
            enabled: !!address
        }
    });

    const userEuroBalance = balanceData ? balanceData as bigint : BigInt(0);

    const contracts = userActivity
        .filter((activity: UserActivityData, index: number, self: UserActivityData[]) => 
            index === self.findIndex((a: UserActivityData) => a.pool === activity.pool)
        )
        .map((activity: UserActivityData) => {
            return {
                address: TBC_ADDRESS as `0x${string}`,
                abi: TBC_ABI as Abi,
                functionName: 'deposits',
                args: [activity.user as `0x${string}`, activity.pool as `0x${string}`],
            }
        });

    const { data: depositsData, refetch: refetchDeposits } = useReadContracts({
        contracts: contracts,
        query: {
            enabled: userActivity.length > 0 && !!address
        }
    });

    useEffect(() => {
        if (depositsData) {
            const validData: DepositData[] = depositsData
                .filter((item): item is { result: { amount: bigint; rewardAmount: bigint; lastTimeRewardCalculated: bigint; pool: string }; status: "success" } => 
                    item.status === "success" && item.result !== undefined)
                .map((item: any) => {
                    const [pool, amount, rewardAmount, lastTimeRewardCalculated] = item.result;
                    return {
                        pool: pool as `0x${string}`,
                        amount: Number(formatEther(amount)),
                        rewardAmount: Number(formatEther(rewardAmount)),
                        lastTimeRewardCalculated: Number(lastTimeRewardCalculated)
                    };
                });
            setUserData(validData);
        }
    }, [depositsData]);

    useEffect(() => {
        let mounted = true;

        const fetchInitialData = async () => {
            if (!isConnected || !address) return;
            
            setIsLoading(true);
            try {
                await Promise.all([
                    handleExistingFarms(),
                    handleUserActivity(),
                    refetchBalance(),
                    refetchDeposits()
                ]);
                if (mounted) {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchInitialData();

        return () => {
            mounted = false;
        };
    }, [isConnected, address, refetchBalance, refetchDeposits]);

    const handleExistingFarms = useCallback(async () => {
        try {
            const farmAddresses = await publicClient.getLogs({
                address: FARM_MANAGER_ADDRESS,
                event: parseAbiItem("event FarmAdded(address indexed farmAddress)"),
                fromBlock: BigInt(`${process.env.NEXT_PUBLIC_BLOCK_NUMBER}`),
                toBlock: 'latest'  
            });

            const uniqueFarms = new Set<string>();
            farmAddresses.forEach((log) => {
                const farmAddress = log.args.farmAddress as string;
                if (farmAddress) {
                    uniqueFarms.add(farmAddress);
                }
            });

            setExistingFarms(Array.from(uniqueFarms));
        } catch (error) {
            console.error('Error fetching farms:', error);
        }
    }, []);

    const handleUserActivity = useCallback(async () => {
        if (!isConnected || !address) return;
        
        try {
            const [deposits, withdrawals, rewardsClaimed, feesClaimed, coveredSlippage] = await Promise.all([
                publicClient.getLogs({
                    address: TBC_ADDRESS,
                    event: parseAbiItem("event Deposit(address indexed user, address indexed pool, uint256 amount)"),
                    args: { user: address },
                    fromBlock: BigInt(`${process.env.NEXT_PUBLIC_BLOCK_NUMBER}`),
                    toBlock: 'latest'
                }),
                publicClient.getLogs({
                    address: TBC_ADDRESS,
                    event: parseAbiItem("event Withdraw(address indexed user, address indexed pool, uint256 amount)"),
                    args: { user: address },
                    fromBlock: BigInt(`${process.env.NEXT_PUBLIC_BLOCK_NUMBER}`),
                    toBlock: 'latest'
                }),
                publicClient.getLogs({
                    address: TBC_ADDRESS,
                    event: parseAbiItem("event RewardsClaimed(address indexed user, address indexed pool, uint256 amount)"),
                    args: { user: address },
                    fromBlock: BigInt(`${process.env.NEXT_PUBLIC_BLOCK_NUMBER}`),
                    toBlock: 'latest'
                }),
                publicClient.getLogs({
                    address: TBC_ADDRESS,
                    event: parseAbiItem("event FeesClaimed(address indexed user, address indexed pool, uint256 amount)"),
                    args: { user: address },
                    fromBlock: BigInt(`${process.env.NEXT_PUBLIC_BLOCK_NUMBER}`),
                    toBlock: 'latest'
                }),
                publicClient.getLogs({
                    address: TBC_ADDRESS,
                    event: parseAbiItem("event CoveredSlippage(address indexed user, address indexed pool, uint256 amount)"),
                    args: { user: address },
                    fromBlock: BigInt(`${process.env.NEXT_PUBLIC_BLOCK_NUMBER}`),
                    toBlock: 'latest'
                })
            ]);

            // Filtrer les événements pour ne garder que ceux de l'utilisateur connecté
            const filterUserEvents = (events: any[]) => {
                return events.filter(event => 
                    event.args.user?.toLowerCase() === address.toLowerCase()
                );
            };

            const userDeposits = filterUserEvents(deposits);
            const userWithdrawals = filterUserEvents(withdrawals);
            const userRewardsClaimed = filterUserEvents(rewardsClaimed);
            const userFeesClaimed = filterUserEvents(feesClaimed);
            const userCoveredSlippage = filterUserEvents(coveredSlippage);

            const allEvents = [...userDeposits, ...userWithdrawals, ...userRewardsClaimed, ...userFeesClaimed, ...userCoveredSlippage]
                .sort((a, b) => Number((b.blockNumber ?? BigInt(0)) - (a.blockNumber ?? BigInt(0))));

            const formattedEvents = await Promise.all(allEvents.map(async (event): Promise<UserActivityData> => {
                const block = await publicClient.getBlock({ blockNumber: event.blockNumber ?? BigInt(0) });
                return {
                    type: event.eventName,
                    user: event.args.user ?? '0x0',
                    pool: event.args.pool ?? '0x0',
                    amount: Number(formatEther(event.args.amount ?? BigInt(0))) ?? BigInt(0),
                    blockNumber: event.blockNumber ?? BigInt(0),
                    timestamp: Number(block.timestamp),
                    hash: event.transactionHash
                };
            }));

            setUserActivity(formattedEvents);
        } catch (error) {
            console.error('Error fetching user activity:', error);
        }
    }, [isConnected, address]);
    
    useWatchContractEvent({
        address: FARM_MANAGER_ADDRESS,
        abi: FARM_MANAGER_ABI,
        eventName: "FarmAdded",
        onLogs: (logs: any[]) => {
            logs.forEach((log) => {
                const farmAddress = log.args.farmAddress as string;
                if (farmAddress) {
                    setExistingFarms(prev => {
                        if (!prev.includes(farmAddress)) {
                            return [...prev, farmAddress];
                        }
                        return prev;
                    });
                }
            });
        }
    });

    useWatchContractEvent({
        address: TBC_ADDRESS,
        abi: TBC_ABI,
        eventName: "Deposit",
        args: {
            user: address
        },
        onLogs: async (logs: any[]) => {
            const userLogs = logs.filter(log => 
                log.args.user?.toLowerCase() === address?.toLowerCase()
            );
            if (userLogs.length > 0) {
                await Promise.all([
                    handleUserActivity(),
                    refetchBalance(),
                    refetchDeposits()
                ]);
            }
        }
    });

    useWatchContractEvent({
        address: TBC_ADDRESS,
        abi: TBC_ABI,
        eventName: "Withdraw",
        args: {
            user: address
        },
        onLogs: async (logs: any[]) => {
            const userLogs = logs.filter(log => 
                log.args.user?.toLowerCase() === address?.toLowerCase()
            );
            if (userLogs.length > 0) {
                await Promise.all([
                    handleUserActivity(),
                    refetchBalance(),
                    refetchDeposits()
                ]);
            }
        }
    });

    return {
        existingFarms,
        isLoading,
        userActivity,
        userEuroBalance,
        userData
    };
};

