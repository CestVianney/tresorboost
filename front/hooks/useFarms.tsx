import { FARM_MANAGER_ABI, FARM_MANAGER_ADDRESS } from "../constants/FarmManagerContract";
import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";
import { Abi, getAddress } from 'viem';
import { FarmData } from '@/constants/FarmData';
import { useEventData } from "./useEventData";

export const useExistingFarms = () => {
  const [farms, setFarms] = useState<any[]>([]);
  const { existingFarms } = useEventData();

  const farmAddresses = existingFarms;
  console.log("farmAddresses", farmAddresses);

  const contracts = farmAddresses.map((farm) => ({
    abi: FARM_MANAGER_ABI as Abi,
    address: FARM_MANAGER_ADDRESS as `0x${string}`,
    functionName: "getFarmInfo",
    args: [getAddress(farm)],
  }));

  const { data: farmsData, refetch } = useReadContracts({
    contracts: contracts,
    query: {enabled: farmAddresses.length > 0},
  });

  useEffect(() => {
    if (farmsData) {
      const processedFarmData = farmsData.map((data, index) => {
        const farmData = data?.result as FarmData;
        return farmData;
      });
      setFarms(processedFarmData);
    }
  }, [farmsData]);

  return { farms, refetch };
};