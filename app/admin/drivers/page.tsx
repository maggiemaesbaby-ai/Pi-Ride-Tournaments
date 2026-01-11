"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { driverDB, type Driver } from "@/lib/driver-db"
import { notificationsDB } from "@/lib/notifications-db"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import {
  CheckCircle2,
  XCircle,
  Car,
  Phone,
  Mail,
  MapPin,
  Star,
  DollarSign,
  Calendar,
  Shield,
  Search,
  Bell,
  ArrowUpRight,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">("all")
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const { user } = usePiWallet()
  const { toast } = useToast()

  // New driver form
  const [newDriver, setNewDriver] = useState({
    piUsername: "",
    name: "",
    email: "",
    phone: "",
    city: "",
    vehicleType: "sedan" as const,
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    licensePlate: "",
    serviceArea: [] as string[],
    servicesOffered: ["rides" as const],
    approved: false,
    isFreeSignup: false,
    feeStatus: "pending" as const,
  })

  useEffect(() => {
    loadDrivers()
    loadNotifications()
  }, [])

  const loadDrivers = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data: applications, error } = await supabase
        .from("driver_applications")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      const transformedDrivers: Driver[] = applications.map((app: any) => ({
        id: app.id,
        piUsername: app.pi_user_id || "",
        name: app.full_name,
        email: app.email,
        phone: app.phone,
        city: app.service_cities?.[0] || "",
        vehicleType: app.vehicle_info?.type || "sedan",
        vehicleMake: app.vehicle_info?.make || "",
        vehicleModel: app.vehicle_info?.model || "",
        vehicleYear: app.vehicle_info?.year || "",
        licensePlate: app.vehicle_info?.plate || "",
        serviceArea: app.service_cities || [],
        servicesOffered: ["rides"],
        approved: app.status === "approved",
        isFreeSignup: false,
        feeStatus: "pending",
        feePackage: app.metadata?.selectedFeePackage || "no-upfront",
        commission: app.metadata?.commission || 0.05,
        upfrontFeeOwed: app.metadata?.upfrontFeeOwed || 0,
        upfrontFeePaid: 0,
        status: app.status,
        createdAt: app.created_at,
      }))

      setDrivers(transformedDrivers)
    } catch (error) {
      console.error("[v0] Failed to load drivers:", error)
      toast({
        title: "Error",
        description: "Failed to load driver applications",
        variant: "destructive",
      })
    }
  }

  const loadNotifications = () => {
    const adminNotifs = notificationsDB.getNotificationsForUser("admin", "admin")
    setNotifications(adminNotifs)
  }

  const handleApproveDriver = async (driverId: string) => {
    try {
      const driver = drivers.find((d) => d.id === driverId)
      if (!driver) {
        toast({
          title: "Error",
          description: "Driver not found",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/driver-application/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: driver.id,
          reviewedBy: user?.username || "admin",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve driver")
      }

      toast({
        title: "Driver Approved! 🎉",
        description: `${driver.name} has been approved and notified. They must accept the legal agreement before starting.`,
      })

      loadDrivers()
    } catch (error: any) {
      console.error("[v0] Approval error:", error)
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve driver",
        variant: "destructive",
      })
    }
  }

  const handleAddDriver = () => {
    if (!newDriver.piUsername || !newDriver.name || !newDriver.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const driver = driverDB.addDriver(newDriver)

    toast({
      title: "Driver Added",
      description: `${driver.name} has been added to the database`,
    })

    setShowAddDialog(false)
    loadDrivers()

    // Reset form
    setNewDriver({
      piUsername: "",
      name: "",
      email: "",
      phone: "",
      city: "",
      vehicleType: "sedan",
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: "",
      licensePlate: "",
      serviceArea: [],
      servicesOffered: ["rides"],
      approved: false,
      isFreeSignup: false,
      feeStatus: "pending",
    })
  }

  const handleMarkAllRead = () => {
    notificationsDB.markAllAsRead("admin", "admin")
    loadNotifications()
    toast({
      title: "Notifications Cleared",
      description: "All notifications marked as read",
    })
  }

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.piUsername.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && !driver.approved) ||
      (filterStatus === "approved" && driver.approved)

    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Driver Management</h1>
            <p className="text-muted-foreground">Approve drivers and manage the driver database</p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </Button>
        </div>

        {showNotifications && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Driver Milestone Notifications</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                  Mark All Read
                </Button>
              </div>
              <CardDescription>Notifications about driver tier progressions and commission changes</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No notifications</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-lg border ${notif.read ? "bg-background" : "bg-primary/5 border-primary/20"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ArrowUpRight className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{notif.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{new Date(notif.createdAt).toLocaleString()}</span>
                            {notif.data && (
                              <>
                                <span>•</span>
                                <span>{notif.data.totalRides} rides completed</span>
                                <span>•</span>
                                <span className="font-semibold">{notif.data.commission}% commission</span>
                              </>
                            )}
                          </div>
                        </div>
                        {!notif.read && <Badge variant="secondary">New</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Drivers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{drivers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{drivers.filter((d) => !d.approved).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Approved Drivers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{drivers.filter((d) => d.approved).length}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Online Now
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{drivers.filter((d) => d.isOnline).length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active on Duty</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Add Button */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or Pi username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setShowAddDialog(true)}>Add Driver</Button>
        </div>

        {/* Driver List */}
        <div className="space-y-4">
          {filteredDrivers.map((driver) => (
            <Card key={driver.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center relative">
                        <Car className="w-6 h-6 text-primary" />
                        {driver.isOnline && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{driver.name}</h3>
                          {driver.approved ? (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {driver.isOnline && (
                            <Badge className="bg-green-500">
                              <div className="w-2 h-2 rounded-full bg-white mr-1 animate-pulse" />
                              Online
                            </Badge>
                          )}
                          {driver.inRide && <Badge className="bg-blue-500">In Ride</Badge>}
                          {driver.isFreeSignup && (
                            <Badge className="bg-purple-500">
                              <Shield className="w-3 h-3 mr-1" />
                              Free Promo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{driver.piUsername}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {driver.email}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {driver.phone}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {driver.city}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">
                            {driver.feePackage === "upfront"
                              ? `Upfront Plan (3% fee, ${driver.upfrontFeeOwed}π paid upfront)`
                              : `No-Upfront Plan (${(driver.commission * 100).toFixed(0)}% commission)`}
                          </span>
                        </div>
                        {driver.feePackage === "upfront" && (
                          <div className="text-xs text-muted-foreground ml-6">
                            Paid: {driver.upfrontFeePaid}π / {driver.upfrontFeeOwed}π
                            {driver.upfrontFeePaid >= driver.upfrontFeeOwed && (
                              <Badge className="ml-2 bg-green-500">Paid Off</Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          <span className="font-medium">
                            {driver.vehicleYear} {driver.vehicleMake} {driver.vehicleModel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>Type: {driver.vehicleType}</span>
                          <span>•</span>
                          <span>Plate: {driver.licensePlate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{driver.averageRating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({driver.totalRatings} ratings)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">{driver.totalEarnings}π earned</span>
                      </div>
                      <div>
                        <span className="font-semibold">{driver.completedRides}</span>
                        <span className="text-muted-foreground"> rides completed</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Joined {new Date(driver.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {!driver.approved && (
                      <Button onClick={() => handleApproveDriver(driver.id)} size="sm">
                        Approve Driver
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSelectedDriver(driver)}>
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDrivers.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No drivers found matching your criteria</p>
          </Card>
        )}

        {/* Add Driver Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
              <DialogDescription>Add a driver to the database after reviewing their application</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pi Username *</Label>
                  <Input
                    value={newDriver.piUsername}
                    onChange={(e) => setNewDriver({ ...newDriver, piUsername: e.target.value })}
                    placeholder="@username"
                  />
                </div>
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={newDriver.name}
                    onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>City</Label>
                <Input value={newDriver.city} onChange={(e) => setNewDriver({ ...newDriver, city: e.target.value })} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Vehicle Type</Label>
                  <Select
                    value={newDriver.vehicleType}
                    onValueChange={(value: any) => setNewDriver({ ...newDriver, vehicleType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Make</Label>
                  <Input
                    value={newDriver.vehicleMake}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicleMake: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input
                    value={newDriver.vehicleModel}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicleModel: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Year</Label>
                  <Input
                    value={newDriver.vehicleYear}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicleYear: e.target.value })}
                  />
                </div>
                <div>
                  <Label>License Plate</Label>
                  <Input
                    value={newDriver.licensePlate}
                    onChange={(e) => setNewDriver({ ...newDriver, licensePlate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newDriver.approved}
                    onChange={(e) => setNewDriver({ ...newDriver, approved: e.target.checked })}
                  />
                  <span>Approve Immediately</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newDriver.isFreeSignup}
                    onChange={(e) => setNewDriver({ ...newDriver, isFreeSignup: e.target.checked })}
                  />
                  <span>Free Promo Signup</span>
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDriver}>Add Driver</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
