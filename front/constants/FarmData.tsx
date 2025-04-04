export interface FarmData {    
    isActive: boolean;
    rewardRate: number;
    farmType: number;
    farmAddress: string;
    depositToken: string;
    depositSelector: string;
    withdrawSelector: string;
    maxWithdrawSelector: string;
    isVault4626: boolean;
}