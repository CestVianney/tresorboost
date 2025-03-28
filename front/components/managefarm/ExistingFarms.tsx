'use client';
import React from 'react'
import TitleDivider from '../ui/titledivider';
import { useExistingFarms } from '../../hooks/useExistingFarms';
import { FarmData } from '@/constants/FarmData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FarmTypeEnum } from '@/enums/FarmTypeEnum';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

const ExistingFarms = () => {
    const farms = useExistingFarms();
    
    const shortenAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div>
            <TitleDivider title="Farms existantes" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                {farms.map((farm) => (
                    <Dialog key={farm.farmAddress}>
                        <DialogTrigger asChild>
                            <Card className="cursor-pointer hover:bg-accent transition-colors">
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
                            {/* Formulaire de modification ici */}
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        </div>
    )
}

export default ExistingFarms