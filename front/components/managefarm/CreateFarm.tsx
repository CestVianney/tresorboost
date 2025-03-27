import React, { useState } from 'react'
import TitleDivider from '../ui/titledivider'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select'
import { FarmTypeEnum } from '@/enums/FarmTypeEnum'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { useWriteContract } from 'wagmi'
import { FARM_MANAGER_ABI, FARM_MANAGER_ADDRESS } from '@/constants/farmmanagercontract'
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
    const [isActive, setIsActive] = useState<boolean>(true);
    const [rewardRate, setRewardRate] = useState<number>(400);

    const handlerAddFarm = async() => {
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
        <div>
            <TitleDivider title="Créer une farm" />
            <Card>
                <CardHeader>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Type de farm</Label>
                            <Select onValueChange={(value) => setFarmType(Number(value))}>
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
                            <Input value={farmAddress} onChange={(e) => setFarmAddress(e.target.value)} />

                            <Label>Adresse du token de dépôt</Label>
                            <Input value={depositTokenAddress} onChange={(e) => setDepositTokenAddress(e.target.value)} />

                            <Label>Adresse du token de récompense</Label>
                            <Input value={rewardTokenAddress} onChange={(e) => setRewardTokenAddress(e.target.value)} />

                            <Label>Fonction de dépôt</Label>
                            <Input value={depositFunction} onChange={(e) => setDepositFunction(e.target.value)} />

                            <Label>Fonction de retrait</Label>
                            <Input value={withdrawFunction} onChange={(e) => setWithdrawFunction(e.target.value)} />

                            <Label>Fonction de réclamation</Label>
                            <Input value={claimFunction} onChange={(e) => setClaimFunction(e.target.value)} />

                            <Label>Est active</Label>
                            <RadioGroup 
                                defaultValue="true" 
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
                            <Input type="number" value={rewardRate} onChange={(e) => setRewardRate(Number(e.target.value))} />
                        </div>
                        <Button onClick={() => handlerAddFarm()}>Créer</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default CreateFarm