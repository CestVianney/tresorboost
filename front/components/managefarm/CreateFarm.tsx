import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select'
import { FarmTypeEnum } from '@/enums/FarmTypeEnum'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { useWriteContract } from 'wagmi'
import { FARM_MANAGER_ABI, FARM_MANAGER_ADDRESS } from '@/constants/FarmManagerContract'
import { Button } from '../ui/button'
import { useToast } from '@/hooks/use-toast'

const CreateFarm = () => {

    const { writeContract } = useWriteContract();
    const { toast } = useToast();
    
    const [farmType, setFarmType] = useState<FarmTypeEnum>(FarmTypeEnum.PRUDENT);
    const [farmAddress, setFarmAddress] = useState<string>('0xd69bc314bdaa329eb18f36e4897d96a3a48c3eef');
    const [depositTokenAddress, setDepositTokenAddress] = useState<string>('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
    const [rewardTokenAddress, setRewardTokenAddress] = useState<string>('0x0000000000000000000000000000000000000000');
    const [depositFunction, setDepositFunction] = useState<string>('deposit(uint256)');
    const [withdrawFunction, setWithdrawFunction] = useState<string>('withdraw(uint256)');
    const [claimFunction, setClaimFunction] = useState<string>('getRewards(address)');
    const [maxWithdrawFunction, setMaxWithdrawFunction] = useState<string>('getMaxWithdraw(address)');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [rewardRate, setRewardRate] = useState<number>(400);

    const handlerAddFarm = async() => {
        try {
            const hash = await writeContract({
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
                title: 'Transaction confirmée'
            });

            // Réinitialiser les champs après succès
            setRewardRate(0);
            setFarmAddress('');
            setDepositTokenAddress('');
            setRewardTokenAddress('');
            setDepositFunction('');
            setWithdrawFunction('');
            setClaimFunction('');
            setIsActive(true);
            setFarmType(FarmTypeEnum.PRUDENT);

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
                <h2 className="text-2xl font-semibold">Créer une nouvelle farm</h2>
            </div>
            <Card className="bg-white shadow-lg">
                <CardHeader className="border-b pb-4">
                    <CardTitle className="text-xl font-semibold">Configuration de la farm</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Type de farm</Label>
                                <Select onValueChange={(value) => setFarmType(Number(value))}>
                                    <SelectTrigger className="w-full">
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
                                <Label className="text-sm font-medium">Taux de récompense</Label>
                                <Input 
                                    type="number" 
                                    value={rewardRate} 
                                    onChange={(e) => setRewardRate(Number(e.target.value))}
                                    className="w-full"
                                    placeholder="Ex: 400 pour 4%"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Statut</Label>
                                <RadioGroup 
                                    defaultValue="true" 
                                    onValueChange={(value) => setIsActive(value === "true")}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="true" id="r1" />
                                        <Label htmlFor="r1" className="text-sm">Active</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="false" id="r2" />
                                        <Label htmlFor="r2" className="text-sm">Inactive</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Adresse de la farm</Label>
                                <Input 
                                    value={farmAddress} 
                                    onChange={(e) => setFarmAddress(e.target.value)}
                                    className="w-full font-mono text-sm"
                                    placeholder="0x..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Adresse du token de dépôt</Label>
                                <Input 
                                    value={depositTokenAddress} 
                                    onChange={(e) => setDepositTokenAddress(e.target.value)}
                                    className="w-full font-mono text-sm"
                                    placeholder="0x..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Adresse du token de récompense</Label>
                                <Input 
                                    value={rewardTokenAddress} 
                                    onChange={(e) => setRewardTokenAddress(e.target.value)}
                                    className="w-full font-mono text-sm"
                                    placeholder="0x..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-medium">Fonctions de la farm</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Fonction de dépôt</Label>
                                <Input 
                                    value={depositFunction} 
                                    onChange={(e) => setDepositFunction(e.target.value)}
                                    className="w-full font-mono text-sm"
                                    placeholder="deposit(uint256)"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Fonction de retrait</Label>
                                <Input 
                                    value={withdrawFunction} 
                                    onChange={(e) => setWithdrawFunction(e.target.value)}
                                    className="w-full font-mono text-sm"
                                    placeholder="withdraw(uint256)"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Fonction de réclamation</Label>
                                <Input 
                                    value={claimFunction} 
                                    onChange={(e) => setClaimFunction(e.target.value)}
                                    className="w-full font-mono text-sm"
                                    placeholder="getRewards(address)"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Fonction de retrait maximum</Label>
                                <Input 
                                    value={maxWithdrawFunction} 
                                    onChange={(e) => setMaxWithdrawFunction(e.target.value)}
                                    className="w-full font-mono text-sm"
                                    placeholder="getMaxWithdraw(address)"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <Button 
                            onClick={handlerAddFarm}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
                        >
                            Créer la farm
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default CreateFarm