"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Mail,
  Phone,
  TrendingUp,
  DollarSign,
  Trophy,
  Gamepad2,
  LogOut,
} from "lucide-react"
import { MarketplaceDB, type Order } from "@/lib/marketplace-db"

interface Driver {
  id: string
  full_name: string
  email: string
  phone: string
  service_cities: string[]
  vehicle_info: {
    make: string
    model: string
    year: string
    type: string
    color?: string
    plate?: string
  }
  is_on_duty: boolean
  total_rides: number
  earnings_pi: number
  rating: number
  application_status: string
  created_at: string
}

interface DriverApplication {
  id: string
  full_name: string
  email: string
  phone: string
  service_cities: string[]
  vehicle_info: {
    make: string
    model: string
    year: string
    type: string
    color?: string
    plate?: string
  }
  drivers_license: string
  status: string
  created_at: string
}

interface WaitlistEntry {
  id: string
  pi_user_id: string
  email: string
  city: string
  location: {
    lat: number
    lng: number
  }
  notified: boolean
  created_at: string
}

interface CityStats {
  city: string
  onDutyDrivers: number
  totalDrivers: number
  waitlistCount: number
}

interface PotWalletData {
  potWallet: {
    total_balance: number
  }
  stats: {
    totalLockedForPayouts: number
    lockedMatchesCount: number
    profitAvailable: number
  }
  transactions: any[]
  _timestamp?: number // Added for re-render forcing
}

