'use client';
import React from 'react'
import { useState } from 'react';
import TitleDivider from '../ui/titledivider';
import { useExistingFarms } from '../../hooks/useFarms';
import { FarmData } from '@/constants/FarmData';
import { FARM_MANAGER_ABI, FARM_MANAGER_ADDRESS } from '@/constants/FarmManagerContract';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FarmTypeEnum } from '@/enums/FarmTypeEnum';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import shortenAddress from '@/utils/utils';
import { useWriteContract } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Input } from '../ui/input';

//TODO: refetch when farm is added
const ExistingFarms = () => {
    const { farms , refetch } = useExistingFarms();
    const { toast } = useToast();
    const { writeContract } = useWriteContract();
    const [selectedFarm, setSelectedFarm] = useState<FarmData | null>(null);
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    const [farmType, setFarmType] = useState<FarmTypeEnum>();
    const [farmAddress, setFarmAddress] = useState<string>();
    const [depositTokenAddress, setDepositTokenAddress] = useState<string>();
    const [rewardTokenAddress, setRewardTokenAddress] = useState<string>();
    const [depositFunction, setDepositFunction] = useState<string>();
    const [withdrawFunction, setWithdrawFunction] = useState<string>();
    const [claimFunction, setClaimFunction] = useState<string>();
    const [isActive, setIsActive] = useState<boolean>();
    const [rewardRate, setRewardRate] = useState<number>();

    const handleFarmSelect = (farm: FarmData) => {
        setSelectedFarm(farm);
        setFarmType(farm.farmType);
        setFarmAddress(farm.farmAddress);
        setDepositTokenAddress(farm.depositToken);
        setRewardTokenAddress(farm.rewardToken);
        setDepositFunction(farm.depositSelector);
        setWithdrawFunction(farm.withdrawSelector);
        setClaimFunction(farm.claimSelector);
        setIsActive(farm.isActive);
        setRewardRate(farm.rewardRate);
    };

    const handlerAddFarm = async () => {
        console.log(isActive, rewardRate, farmType, farmAddress, depositTokenAddress, rewardTokenAddress, depositFunction, withdrawFunction, claimFunction);
        try {
            await writeContract({
                address: FARM_MANAGER_ADDRESS,
                abi: FARM_MANAGER_ABI,
                functionName: 'addFarm',
                args: [
                    isActive,        
                    rewardRate,      
                    farmType,       
                    farmAddress,    
                    depositTokenAddress,  
                    rewardTokenAddress,   
                    depositFunction,      
                    withdrawFunction,     
                    claimFunction         
                ],
            });
            toast({
                title: 'Transaction envoyée'
            });
            setOpenDialogId(null);
            await refetch();
        } catch (error) {
            console.error("Erreur détaillée:", error);
            toast({
                title: 'Erreur',
                description: 'La transaction a échoué',
                variant: "destructive",
            });
        }
    }

    return (
        <div>
            <TitleDivider title="Farms existantes" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                {farms.map((farm) => (
                    <Dialog 
                        key={farm.farmAddress} 
                        open={openDialogId === farm.farmAddress}
                        onOpenChange={(open) => {
                            setOpenDialogId(open ? farm.farmAddress : null);
                            if (open) handleFarmSelect(farm);
                        }}
                    >
                        <DialogTrigger asChild>
                            <Card className={`cursor-pointer hover:bg-accent transition-colors relative ${
                                farm.farmType === FarmTypeEnum.PRUDENT ? 'bg-green-300' :
                                farm.farmType === FarmTypeEnum.DYNAMIQUE ? 'bg-yellow-300' :
                                'bg-orange-300'
                            }`}>
                                {!farm.isActive && (
                                    <div className="absolute inset-0 bg-gray-200/50" style={{
                                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)'
                                    }} />
                                )}
                                <CardHeader>
                                    <CardTitle className="text-sm font-mono">
                                        {shortenAddress(farm.farmAddress)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm">
                                            Type: {FarmTypeEnum[farm.farmType]}
                                        </p>
                                        <p className="text-sm">
                                            Reward Rate: {farm.rewardRate / 100}%
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Modifier la farm</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Type de farm</Label>
                                    <Select defaultValue={farm.farmType.toString()} onValueChange={(value) => setFarmType(Number(value))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez un type de farm" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(FarmTypeEnum)
                                                .filter(([key]) => isNaN(Number(key)))
                                                .map(([key, value]) => (
                                                    <SelectItem key={value} value={value.toString()}>
                                                        {key}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>

                                    <Label>Adresse de la farm</Label>
                                    <Input defaultValue={farm.farmAddress} onChange={(e) => setFarmAddress(e.target.value)} />

                                    <Label>Adresse du token de dépôt</Label>
                                    <Input defaultValue={farm.depositToken} onChange={(e) => setDepositTokenAddress(e.target.value)} />

                                    <Label>Adresse du token de récompense</Label>
                                    <Input defaultValue={farm.rewardToken} onChange={(e) => setRewardTokenAddress(e.target.value)} />

                                    <Label>Fonction de dépôt</Label>
                                    <Input defaultValue={farm.depositSelector} onChange={(e) => setDepositFunction(e.target.value)} />

                                    <Label>Fonction de retrait</Label>
                                    <Input defaultValue={farm.withdrawSelector} onChange={(e) => setWithdrawFunction(e.target.value)} />

                                    <Label>Fonction de réclamation</Label>
                                    <Input defaultValue={farm.claimSelector} onChange={(e) => setClaimFunction(e.target.value)} />

                                    <Label>Est active</Label>
                                    <RadioGroup
                                        defaultValue={farm.isActive.toString()}
                                        onValueChange={(value) => setIsActive(value === "true")}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="true" id="r1" />
                                            <Label htmlFor="r1">Oui</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="false" id="r2" />
                                            <Label htmlFor="r2">Non</Label>
                                        </div>
                                    </RadioGroup>

                                    <Label>Taux de récompense</Label>
                                    <Input type="number" defaultValue={farm.rewardRate} onChange={(e) => setRewardRate(Number(e.target.value))} />
                                </div>
                                <Button onClick={() => handlerAddFarm()}>Modifier</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        </div>
    )
}

export default ExistingFarms