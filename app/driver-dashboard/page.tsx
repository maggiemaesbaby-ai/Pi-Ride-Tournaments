"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { useCurrency } from "@/contexts/currency-provider"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { notificationsDB } from "@/lib/notifications-db"
import { DriverJobQueue } from "@/components/driver-job-queue"
import { rideMatchingDB } from "@/lib/ride-matching-db"
import { DriverRideNotification } from "@/components/driver-ride-notification"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PiVolatilityDisclaimer } from "@/components/pi-volatility-disclaimer"
import {
  DollarSign,
  Star,
  Car,
  Package,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Users,
  Navigation,
  Bell,
  X,
  Camera,
  User,
  AlertCircle,
  ArrowUpFromLine,
  ArrowDownToLine,
} from "@/lib/icons"

export default function DriverDashboardPage() {
  const { formatPriceWithUSD } = useCurrency()
  const { user, isConnected, connect } = usePiWallet()
  const { toast } = useToast()
  const [isOnline, setIsOnline] = useState(false)
  const [serviceRadius, setServiceRadius] = useState(10) // km
  const [activeServices, setActiveServices] = useState({
    rides: true,
    food: true,
    packages: false,
  })
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [availableRides, setAvailableRides] = useState<any[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [driverPhoto, setDriverPhoto] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null)
  const [uploadingVehiclePhoto, setUploadingVehiclePhoto] = useState(false)
  const [showVehiclePhotoUpload, setShowVehiclePhotoUpload] = useState(false)

  const [lagosWaitlistData, setLagosWaitlistData] = useState<any>(null)
  const [loadingLagosData, setLoadingLagosData] = useState(false)
  const [showLagosSection, setShowLagosSection] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [driverEarningsBalance, setDriverEarningsBalance] = useState(0)
  const [cashingOut, setCashingOut] = useState(false)

  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showCashout, setShowCashout] = useState(false)
  const [amount, setAmount] = useState("")
  const [cashoutAmount, setCashoutAmount] = useState("")
  const [processingWallet, setProcessingWallet] = useState(false)
  const [driverWalletBalance, setDriverWalletBalance] = useState(0)

  useEffect(() => {
    const checkLocationServices = () => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        setLocationEnabled(false)
        setLocationError("Geolocation is not supported by your browser")
        return
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationEnabled(true)
          setLocationError(null)
        },
        (error) => {
          setLocationEnabled(false)
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError("Location access denied. Please enable location services in your browser settings.")
              break
            case error.POSITION_UNAVAILABLE:
              setLocationError("Location information is unavailable.")
              break
            case error.TIMEOUT:
              setLocationError("Location request timed out.")
              break
            default:
              setLocationError("An unknown error occurred with location services.")
              break
          }
        },
      )
    }

    checkLocationServices()

    if (isOnline) {
      const interval = setInterval(checkLocationServices, 10000)
      return () => clearInterval(interval)
    }
  }, [isOnline])

  useEffect(() => {
    if (!user?.uid || !isConnected) return

    loadNotifications()

    const mockLat = 37.7749 + Math.random() * 0.1
    const mockLng = -122.4194 + Math.random() * 0.1

    rideMatchingDB.updateDriverLocation({
      driverId: user.uid,
      username: user.username || "Driver",
      lat: mockLat,
      lng: mockLng,
      isOnline,
      serviceRadius,
      services: Object.keys(activeServices).filter((k) => activeServices[k as keyof typeof activeServices]),
      vehicleType: "sedan",
      rating: 4.9,
      lastUpdated: Date.now(),
      photo_url: driverPhoto,
      vehicle_photo_url: vehiclePhoto,
    })
  }, [user, isConnected, isOnline, serviceRadius, activeServices, driverPhoto, vehiclePhoto])

  useEffect(() => {
    if (!user?.uid || !isOnline || !activeServices.rides) {
      setAvailableRides([])
      return
    }

    setIsPolling(true)
    const pollRides = async () => {
      try {
        const response = await fetch(`/api/rides/available-for-driver?driverId=${user.uid}`)
        const data = await response.json()

        if (data.success) {
          setAvailableRides(data.rides || [])
        }
      } catch (error) {
        console.error("[v0] Failed to poll rides:", error)
      }
    }

    pollRides()

    const interval = setInterval(pollRides, 3000)

    return () => {
      clearInterval(interval)
      setIsPolling(false)
    }
  }, [user?.uid, isOnline, activeServices.rides])

  useEffect(() => {
    if (isConnected && user?.uid) {
      fetchDriverStats()
      fetchDriverPhoto()
      fetchVehiclePhoto()
      fetchLagosWaitlistStatus() // Fetch Lagos status
      fetchDriverWalletBalance()
    }
  }, [isConnected, user])

  const fetchDriverWalletBalance = async () => {
    if (!user?.uid) return

    try {
      const response = await fetch(`/api/arcade/user/balance?userId=${user.uid}`)
      const data = await response.json()
      if (data.success) {
        setDriverWalletBalance(data.balance)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch driver wallet balance:", error)
    }
  }

  const loadNotifications = () => {
    if (user?.uid) {
      const driverNotifs = notificationsDB.getNotificationsForUser(user.uid, "driver")
      setNotifications(driverNotifs)
    }
  }

  const handleDismissNotification = (notifId: string) => {
    notificationsDB.markAsRead(notifId)
    loadNotifications()
  }

  const handleOnlineToggle = (checked: boolean) => {
    if (checked && !user?.photo_url) {
      toast({
        title: "Photo Required",
        description: "Please upload your profile photo before going on duty",
        variant: "destructive",
      })
      setShowPhotoUpload(true)
      return
    }

    setIsOnline(checked)
    if (user?.uid) {
      rideMatchingDB.setDriverOnline(user.uid, checked)
    }
  }

  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0]
    setServiceRadius(newRadius)
    if (user?.uid) {
      rideMatchingDB.setDriverRadius(user.uid, newRadius)
    }
  }

  const handleServiceToggle = (service: keyof typeof activeServices) => {
    const newServices = { ...activeServices, [service]: !activeServices[service] }
    setActiveServices(newServices)

    if (user?.uid) {
      rideMatchingDB.setDriverServices(
        user.uid,
        Object.keys(newServices).filter((k) => newServices[k as keyof typeof newServices]),
      )
    }
  }

  const compressImage = async (base64String: string, maxWidth = 400): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", 0.85))
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = base64String
    })
  }

  const handlePhotoUpload = async (file: File) => {
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string
          const compressed = await compressImage(base64String, 400)

          console.log(
            `[v0] Photo compressed: ${(base64String.length / 1024).toFixed(1)}KB -> ${(compressed.length / 1024).toFixed(1)}KB`,
          )

          setDriverPhoto(compressed)
        } catch (error) {
          console.error("[v0] Image compression error:", error)
          toast({
            title: "Compression Failed",
            description: "Failed to process image. Please try a different image.",
            variant: "destructive",
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoSubmit = async () => {
    if (!driverPhoto || !user?.uid) return

    setUploadingPhoto(true)
    try {
      const response = await fetch("/api/driver/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          piUserId: user.uid,
          photoBase64: driverPhoto,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload photo")
      }

      toast({
        title: "Photo Uploaded",
        description: "Your profile photo has been uploaded successfully",
      })

      setShowPhotoUpload(false)
      // Refresh driver data to show new photo
      window.location.reload()
    } catch (error: any) {
      console.error("[v0] Photo upload error:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleVehiclePhotoUpload = async (file: File) => {
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string
          const compressed = await compressImage(base64String, 400)

          console.log(
            `[v0] Vehicle photo compressed: ${(base64String.length / 1024).toFixed(1)}KB -> ${(compressed.length / 1024).toFixed(1)}KB`,
          )

          setVehiclePhoto(compressed)
        } catch (error) {
          console.error("[v0] Image compression error:", error)
          toast({
            title: "Compression Failed",
            description: "Failed to process image. Please try a different image.",
            variant: "destructive",
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVehiclePhotoSubmit = async () => {
    if (!vehiclePhoto || !user?.uid) return

    setUploadingVehiclePhoto(true)
    try {
      const response = await fetch("/api/driver/upload-vehicle-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSON.stringify({
          piUserId: user.uid,
          photoBase64: vehiclePhoto,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload photo")
      }

      toast({
        title: "Vehicle Photo Uploaded",
        description: "Your vehicle photo has been uploaded successfully",
      })

      setShowVehiclePhotoUpload(false)
      window.location.reload()
    } catch (error: any) {
      console.error("[v0] Vehicle photo upload error:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      })
    } finally {
      setUploadingVehiclePhoto(false)
    }
  }

  const driverStats = {
    rating: 4.9,
    totalRides: 247,
    totalEarnings: 4850, // USD
    weeklyEarnings: 680,
    todayEarnings: 142,
    completionRate: 98,
    acceptanceRate: 95,
    onTimeRate: 99,
  }

  const weeklyBreakdown = [
    { day: "Mon", earnings: 125 },
    { day: "Tue", earnings: 98 },
    { day: "Wed", earnings: 142 },
    { day: "Thu", earnings: 110 },
    { day: "Fri", earnings: 156 },
    { day: "Sat", earnings: 89 },
    { day: "Sun", earnings: 0 },
  ]

  const maxEarnings = Math.max(...weeklyBreakdown.map((d) => d.earnings))

  // Fetch driver stats (used for stats cards and potentially other sections)
  const fetchDriverStats = async () => {
    // Placeholder for actual API call to fetch driver stats
    // In a real app, you'd fetch data like total rides, earnings, etc.
    // For now, we'll use the static driverStats object
  }

  // Fetch driver photo URL
  const fetchDriverPhoto = async () => {
    if (user?.uid) {
      try {
        const response = await fetch(`/api/driver/photo?driverId=${user.uid}`)
        const data = await response.json()
        if (data.success && data.photoUrl) {
          setDriverPhoto(data.photoUrl)
          // Update user context or state if necessary to reflect the photo URL
        }
      } catch (error) {
        console.error("Error fetching driver photo:", error)
      }
    }
  }

  // Fetch vehicle photo URL
  const fetchVehiclePhoto = async () => {
    if (user?.uid) {
      try {
        const response = await fetch(`/api/driver/vehicle-photo?driverId=${user.uid}`)
        const data = await response.json()
        if (data.success && data.photoUrl) {
          setVehiclePhoto(data.photoUrl)
          // Update user context or state if necessary to reflect the photo URL
        }
      } catch (error) {
        console.error("Error fetching vehicle photo:", error)
      }
    }
  }

  const fetchLagosWaitlistStatus = async () => {
    if (!user?.uid) return

    setLoadingLagosData(true)
    try {
      const response = await fetch(`/api/lagos/driver-status?pi_user_id=${user.uid}`)
      const data = await response.json()

      if (data.success) {
        setLagosWaitlistData(data.driver)
        setShowLagosSection(true)
      }

      const earningsRes = await fetch(`/api/driver/earnings-balance?driver_id=${user.uid}`)
      const earningsData = await earningsRes.json()
      if (earningsData.success) {
        setDriverEarningsBalance(earningsData.balance)
      }
    } catch (error) {
      console.error("Error fetching Lagos data:", error)
    } finally {
      setLoadingLagosData(false)
    }
  }

  const handleLagosPayment = async (feeType: "signup" | "yearly") => {
    if (!user?.uid || !isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Pi wallet first",
        variant: "destructive",
      })
      return
    }

    setProcessingPayment(true)
    try {
      const response = await fetch("/api/lagos/pay-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pi_user_id: user.uid,
          fee_type: feeType,
        }),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      const payment = window.Pi.createPayment(
        {
          amount: data.amount_pi,
          memo: data.memo,
          metadata: { payment_id: data.payment_id },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            await fetch("/api/lagos/pi-payment/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payment_id: paymentId, driver_id: lagosWaitlistData.id }),
            })
          },
          onReadyForServerCompletion: async (paymentId: string) => {
            await fetch("/api/lagos/pi-payment/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payment_id: paymentId }),
            })

            toast({
              title: "Payment successful!",
              description: `${feeType === "signup" ? "$150 signup" : "$30 yearly"} fee paid successfully`,
            })

            fetchLagosWaitlistStatus()
          },
          onCancel: () => {
            toast({
              title: "Payment cancelled",
              variant: "destructive",
            })
          },
          onError: (error: any) => {
            toast({
              title: "Payment failed",
              description: error.message,
              variant: "destructive",
            })
          },
        },
      )
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleCashout = async () => {
    if (!user?.uid || driverEarningsBalance <= 0) return

    setCashingOut(true)
    try {
      const payment = window.Pi.createPayment(
        {
          amount: driverEarningsBalance,
          memo: `Cashout from driver earnings`,
          metadata: { type: "driver_cashout", driver_id: user.uid },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            await fetch("/api/driver/cashout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                payment_id: paymentId,
                driver_pi_user_id: user.uid,
                amount: driverEarningsBalance,
              }),
            })
          },
          onReadyForServerCompletion: async (paymentId: string) => {
            toast({
              title: "Cashout successful!",
              description: `${driverEarningsBalance.toFixed(2)}π transferred to your wallet`,
            })
            fetchLagosWaitlistStatus()
          },
          onCancel: () => {
            toast({ title: "Cashout cancelled", variant: "destructive" })
          },
          onError: (error: any) => {
            toast({ title: "Cashout failed", description: error.message, variant: "destructive" })
          },
        },
      )
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setCashingOut(false)
    }
  }

  const handleDriverAddFunds = async () => {
    if (!amount || isNaN(Number(amount))) {
      alert("Please enter a valid amount")
      return
    }

    const numAmount = Number(amount)
    if (numAmount < 1) {
      alert("Minimum add funds is 1π")
      return
    }

    setProcessingWallet(true)
    try {
      const payment = window.Pi.createPayment(
        {
          amount: numAmount,
          memo: `Add ${numAmount}π to driver wallet`,
          metadata: { type: "driver_add_funds", userId: user.uid },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            const response = await fetch("/api/arcade/user/add-funds", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.uid, amount: numAmount, piPaymentId: paymentId }),
            })
            const data = await response.json()
            if (!response.ok) {
              throw new Error(data.error)
            }
          },
          onReadyForServerCompletion: async () => {
            toast({
              title: "Funds added successfully!",
              description: `${numAmount}π added to your wallet`,
            })
            fetchDriverWalletBalance()
            setShowAddFunds(false)
            setAmount("")
          },
          onCancel: () => {
            toast({ title: "Payment cancelled", variant: "destructive" })
          },
          onError: (error: any) => {
            toast({ title: "Payment failed", description: error.message, variant: "destructive" })
          },
        },
      )
    } catch (error: any) {
      console.error("[v0] Add funds error:", error)
      alert("Failed to add funds. Please try again.")
    } finally {
      setProcessingWallet(false)
    }
  }

  const handleDriverCashout = async () => {
    const numAmount = Number.parseFloat(cashoutAmount)

    if (!cashoutAmount || isNaN(numAmount)) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (numAmount < 1) {
      toast({
        title: "Amount too small",
        description: "Minimum cashout is 1 π",
        variant: "destructive",
      })
      return
    }

    if (numAmount > driverWalletBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance",
        variant: "destructive",
      })
      return
    }

    const PI_PRICE_USD = 0.5 // Approximate - should fetch from API
    const MAX_DAILY_WITHDRAWAL_USD = 750
    const maxWithdrawalPi = MAX_DAILY_WITHDRAWAL_USD / PI_PRICE_USD

    if (numAmount > maxWithdrawalPi) {
      toast({
        title: "Withdrawal limit exceeded",
        description: `Daily withdrawal limit is $${MAX_DAILY_WITHDRAWAL_USD} (approximately ${maxWithdrawalPi.toFixed(2)}π). Please withdraw a smaller amount.`,
        variant: "destructive",
      })
      return
    }

    setProcessingWallet(true)
    try {
      if (typeof window !== "undefined" && window.Pi) {
        console.log("[v0] Requesting user wallet address for driver cashout")

        const scopes = ["username", "payments", "wallet_address"]
        const authResult = await window.Pi.authenticate(scopes, (payment: any) => {
          console.log("[v0] Auth payment approved:", payment)
        })

        console.log("[v0] Auth result:", authResult)

        if (!authResult || !authResult.user) {
          toast({
            title: "Authentication failed",
            description: "Could not access your Pi wallet",
            variant: "destructive",
          })
          return
        }

        const userWalletAddress = authResult.user.wallet_address || authResult.user.uid

        console.log("[v0] User wallet address:", userWalletAddress)

        if (!userWalletAddress) {
          toast({
            title: "Wallet address not found",
            description: "Please try again or contact support",
            variant: "destructive",
          })
          return
        }

        console.log("[v0] Initiating driver cashout to wallet:", userWalletAddress, "Amount:", numAmount)

        const response = await fetch("/api/arcade/user/cashout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            amount: numAmount,
            userWalletAddress: userWalletAddress,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          toast({
            title: "Cashout successful!",
            description: `${numAmount}π has been sent to your Pi wallet.`,
          })
          fetchDriverWalletBalance()
          setShowCashout(false)
          setCashoutAmount("")
        } else {
          toast({
            title: "Cashout failed",
            description: data.error || "Please try again",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Pi SDK not available",
          description: "Please open in Pi Browser",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Driver cashout error:", error)
      toast({
        title: "Cashout failed",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setProcessingWallet(false)
    }
  }

  if (!isConnected || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
        <div className="container max-w-7xl mx-auto px-4">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Connect Your Pi Wallet to Start Driving</h2>
              <p className="text-muted-foreground mb-6">
                Connect your Pi wallet to access the driver dashboard and start accepting ride requests
              </p>
              <Button
                onClick={connect}
                size="lg"
                className="bg-gradient-to-r from-[#6B4DE6] to-[#8B5CF6] hover:opacity-90"
              >
                Connect Pi Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Driver Dashboard</h1>
            <p className="text-muted-foreground">Track your earnings and manage your services</p>
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

        {!locationEnabled && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 text-amber-700">Location Services Disabled</h3>
                  <p className="text-amber-600 mb-3">
                    {locationError ||
                      "Please enable location services to receive ride requests and provide accurate navigation."}
                  </p>
                  <div className="text-sm text-amber-700 space-y-1">
                    <p className="font-medium">To enable location services:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Check your browser settings and allow location access for this site</li>
                      <li>Make sure location services are enabled on your device</li>
                      <li>Refresh the page after enabling location services</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showNotifications && notifications.filter((n) => !n.read && n.category === "fee_change").length > 0 && (
          <Card className="mb-6 border-blue-500/50 bg-blue-500/5">
            <CardContent className="pt-6">
              {notifications
                .filter((n) => !n.read && n.category === "fee_change")
                .map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{notif.title}</h3>
                      <p className="text-muted-foreground mb-2">{notif.message}</p>
                      {notif.data && (
                        <div className="flex items-center gap-4 text-sm">
                          <Badge className="bg-blue-500">{notif.data.tier}</Badge>
                          <span className="font-semibold">{notif.data.commission}% Commission</span>
                          <span className="text-muted-foreground">{notif.data.totalRides} rides completed</span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDismissNotification(notif.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        <Card className={`mb-6 ${isOnline ? "border-green-500/50 bg-green-500/5" : "border-muted"}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-4 h-4 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`}
                />
                <div>
                  <h3 className="font-semibold text-lg">{isOnline ? "You're Online" : "You're Offline"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isOnline ? "Ready to accept ride requests" : "Go online to start accepting requests"}
                  </p>
                </div>
              </div>
              <Switch checked={isOnline} onCheckedChange={handleOnlineToggle} className="scale-125" />
            </div>

            <div className="mb-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Service Radius
                </Label>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-base font-bold">
                    {serviceRadius} km
                  </Badge>
                  <span className="text-xs text-muted-foreground">({(serviceRadius * 0.621371).toFixed(1)} miles)</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                You'll receive ride requests within this distance from your current location
              </p>
              <Slider
                value={[serviceRadius]}
                onValueChange={handleRadiusChange}
                min={1}
                max={50}
                step={1}
                className="w-full"
                disabled={!isOnline}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>1 km (0.6 mi)</span>
                <span>50 km (31.1 mi)</span>
              </div>
            </div>

            {isOnline && (
              <div className="pt-6 border-t grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={activeServices.rides} onCheckedChange={() => handleServiceToggle("rides")} />
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Car className="w-4 h-4" />
                    Rides
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={activeServices.food} onCheckedChange={() => handleServiceToggle("food")} />
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <UtensilsCrossed className="w-4 h-4" />
                    Food
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={activeServices.packages} onCheckedChange={() => handleServiceToggle("packages")} />
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Package className="w-4 h-4" />
                    Packages
                  </Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isOnline && (
          <>
            {availableRides.length > 0 && (
              <div className="mb-6 space-y-4">
                {availableRides.map((ride) => (
                  <DriverRideNotification
                    key={ride.id}
                    ride={ride}
                    driverId={user.uid}
                    onAccepted={() => {
                      setAvailableRides((prev) => prev.filter((r) => r.id !== ride.id))
                    }}
                  />
                ))}
              </div>
            )}

            <div className="mb-6">
              <DriverJobQueue driverId={user.uid} username={user.username || "Driver"} />
            </div>
          </>
        )}

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Today's Earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                <div>{formatPriceWithUSD(driverStats.todayEarnings).pi}</div>
                <div className="text-sm text-muted-foreground">{formatPriceWithUSD(driverStats.todayEarnings).usd}</div>
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <ArrowUpRight className="w-4 h-4" />
                <span>+12% vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>This Week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                <div>{formatPriceWithUSD(driverStats.weeklyEarnings).pi}</div>
                <div className="text-sm text-muted-foreground">
                  {formatPriceWithUSD(driverStats.weeklyEarnings).usd}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>7 days</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Total Earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                <div>{formatPriceWithUSD(driverStats.totalEarnings).pi}</div>
                <div className="text-sm text-muted-foreground">{formatPriceWithUSD(driverStats.totalEarnings).usd}</div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>{driverStats.totalRides} trips</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Driver Rating</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1 flex items-center gap-2">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                {driverStats.rating}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{driverStats.totalRides} ratings</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Weekly Earnings Breakdown</CardTitle>
            <CardDescription>Your earnings over the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {weeklyBreakdown.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end flex-1">
                    <div className="text-xs font-semibold mb-1">{day.earnings > 0 ? `$${day.earnings}` : ""}</div>
                    <div
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{
                        height: day.earnings > 0 ? `${(day.earnings / maxEarnings) * 100}%` : "4px",
                        opacity: day.earnings > 0 ? 1 : 0.2,
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">{day.day}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">{driverStats.completionRate}%</div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">Excellent completion record</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acceptance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">{driverStats.acceptanceRate}%</div>
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">Great availability</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">On-Time Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-purple-600">{driverStats.onTimeRate}%</div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">Outstanding punctuality</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-300 dark:border-green-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Driver Wallet Balance</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {driverWalletBalance.toFixed(2)}π
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddFunds(true)} className="gap-2 bg-green-600 hover:bg-green-700">
                  <ArrowUpFromLine className="w-4 h-4" />
                  Add Pi
                </Button>
                <Button onClick={() => setShowCashout(true)} variant="outline" className="gap-2">
                  <ArrowDownToLine className="w-4 h-4" />
                  Cash Out
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Daily withdrawal limit: $750 USD</p>
          </CardContent>
        </Card>

        <Card className="p-6 mt-6">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              {user?.photo_url ? (
                <img
                  src={user.photo_url || "/placeholder.svg"}
                  alt={user.username}
                  className="w-full h-full object-cover rounded-full border-2 border-purple-200"
                />
              ) : (
                <div className="w-full h-full bg-purple-100 rounded-full flex items-center justify-center border-2 border-purple-200">
                  <User className="w-10 h-10 text-purple-400" />
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0 bg-white"
                onClick={() => setShowPhotoUpload(true)}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.username || "Driver Name"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {!user?.photo_url && <p className="text-xs text-amber-600 mt-1">Upload photo to go on duty</p>}
            </div>
          </div>
        </Card>

        {/* Vehicle photo upload section */}
        <Card className="p-6 mt-6 border-2 border-slate-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Vehicle Photo</h2>
              <p className="text-sm text-slate-600">Upload a photo of your vehicle for rider verification</p>
            </div>
            {user?.vehicle_photo_url && (
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-purple-600 text-purple-600 hover:bg-purple-50"
                onClick={() => setShowVehiclePhotoUpload(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                Change Photo
              </Button>
            )}
          </div>

          {user?.vehicle_photo_url ? (
            <div className="flex items-center gap-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-green-300 flex-shrink-0">
                <img
                  src={user.vehicle_photo_url || "/placeholder.svg"}
                  alt="Vehicle"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Vehicle Photo Uploaded</span>
                </div>
                <p className="text-sm text-green-600">Riders will see this photo when you accept their ride</p>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 mb-2">Vehicle Photo Required</p>
                  <p className="text-sm text-yellow-700 mb-4">
                    You must upload a clear photo of your vehicle for rider identification and safety.
                  </p>
                  <Button
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={() => setShowVehiclePhotoUpload(true)}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Upload Vehicle Photo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {showLagosSection && lagosWaitlistData && (
          <Card className="mb-6 mt-6 border-2 border-green-500">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                🇳🇬 Lagos Rollout Dashboard
                {lagosWaitlistData.ready_for_activation ? (
                  <Badge className="bg-green-600">Ready for Launch</Badge>
                ) : (
                  <Badge variant="outline">On Waitlist</Badge>
                )}
              </CardTitle>
              <CardDescription>Complete all requirements below to activate when Lagos launches</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Payment Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-3">💳 Fee Payments</h3>

                  {/* Signup Fee */}
                  <div
                    className={`p-4 rounded-lg border-2 ${lagosWaitlistData.app_signup_fee_paid ? "bg-green-50 border-green-300" : "bg-yellow-50 border-yellow-300"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">App Signup Fee ($150)</span>
                      {lagosWaitlistData.app_signup_fee_paid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    {lagosWaitlistData.app_signup_fee_paid ? (
                      <p className="text-sm text-green-700">
                        Paid on {new Date(lagosWaitlistData.app_signup_fee_paid_at).toLocaleDateString()}
                      </p>
                    ) : (
                      <Button
                        onClick={() => handleLagosPayment("signup")}
                        disabled={processingPayment}
                        className="w-full mt-2 bg-green-600 hover:bg-green-700"
                      >
                        {processingPayment ? "Processing..." : "Pay $150 Signup Fee"}
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      One-time fee for regulatory setup. Pay this to get 18% fee rate (vs 20% without)
                    </p>
                  </div>

                  {/* Yearly License Fee */}
                  <div
                    className={`p-4 rounded-lg border-2 ${lagosWaitlistData.yearly_license_fee_paid ? "bg-green-50 border-green-300" : "bg-yellow-50 border-yellow-300"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Yearly License Fee ($30)</span>
                      {lagosWaitlistData.yearly_license_fee_paid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    {lagosWaitlistData.yearly_license_fee_paid ? (
                      <>
                        <p className="text-sm text-green-700">
                          Paid on {new Date(lagosWaitlistData.yearly_license_fee_paid_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Next due: {new Date(lagosWaitlistData.yearly_fee_next_due).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleLagosPayment("yearly")}
                        disabled={processingPayment}
                        className="w-full mt-2 bg-green-600 hover:bg-green-700"
                      >
                        {processingPayment ? "Processing..." : "Pay $30 Yearly Fee"}
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Annual admin/license processing fee per driver</p>
                  </div>

                  <PiVolatilityDisclaimer variant="compact" className="mt-4" />
                </div>

                {/* Verification Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-3">✅ Verifications Required</h3>

                  {/* Background Check */}
                  <div
                    className={`p-3 rounded-lg border ${lagosWaitlistData.background_check_verified ? "bg-green-50 border-green-300" : "border-slate-300"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Background Check</span>
                      {lagosWaitlistData.background_check_verified ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Button size="sm" variant="outline" asChild>
                          <a href="https://backgroundcheck.ng" target="_blank" rel="noopener noreferrer">
                            Start Check
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Hackney Permit */}
                  <div
                    className={`p-3 rounded-lg border ${lagosWaitlistData.hackney_verified ? "bg-green-50 border-green-300" : "border-slate-300"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Hackney Permit</span>
                      {lagosWaitlistData.hackney_verified ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending verification</span>
                      )}
                    </div>
                    {lagosWaitlistData.hackney_expires_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(lagosWaitlistData.hackney_expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* LASDRI Certification */}
                  <div
                    className={`p-3 rounded-lg border ${lagosWaitlistData.lasdri_verified ? "bg-green-50 border-green-300" : "border-slate-300"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">LASDRI Certification</span>
                      {lagosWaitlistData.lasdri_verified ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending verification</span>
                      )}
                    </div>
                    {lagosWaitlistData.lasdri_expires_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(lagosWaitlistData.lasdri_expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Insurance */}
                  <div
                    className={`p-3 rounded-lg border ${lagosWaitlistData.insurance_verified ? "bg-green-50 border-green-300" : "border-slate-300"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Comprehensive Insurance</span>
                      {lagosWaitlistData.insurance_verified ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending verification</span>
                      )}
                    </div>
                    {lagosWaitlistData.insurance_expires_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(lagosWaitlistData.insurance_expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* VIS Certificate */}
                  <div
                    className={`p-3 rounded-lg border ${lagosWaitlistData.vis_verified ? "bg-green-50 border-green-300" : "border-slate-300"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">VIS Certificate</span>
                      {lagosWaitlistData.vis_verified ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending verification</span>
                      )}
                    </div>
                    {lagosWaitlistData.vis_expires_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(lagosWaitlistData.vis_expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Earnings & Cashout Section */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">💰 Driver Earnings Balance</h3>
                    <p className="text-2xl font-bold text-purple-700">{driverEarningsBalance.toFixed(2)}π</p>
                    <p className="text-xs text-muted-foreground mt-1">Available to cash out to your wallet</p>
                  </div>
                  <Button
                    onClick={handleCashout}
                    disabled={cashingOut || driverEarningsBalance <= 0}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    {cashingOut ? "Processing..." : "Cash Out"}
                  </Button>
                </div>
              </div>

              {lagosWaitlistData.ready_for_activation && (
                <div className="mt-6 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">You're Ready for Lagos Launch!</p>
                      <p className="text-sm text-green-700">
                        You'll receive a notification when the Lagos rollout begins.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Driver photo upload dialog */}
        <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Profile Photo</DialogTitle>
              <DialogDescription>
                Upload a clear photo of yourself for rider verification and safety. This photo will be shown to riders
                when you accept their ride requests.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                {driverPhoto || user?.photo_url ? (
                  <div className="relative w-48 h-48 border-2 border-purple-200 rounded-full overflow-hidden">
                    <img
                      src={driverPhoto || user?.photo_url || "/placeholder.svg"}
                      alt="Driver photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center bg-purple-50">
                    <User className="w-24 h-24 text-purple-300" />
                  </div>
                )}

                <div className="w-full">
                  <Label htmlFor="driver-photo" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      <Camera className="w-4 h-4" />
                      <span>{user?.photo_url ? "Change Photo" : "Select Photo"}</span>
                    </div>
                    <Input
                      id="driver-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handlePhotoUpload(file)
                      }}
                    />
                  </Label>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Upload a clear, recent photo showing your face. Maximum file size: 5MB
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowPhotoUpload(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={handlePhotoSubmit}
                  disabled={!driverPhoto || uploadingPhoto}
                >
                  {uploadingPhoto ? "Uploading..." : "Save Photo"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Vehicle photo upload dialog */}
        <Dialog open={showVehiclePhotoUpload} onOpenChange={setShowVehiclePhotoUpload}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Vehicle Photo</DialogTitle>
              <DialogDescription>
                Upload a clear photo of your vehicle for rider verification and safety. Show the full exterior of your
                vehicle, preferably from the front or side angle.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                {vehiclePhoto || user?.vehicle_photo_url ? (
                  <div className="relative w-full h-48 border-2 border-purple-200 rounded-lg overflow-hidden">
                    <img
                      src={vehiclePhoto || user?.vehicle_photo_url || "/placeholder.svg"}
                      alt="Vehicle photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center bg-purple-50">
                    <Car className="w-24 h-24 text-purple-300" />
                  </div>
                )}

                <div className="w-full">
                  <Label htmlFor="vehicle-photo" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      <Camera className="w-4 h-4" />
                      <span>{user?.vehicle_photo_url ? "Change Photo" : "Select Photo"}</span>
                    </div>
                    <Input
                      id="vehicle-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleVehiclePhotoUpload(file)
                      }}
                    />
                  </Label>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Upload a clear photo showing your vehicle exterior. Maximum file size: 5MB
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowVehiclePhotoUpload(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={handleVehiclePhotoSubmit}
                  disabled={!vehiclePhoto || uploadingVehiclePhoto}
                >
                  {uploadingVehiclePhoto ? "Uploading..." : "Save Photo"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {showAddFunds && (
          <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
            <DialogContent className="bg-gradient-to-br from-green-900 to-emerald-900 text-white border-green-500">
              <DialogHeader>
                <DialogTitle className="text-2xl">Add Pi to Driver Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-white/80">
                    Amount (π)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDriverAddFunds}
                    disabled={processingWallet}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processingWallet ? "Processing..." : "Add Funds"}
                  </Button>
                  <Button onClick={() => setShowAddFunds(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {showCashout && (
          <Dialog open={showCashout} onOpenChange={setShowCashout}>
            <DialogContent className="bg-gradient-to-br from-green-900 to-emerald-900 text-white border-green-500">
              <DialogHeader>
                <DialogTitle className="text-2xl">Cash Out to Pi Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cashout-amount" className="text-white/80">
                    Amount (π) - Max $750/day
                  </Label>
                  <Input
                    id="cashout-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Enter amount"
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <p className="text-xs text-white/60 mt-1">Available: {driverWalletBalance.toFixed(2)}π</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDriverCashout}
                    disabled={processingWallet}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {processingWallet ? "Processing..." : "Cash Out"}
                  </Button>
                  <Button onClick={() => setShowCashout(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
