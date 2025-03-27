import { TBC_ABI, TBC_ADDRESS } from "@/constants/tresorboostcorecontract";
import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";

export const checkOwnerage = () => {
  const { address, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const { data: ownerAddress } = useReadContract({
    address: TBC_ADDRESS,
    abi: TBC_ABI,
    functionName: "owner",
  });

  useEffect(() => {
    if (isConnected && address && ownerAddress && typeof ownerAddress === 'string') {
      setIsOwner(ownerAddress.toLowerCase() === address.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [isConnected, address, ownerAddress]);

  return isOwner;
};
    
