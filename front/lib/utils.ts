import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEther(value: BigInt) {
  return Number(value) / 1e18
}

export function formatNumbers(value: number) {
  return value.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  })
}
