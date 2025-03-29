export interface FarmData {    
    farmAddress: string;
    depositToken: string;
    rewardToken: string;
    depositSelector: string;
    withdrawSelector: string;
    claimSelector: string;
    farmType: number;
    rewardRate: number;
    isActive: boolean;
}