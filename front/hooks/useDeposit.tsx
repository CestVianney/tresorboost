import { TBC_ABI, TBC_ADDRESS } from "@/constants/TresorBoostCoreContract";
import { useEffect, useState } from "react";
import { writeContract } from "viem/actions";
import { useAccount, useReadContract, useWriteContract } from "wagmi";

export const useDeposit = () => {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract } = useWriteContract()


  useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        await Promise.all([

        ])
    }
  }, []);

};
    
