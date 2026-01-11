"use client"

import { Button } from "@/components/ui/button"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { CheckCircle2, Wallet } from '@/lib/icons'

export function ConnectWalletButton() {
  const { connect, isConnected, user } = usePiWallet()

  if (isConnected && user) {
    return (
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <div className="flex-1">
          <p className="font-semibold text-green-900 dark:text-green-100">Wallet Connected</p>
          <p className="text-sm text-green-700 dark:text-green-300">@{user.username}</p>
        </div>
      </div>
    )
  }

  return (
    <Button onClick={connect} className="w-full" size="lg">
      <Wallet className="w-4 h-4 mr-2" />
      Connect Pi Wallet to Continue
    </Button>
  )
}
