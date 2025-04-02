'use client';
import { checkOwnerage } from '@/hooks/useOwner'
import React from 'react'
import ExistingFarms from '@/components/managefarm/ExistingFarms';
import CreateFarm from '@/components/managefarm/CreateFarm';
import { Separator } from '@/components/ui/separator';

const page = () => {
    const isOwner = checkOwnerage();
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {isOwner ? (
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-4">
                        <div className="flex flex-row gap-8">
                            <div className="w-1/2">
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <ExistingFarms />
                                </div>
                            </div>
                            <Separator orientation="vertical" className="h-auto" />
                            <div className="w-1/2">
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <CreateFarm />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <h1 className="text-2xl text-red-500">Vous n'êtes pas le propriétaire du contrat</h1>
                    </div>
                </div>
            )}
        </div>
    )
}

export default page