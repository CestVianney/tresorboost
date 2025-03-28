import { useWatchContractEvent } from 'wagmi';
import { FARM_MANAGER_ABI, FARM_MANAGER_ADDRESS } from "../constants/farmmanagercontract";
import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";
import { Abi, getAddress } from 'viem';
import { FarmData } from '@/constants/FarmData';

export const useExistingFarms = () => {
  const [farmAddresses, setFarmAddresses] = useState<string[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  
  // Écouter l'événement FarmAdded
  useWatchContractEvent({
    address: FARM_MANAGER_ADDRESS,
    abi: FARM_MANAGER_ABI,
    eventName: 'FarmAdded',
    onLogs(logs) {
      const addresses = logs.map(log => (log as any).args.farmAddress);
      console.log(addresses);
      setFarmAddresses(prev => Array.from(new Set([...prev, ...addresses])));
    },
  });

  const contracts = farmAddresses.map((farm) => ({
    abi: FARM_MANAGER_ABI as Abi,
    address: FARM_MANAGER_ADDRESS as `0x${string}`,
    functionName: "getFarmInfo",
    args: [getAddress(farm)],
  }));

  const { data: farmsData } = useReadContracts({
    contracts: contracts,
    query: {enabled: farmAddresses.length > 0},
  });

  useEffect(() => {
    if (farmsData) {
      console.log(farmsData);
      const processedFarmData = farmsData.map((data, index) => {
        const farmData = data?.result as FarmData;
        return farmData;
      });
      setFarms(processedFarmData);
    }
  }, [farmsData]);

  return farms;
};
    
