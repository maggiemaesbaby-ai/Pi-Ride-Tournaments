// Owner configuration - Your Pi wallet addresses for platform owner access
const ENV_OWNER_WALLET =
  process.env.NEXT_PUBLIC_PI_WALLET || process.env.NEXT_PUBLIC_PI_WALLET_ADDRESS || process.env.NEXT_PUBLIC_OWNER_WALLET

// Your mainnet app wallet address
const DEFAULT_OWNER_WALLET = "GAEGQQTIWA5EEXN7HYXB2FPNPAYDGE4YYLS3AHBEMQJLSZXUDO7GHCDQ"

export const OWNER_WALLET_ADDRESS = ENV_OWNER_WALLET || DEFAULT_OWNER_WALLET

export function isOwner(walletAddress: string | undefined): boolean {
  if (!walletAddress) {
    return false
  }

  return walletAddress === OWNER_WALLET_ADDRESS || walletAddress === DEFAULT_OWNER_WALLET
}

export function getOwnerFee(isOwner: boolean, normalFee: number): number {
  return isOwner ? 0 : normalFee
}
