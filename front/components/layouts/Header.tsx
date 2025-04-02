'use client';

import React, { useState } from "react"
import Image from 'next/image'
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useWriteContract } from "wagmi"
import { EURE_ADDRESS, EURE_ABI } from "@/constants/EUReContract"
import { parseEther } from "viem"
import { useAccount } from "wagmi";

const Header = ({ className }: { className?: string }) => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const { writeContract } = useWriteContract();
  const { address } = useAccount();

  const handleDeposit = async () => {
    try {
      const amountInWei = parseEther(depositAmount);
      await writeContract({
        address: EURE_ADDRESS,
        abi: EURE_ABI,
        functionName: 'mint',
        args: [address, amountInWei],
      });
      setIsDepositModalOpen(false);
      setDepositAmount("");
    } catch (error) {
      console.error("Erreur lors du dépôt:", error);
    }
  };

  return (
    <>
      <header className={`flex items-center justify-between p-4 ${className}`}>
        <div className="w-[100px]"></div>
        <div className="flex-shrink-0">
          <Image src="/images/tresorBoostHeader.png" width={100} height={100} alt="TresorBoostHeader" />
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="secondary" 
            size="sm" 
            className="group relative gap-2 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 hover:from-amber-200 hover:via-amber-300 hover:to-amber-200 border border-amber-300 text-amber-800 shadow-md hover:shadow-lg transition-all duration-300 font-semibold rounded-xl overflow-hidden"
            onClick={() => setIsDepositModalOpen(true)}
          >
            <div className="absolute inset-0 w-[30%] h-full bg-gradient-to-r from-transparent via-white/90 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <Plus className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Déposer de la trésorerie</span>
          </Button>
          <ConnectButton />
        </div>
      </header>

      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Déposer de la trésorerie</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                type="number"
                placeholder="Montant en EURe"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDepositModalOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDeposit}
              className="bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 hover:from-amber-200 hover:via-amber-300 hover:to-amber-200 border border-amber-300 text-amber-800"
            >
              Déposer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Header