export default function AdminDashboard() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [applications, setApplications] = useState<DriverApplication[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [cityStats, setCityStats] = useState<CityStats[]>([])
  const [tournamentStats, setTournamentStats] = useState<any>(null)
  const [activeTournaments, setActiveTournaments] = useState<any[]>([])
  const [userBalances, setUserBalances] = useState<any[]>([])
  const [marketplaceStats, setMarketplaceStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [potWalletData, setPotWalletData] = useState<PotWalletData | null>(null)
  const [isPotRefreshing, setIsPotRefreshing] = useState(false)
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([])
  const [showAdminCashout, setShowAdminCashout] = useState(false)
  const [adminCashoutAmount, setAdminCashoutAmount] = useState("")
  const [processingCashout, setProcessingCashout] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [
        driversRes,
        applicationsRes,
        waitlistRes,
        statsRes,
        tournamentStatsRes,
        activeTournamentsRes,
        balancesRes,
        marketplaceRes,
      ] = await Promise.all([
        fetch("/api/admin/drivers"),
        fetch("/api/admin/applications"),
        fetch("/api/admin/waitlist"),
        fetch("/api/admin/city-stats"),
        fetch("/api/admin/tournaments/stats"),
        fetch("/api/admin/tournaments/active"),
        fetch("/api/admin/user-balances"),
        fetch("/api/marketplace/products"),
      ])

      const driversData = await driversRes.json()
      const applicationsData = await applicationsRes.json()
      const waitlistData = await waitlistRes.json()
      const statsData = await statsRes.json()
      const tournamentStatsData = await tournamentStatsRes.json()
      const activeTournamentsData = await activeTournamentsRes.json()
      const balancesData = await balancesRes.json()
      const marketplaceData = await marketplaceRes.json()

      if (driversData.success) setDrivers(driversData.drivers)
      if (applicationsData.success) setApplications(applicationsData.applications)
      if (waitlistData.success) setWaitlist(waitlistData.waitlist)
      if (statsData.success) setCityStats(statsData.stats)
      if (tournamentStatsData.success) setTournamentStats(tournamentStatsData)
      if (activeTournamentsData.success) {
        setActiveTournaments(activeTournamentsData.activeTournaments)
      }
      if (balancesData.success) setUserBalances(balancesData.userBalances)

      if (marketplaceData.products) {
        setMarketplaceProducts(marketplaceData.products)
        console.log("[v0] Admin Dashboard - Loaded products from database:", marketplaceData.products.length)
      }

      if (typeof window !== "undefined") {
        const dbProducts = marketplaceData.products || []
        const allOrders = MarketplaceDB.getAllOrders()
        const revenue = allOrders.reduce((sum, order) => sum + order.amount, 0)
        const pending = allOrders.filter((o) => o.status === "pending" || o.status === "paid").length

        setMarketplaceStats({
          totalProducts: dbProducts.length,
          totalOrders: allOrders.length,
          totalRevenue: revenue,
          pendingOrders: pending,
        })
      }
    } catch (error) {
      console.error("[v0] Failed to fetch dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPotWalletData = async () => {
    setIsPotRefreshing(true)
    try {
      const timestamp = Date.now()
      const res = await fetch(`/api/admin/pot-wallet?t=${timestamp}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`)
      }

      const data = await res.json()
      setPotWalletData({ ...data, _timestamp: timestamp })
    } catch (error: any) {
      console.error("Error fetching pot wallet:", error)
      alert(`Failed to refresh pot wallet: ${error.message}`)
    } finally {
      setIsPotRefreshing(false)
    }
  }

  const handleRefreshPotClick = () => {
    console.log("🔵 POT REFRESH CLICKED", new Date().toISOString())
    fetchPotWalletData()
  }

  const handleApproveApplication = async (applicationId: string) => {
    try {
      const response = await fetch("/api/driver-application/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, reviewedBy: "admin" }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Application Approved",
          description: "Driver account created and notifications sent",
        })
        fetchDashboardData()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const response = await fetch("/api/admin/applications/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Application Rejected",
          description: "Applicant has been notified",
        })
        fetchDashboardData()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      router.push("/login/admin/01")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  const handleAdminCashout = async () => {
    if (!adminCashoutAmount || isNaN(Number(adminCashoutAmount))) {
      alert("Please enter a valid amount")
      return
    }

    const amount = Number(adminCashoutAmount)
    const available = potWalletData?.stats?.profitAvailable || 0

    if (amount <= 0) {
      alert("Amount must be greater than 0")
      return
    }

    if (amount > available) {
      alert(`Insufficient balance. Available: ${available.toFixed(4)} π`)
      return
    }

    try {
      console.log("[v0] Initiating admin cashout:", amount)
      const response = await fetch("/api/admin/cashout-pot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })

      if (response.ok) {
        alert("Cashout successful! Pi will be transferred to your wallet shortly.")
        setShowAdminCashout(false)
        setAdminCashoutAmount("")
        await fetchPotWalletData()
      } else {
        const data = await response.json()
        alert(data.error || "Cashout failed")
      }
    } catch (error) {
      console.error("[v0] Admin cashout error:", error)
      alert("Failed to process cashout")
    }
  }

  useEffect(() => {
    console.log("[v0] Admin Dashboard mounted - loading data")
    fetchDashboardData()
    fetchPotWalletData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const totalDrivers = drivers.length
  const onDutyDrivers = drivers.filter((d) => d.is_on_duty).length
  const pendingApplications = applications.filter((a) => a.status === "pending").length
  const totalWaitlist = waitlist.length

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor all platform operations</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchDashboardData} variant="outline">
              Refresh Data
            </Button>
            <Button onClick={() => handleRefreshPotClick()} variant="outline" disabled={isPotRefreshing}>
              {isPotRefreshing ? "Refreshing..." : "Refresh Pot"}
            </Button>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {potWalletData && (
          <Card className="border-yellow-500/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">💰 App Pot Wallet</CardTitle>
                  <CardDescription>Central wallet for balance-based entries and payouts</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAdminCashout(true)}
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Cash Out
                  </Button>
                  <Button onClick={handleRefreshPotClick} variant="outline" size="sm" disabled={isPotRefreshing}>
                    {isPotRefreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div key={potWalletData?._timestamp || "initial"} className="grid md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Pot Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">
                      {Number(potWalletData.potWallet.total_balance).toFixed(2)}π
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">All Pi in the pot</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Locked for Payouts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {potWalletData.stats.totalLockedForPayouts.toFixed(2)}π
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {potWalletData.stats.lockedMatchesCount} active matches
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Available Pi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {(
                        Number(potWalletData.potWallet.total_balance) - potWalletData.stats.totalLockedForPayouts
                      ).toFixed(2)}
                      π
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Can be used for payouts</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">App Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {potWalletData.stats.profitAvailable.toFixed(2)}π
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Revenue after payouts</p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-2">💡 How the Pot Works</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • <strong>Entry Fees</strong>: All balance-based tournament entries go into the pot
                  </li>
                  <li>
                    • <strong>Locked Pi</strong>: Prize pools for active matches are locked until games complete
                  </li>
                  <li>
                    • <strong>Available Pi</strong>: Pot balance minus locked Pi, ready for new payouts
                  </li>
                  <li>
                    • <strong>App Profit</strong>: Remaining Pi after all active match payouts
                  </li>
                  <li>
                    • <strong>🤖 Auto-Funding</strong>: If pot balance is insufficient for a match, the system
                    automatically transfers Pi from your app wallet
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Recent Pot Transactions</h4>
                {potWalletData.transactions.slice(0, 10).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">
                        {tx.type === "auto_fund_from_wallet" && "🤖 "}
                        {tx.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-muted-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${tx.type === "payout" ? "text-red-600" : "text-green-600"}`}>
                        {tx.type === "payout" ? "-" : "+"}
                        {Number(tx.amount).toFixed(2)}π
                      </p>
                      <p className="text-xs text-muted-foreground">Balance: {Number(tx.balance_after).toFixed(2)}π</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {tournamentStats && (
          <>
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Total Revenue (30d)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tournamentStats.stats.totalRevenue.toFixed(2)}π</div>
                  <p className="text-xs text-muted-foreground">
                    {tournamentStats.stats.totalPiCollected.toFixed(2)}π direct +{" "}
                    {tournamentStats.stats.totalBalanceCollected.toFixed(2)}π balance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    App Profit (30d)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{tournamentStats.stats.appProfit.toFixed(2)}π</div>
                  <p className="text-xs text-muted-foreground">
                    {tournamentStats.stats.totalPayouts.toFixed(2)}π paid out
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    Tournament Entries (30d)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tournamentStats.stats.totalEntries}</div>
                  <p className="text-xs text-muted-foreground">{tournamentStats.stats.winnersCount} winners</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Active Tournaments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{tournamentStats.stats.activeTournaments}</div>
                  <p className="text-xs text-muted-foreground">Currently running</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Tier (30 days)</CardTitle>
                <CardDescription>Tournament entry revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tournamentStats.revenueByTier.map((tier: any) => (
                    <div key={tier.tier} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Tier {tier.tier}</p>
                        <p className="text-sm text-muted-foreground">{tier.entries} entries</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {(
                            Number.parseFloat(tier.pi_revenue || 0) + Number.parseFloat(tier.balance_revenue || 0)
                          ).toFixed(2)}
                          π
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Number.parseFloat(tier.pi_revenue || 0).toFixed(2)}π direct +{" "}
                          {Number.parseFloat(tier.balance_revenue || 0).toFixed(2)}π balance
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Games by Revenue (30 days)</CardTitle>
                <CardDescription>Most popular tournament games</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tournamentStats.revenueByGame.slice(0, 5).map((game: any) => (
                    <div key={game.game_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{game.game_id}</p>
                        <p className="text-sm text-muted-foreground">{game.entries} entries</p>
                      </div>
                      <p className="font-bold">{Number.parseFloat(game.total_revenue).toFixed(2)}π</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDrivers}</div>
              <p className="text-xs text-muted-foreground">Active driver accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">On Duty Now</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{onDutyDrivers}</div>
              <p className="text-xs text-muted-foreground">Available for rides</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingApplications}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Waitlist Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalWaitlist}</div>
              <p className="text-xs text-muted-foreground">Waiting for drivers</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>City Overview</CardTitle>
            <CardDescription>Driver availability and waitlist by city</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cityStats.map((stat) => (
                <div key={stat.city} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{stat.city}</p>
                      <p className="text-sm text-muted-foreground">
                        {stat.onDutyDrivers} on duty / {stat.totalDrivers} total
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={stat.onDutyDrivers > 0 ? "default" : "secondary"}>
                      {stat.onDutyDrivers > 0 ? "Active" : "No Drivers"}
                    </Badge>
                    {stat.waitlistCount > 0 && <Badge variant="outline">{stat.waitlistCount} waiting</Badge>}
                  </div>
                </div>
              ))}
              {cityStats.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No city data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="tournaments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="balances">User Balances</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace ({marketplaceStats.totalProducts})</TabsTrigger>
            <TabsTrigger value="applications">Applications ({pendingApplications})</TabsTrigger>
            <TabsTrigger value="drivers">Drivers ({totalDrivers})</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist ({totalWaitlist})</TabsTrigger>
          </TabsList>

          <TabsContent value="tournaments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Tournaments</CardTitle>
                <CardDescription>Currently running tournament matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeTournaments.map((tournament: any) => (
                    <div key={tournament.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{tournament.game_id}</CardTitle>
                          <CardDescription>
                            Tier {tournament.tier} • {tournament.entry_fee_pi}π entry
                          </CardDescription>
                        </div>
                        <Badge variant={tournament.status === "active" ? "default" : "secondary"}>
                          {tournament.status}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{tournament.participant_count} participants</span>
                        <span>{tournament.completed_matches} matches completed</span>
                      </div>
                    </div>
                  ))}
                  {activeTournaments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No active tournaments</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Balances</CardTitle>
                <CardDescription>Top users by balance amount</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userBalances.slice(0, 20).map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.username || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {user.wallet_address?.slice(0, 16)}...
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {user.tournament_entries} entries • {Number.parseFloat(user.total_winnings || 0).toFixed(2)}π
                          won
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{Number.parseFloat(user.balance).toFixed(2)}π</p>
                        <p className="text-xs text-muted-foreground">Balance</p>
                      </div>
                    </div>
                  ))}
                  {userBalances.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No user balances found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            {applications
              .filter((a) => a.status === "pending")
              .map((app) => (
                <Card key={app.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{app.full_name}</CardTitle>
                        <CardDescription>Applied {new Date(app.created_at).toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge>Pending Review</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{app.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{app.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{app.service_cities.join(", ")}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {app.vehicle_info.year} {app.vehicle_info.make} {app.vehicle_info.model}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Type:</span> {app.vehicle_info.type}
                        </div>
                        {app.vehicle_info.plate && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Plate:</span> {app.vehicle_info.plate}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                      <Button onClick={() => handleApproveApplication(app.id)} className="flex-1">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Driver
                      </Button>
                      <Button onClick={() => handleRejectApplication(app.id)} variant="destructive" className="flex-1">
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {applications.filter((a) => a.status === "pending").length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending applications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            {drivers.map((driver) => (
              <Card key={driver.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{driver.full_name}</CardTitle>
                      <CardDescription>{driver.email}</CardDescription>
                    </div>
                    <Badge variant={driver.is_on_duty ? "default" : "secondary"}>
                      {driver.is_on_duty ? "On Duty" : "Off Duty"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Service Cities</p>
                      <div className="flex flex-wrap gap-1">
                        {driver.service_cities.map((city) => (
                          <Badge key={city} variant="outline" className="text-xs">
                            {city}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Vehicle</p>
                      <p className="text-sm text-muted-foreground">
                        {driver.vehicle_info.year} {driver.vehicle_info.make} {driver.vehicle_info.model}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Performance</p>
                      <p className="text-sm text-muted-foreground">
                        {driver.total_rides} rides • {driver.rating.toFixed(1)} rating
                      </p>
                      <p className="text-sm text-muted-foreground">{driver.earnings_pi.toFixed(2)}π earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {drivers.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No drivers registered yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="waitlist" className="space-y-4">
            {Object.entries(
              waitlist.reduce(
                (acc, entry) => {
                  if (!acc[entry.city]) acc[entry.city] = []
                  acc[entry.city].push(entry)
                  return acc
                },
                {} as Record<string, WaitlistEntry[]>,
              ),
            ).map(([city, entries]) => (
              <Card key={city}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {city}
                  </CardTitle>
                  <CardDescription>
                    {entries.length} user{entries.length !== 1 ? "s" : ""} waiting for drivers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{entry.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Added {new Date(entry.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={entry.notified ? "default" : "secondary"}>
                          {entry.notified ? "Notified" : "Not Notified"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {waitlist.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No users on waitlist</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{marketplaceStats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">Listed items</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{marketplaceStats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{marketplaceStats.totalRevenue.toFixed(2)}π</div>
                  <p className="text-xs text-muted-foreground">Gross sales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{marketplaceStats.pendingOrders}</div>
                  <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Products</CardTitle>
                <CardDescription>Latest marketplace listings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketplaceProducts.slice(0, 10).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.business_name} • {product.category}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {product.views || 0} views • {product.sales || 0} sales
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{Number.parseFloat(product.price).toFixed(2)}π</p>
                        <Badge variant={product.stock > 0 ? "default" : "secondary"}>
                          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {marketplaceProducts.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No products listed</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest marketplace transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MarketplaceDB.getAllOrders()
                    .slice(0, 10)
                    .map((order: Order) => {
                      const product = MarketplaceDB.getProduct(order.productId)
                      return (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{product?.title || "Unknown Product"}</p>
                            <p className="text-sm text-muted-foreground">
                              Order #{order.id.slice(0, 12)}... • {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{order.amount.toFixed(2)}π</p>
                            <Badge
                              variant={
                                order.status === "delivered"
                                  ? "default"
                                  : order.status === "shipped"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  {MarketplaceDB.getAllOrders().length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No orders yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {showAdminCashout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full border border-green-500/30">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Cash Out App Pot</h2>

            {potWalletData && (
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-white/70">Total Balance:</span>
                  <span className="text-white font-bold">
                    {Number(potWalletData.potWallet.total_balance).toFixed(2)}π
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/70">Locked for Payouts:</span>
                  <span className="text-orange-400 font-bold">
                    {potWalletData.stats.totalLockedForPayouts.toFixed(2)}π
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-white font-semibold">Available:</span>
                  <span className="text-green-400 font-bold text-lg">
                    {(
                      Number(potWalletData.potWallet.total_balance) - potWalletData.stats.totalLockedForPayouts
                    ).toFixed(2)}
                    π
                  </span>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="text-white/80 mb-2 block">Transfer Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount in π"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                value={adminCashoutAmount}
                onChange={(e) => setAdminCashoutAmount(e.target.value)}
              />
              <p className="text-xs text-white/50 mt-2">
                This will transfer Pi from the App Pot to your personal wallet
              </p>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAdminCashout}
                disabled={processingCashout || !adminCashoutAmount || Number.parseFloat(adminCashoutAmount) <= 0}
              >
                {processingCashout ? "Processing..." : "Transfer Pi"}
              </button>
              <button
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                onClick={() => {
                  setShowAdminCashout(false)
                  setAdminCashoutAmount("")
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
