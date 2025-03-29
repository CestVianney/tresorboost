'use client';
import { checkOwnerage } from '@/hooks/useOwner'
import React from 'react'
import ExistingFarms from '@/components/managefarm/ExistingFarms';
import CreateFarm from '@/components/managefarm/CreateFarm';
import { Separator } from '@/components/ui/separator';

const page = () => {
    const isOwner = checkOwnerage();
    return (
        <div>
            {isOwner ? (
                <div className="flex flex-row h-full">
                    <div className="w-5/12">
                        <ExistingFarms />
                    </div>
                    <div className="w-2/12 flex justify-center">
                        <Separator orientation="vertical" className="h-full" />
                    </div>
                    <div className="w-5/12">
                        <CreateFarm />
                    </div>
                </div>) :
                (<div>
                    <h1>You are not the owner of the contract</h1>
                </div>)
            }
        </div>
    )
}

export default page