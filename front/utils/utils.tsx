export default function shortenAddress(address: string | undefined) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatPercentage(percentage: number) {
    return (percentage / 100).toFixed(2);
}

export const formatNumberFromString = (number: string) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export const formatNumberFromNumber = (number: number) => {
    // also format the number to 2 decimal places except if it's a whole number
    if (number % 1 === 0) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    return number.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export const formatDateFromTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}