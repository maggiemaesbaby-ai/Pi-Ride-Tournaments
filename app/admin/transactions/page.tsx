"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { getAllPaymentRecords, PaymentRecord } from "@/lib/payment-logger"
import { driverDB } from "@/lib/driver-db"
import { Download, Search, Filter, DollarSign, TrendingUp, Users, ShoppingBag } from 'lucide-react'
import { useCurrency } from "@/contexts/currency-provider"

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<PaymentRecord[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<PaymentRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    completedTransactions: 0
  })
  const { user } = usePiWallet()
  const { formatPriceWithUSD } = useCurrency()

  const isAdmin = user?.username === 'ryanbo50' // Replace with your Pi username

  useEffect(() => {
    if (!isAdmin) return

    // Load all transactions from all users
    const allTransactions: PaymentRecord[] = []
    
    // In production, this would query a backend database
    // For now, we aggregate from localStorage across all users
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('pi_ride_payments_')) {
          try {
            const userPayments = JSON.parse(localStorage.getItem(key) || '[]')
            allTransactions.push(...userPayments)
          } catch (e) {}
        }
      })
    }

    // Sort by timestamp descending
    allTransactions.sort((a, b) => b.timestamp - a.timestamp)
    
    setTransactions(allTransactions)
    setFilteredTransactions(allTransactions)

    // Calculate stats
    const totalRevenue = allTransactions
      .filter(t => t.status === 'completed' && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const pending = allTransactions.filter(t => t.status === 'pending').length
    const completed = allTransactions.filter(t => t.status === 'completed').length

    setStats({
      totalRevenue,
      totalTransactions: allTransactions.length,
      pendingTransactions: pending,
      completedTransactions: completed
    })
  }, [isAdmin])

  useEffect(() => {
    let filtered = transactions

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus)
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType)
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.piPaymentId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTransactions(filtered)
  }, [searchTerm, filterStatus, filterType, transactions])

  const exportToCSV = () => {
    const headers = ['Date', 'User ID', 'Amount', 'Type', 'Service', 'Status', 'Payment ID', 'TX ID']
    const rows = filteredTransactions.map(t => [
      new Date(t.timestamp).toISOString(),
      t.userId,
      t.amount.toString(),
      t.type,
      t.service,
      t.status,
      t.piPaymentId || '',
      t.txid || ''
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pi-ride-transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 max-w-md">
          <CardContent className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">
              You must be an administrator to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Transaction Management</h1>
          <p className="text-muted-foreground">
            Monitor all Pi Ride transactions and system activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPriceWithUSD(stats.totalRevenue).pi}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedTransactions}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</p>
                </div>
                <Users className="w-8 h-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, service, or payment ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white"
              >
                <option value="all">All Types</option>
                <option value="pioneer_driver">Pioneer Driver</option>
                <option value="affiliate_redirect">Affiliate</option>
                <option value="food">Food</option>
                <option value="package">Package</option>
              </select>

              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">User ID</th>
                    <th className="text-left p-4 font-semibold">Amount</th>
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-left p-4 font-semibold">Service</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Payment ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 text-sm">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 text-sm font-mono">
                        {transaction.userId.substring(0, 12)}...
                      </td>
                      <td className="p-4 text-sm font-semibold text-primary">
                        {transaction.amount > 0 ? formatPriceWithUSD(transaction.amount).pi : '-'}
                      </td>
                      <td className="p-4 text-sm">
                        <Badge variant="outline">{transaction.type}</Badge>
                      </td>
                      <td className="p-4 text-sm">{transaction.service}</td>
                      <td className="p-4">
                        <Badge
                          className={
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : transaction.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs font-mono">
                        {transaction.piPaymentId?.substring(0, 16)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
