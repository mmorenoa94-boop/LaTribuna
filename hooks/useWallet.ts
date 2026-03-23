'use client'
import { useQuery } from '@tanstack/react-query'

interface WalletData {
  balance: number
  transactions: Array<{
    id: string
    type: string
    amount: number
    description: string
    createdAt: string
  }>
}

export function useWallet() {
  return useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: () => fetch('/api/wallet').then((r) => r.json()),
    staleTime: 30_000,
  })
}
