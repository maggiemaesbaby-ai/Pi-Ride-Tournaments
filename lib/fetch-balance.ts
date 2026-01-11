export async function fetchBalance(userId: string): Promise<number> {
  try {
    const response = await fetch(`/api/arcade/user/balance?userId=${userId}`)
    const data = await response.json()
    return data.balance || 0
  } catch (error) {
    console.error("[v0] Error fetching balance:", error)
    return 0
  }
}
