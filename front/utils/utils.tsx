export default function shortenAddress(address: string | undefined) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatPercentage(percentage: number) {
    return (percentage / 100).toFixed(2);
}