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
    const [maxWithdrawFunction, setMaxWithdrawFunction] = useState<string>();
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
        setMaxWithdrawFunction(farm.maxWithdrawSelector);
        setIsActive(farm.isActive);
        setRewardRate(farm.rewardRate);
    };

    const handlerAddFarm = async () => {
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
                    claimFunction,
                    maxWithdrawFunction
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Fermes existantes</h2>
                <div className="text-sm text-gray-500">
                    {farms.length} ferme{farms.length > 1 ? 's' : ''} active{farms.length > 1 ? 's' : ''}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 relative overflow-hidden min-h-[140px] ${
                                farm.farmType === FarmTypeEnum.PRUDENT ? 'border-blue-200 bg-blue-50/50' :
                                farm.farmType === FarmTypeEnum.DYNAMIQUE ? 'border-orange-200 bg-orange-50/50' :
                                'border-yellow-200 bg-yellow-50/50'
                            }`}>
                                {!farm.isActive && (
                                    <div className="absolute inset-0 bg-gray-200/50" style={{
                                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)'
                                    }} />
                                )}
                                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                                    farm.farmType === FarmTypeEnum.PRUDENT ? 'bg-blue-100 text-blue-800' :
                                    farm.farmType === FarmTypeEnum.DYNAMIQUE ? 'bg-orange-100 text-orange-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {FarmTypeEnum[farm.farmType]}
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-mono">
                                        {shortenAddress(farm.farmAddress)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Taux de récompense</span>
                                            <span className="text-sm font-medium">{farm.rewardRate / 100}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Statut</span>
                                            <span className={`text-sm font-medium ${
                                                farm.isActive ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {farm.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Modifier la farm</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
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
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Taux de récompense</Label>
                                        <Input type="number" defaultValue={farm.rewardRate} onChange={(e) => setRewardRate(Number(e.target.value))} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Adresse de la farm</Label>
                                        <Input defaultValue={farm.farmAddress} onChange={(e) => setFarmAddress(e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Adresse du token de dépôt</Label>
                                        <Input defaultValue={farm.depositToken} onChange={(e) => setDepositTokenAddress(e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Adresse du token de récompense</Label>
                                        <Input defaultValue={farm.rewardToken} onChange={(e) => setRewardTokenAddress(e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Fonction de dépôt</Label>
                                        <Input defaultValue={farm.depositSelector} onChange={(e) => setDepositFunction(e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Fonction de retrait</Label>
                                        <Input defaultValue={farm.withdrawSelector} onChange={(e) => setWithdrawFunction(e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Fonction de réclamation</Label>
                                        <Input defaultValue={farm.claimSelector} onChange={(e) => setClaimFunction(e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Fonction de retrait maximum</Label>
                                        <Input defaultValue={farm.maxWithdrawSelector} onChange={(e) => setMaxWithdrawFunction(e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Statut</Label>
                                        <RadioGroup
                                            defaultValue={farm.isActive.toString()}
                                            onValueChange={(value) => setIsActive(value === "true")}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="true" id="r1" />
                                                <Label htmlFor="r1">Active</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="false" id="r2" />
                                                <Label htmlFor="r2">Inactive</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handlerAddFarm} className="w-full sm:w-auto">
                                        Enregistrer les modifications
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        </div>
    )
}

export default ExistingFarms