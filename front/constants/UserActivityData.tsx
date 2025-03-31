export interface UserActivityData {
    type: string;
    user: string;
    pool: string;
    amount: number;
    blockNumber: BigInt;
    timestamp: number;
}
