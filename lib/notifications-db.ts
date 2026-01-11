import { driverDB } from "./driver-db"

export interface Notification {
  id: string
  type: "admin" | "driver"
  recipientId: string // Admin ID or Driver ID
  title: string
  message: string
  category: "tier_milestone" | "fee_change" | "general"
  data?: Record<string, any>
  read: boolean
  createdAt: number
}

class NotificationsDB {
  private storageKey = "pi_ride_notifications"

  getAllNotifications(): Notification[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.storageKey)
    return stored ? JSON.parse(stored) : []
  }

  saveNotifications(notifications: Notification[]) {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(notifications))
  }

  createNotification(notification: Omit<Notification, "id" | "createdAt" | "read">): Notification {
    const notifications = this.getAllNotifications()

    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: Date.now(),
    }

    notifications.push(newNotification)
    this.saveNotifications(notifications)

    return newNotification
  }

  getNotificationsForUser(userId: string, type: "admin" | "driver"): Notification[] {
    const notifications = this.getAllNotifications()
    return notifications
      .filter((n) => n.type === type && n.recipientId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  markAsRead(notificationId: string): boolean {
    const notifications = this.getAllNotifications()
    const index = notifications.findIndex((n) => n.id === notificationId)

    if (index === -1) return false

    notifications[index].read = true
    this.saveNotifications(notifications)

    return true
  }

  markAllAsRead(userId: string, type: "admin" | "driver"): boolean {
    const notifications = this.getAllNotifications()
    let updated = false

    notifications.forEach((n) => {
      if (n.type === type && n.recipientId === userId && !n.read) {
        n.read = true
        updated = true
      }
    })

    if (updated) {
      this.saveNotifications(notifications)
    }

    return updated
  }

  checkAndNotifyTierChange(driverId: string, previousRides: number, newRides: number) {
    const driver = driverDB.getDriver(driverId)
    if (!driver || driver.feePackage !== "no-upfront") return

    // Check if driver crossed a milestone
    let crossedMilestone = false
    let newTier = ""
    let newCommission = 0
    let milestoneRides = 0

    if (previousRides < 500 && newRides >= 500) {
      crossedMilestone = true
      newTier = "Tier 2"
      newCommission = 6
      milestoneRides = 500
    } else if (previousRides < 1000 && newRides >= 1000) {
      crossedMilestone = true
      newTier = "Tier 3"
      newCommission = 7
      milestoneRides = 1000
    }

    if (crossedMilestone) {
      // Notify admin
      this.createNotification({
        type: "admin",
        recipientId: "admin", // Admin user ID
        title: `Driver Reached ${newTier} Milestone`,
        message: `${driver.name} (@${driver.piUsername}) has completed ${milestoneRides} rides and moved to ${newTier}. New commission rate: ${newCommission}%`,
        category: "tier_milestone",
        data: {
          driverId: driver.id,
          driverName: driver.name,
          driverUsername: driver.piUsername,
          tier: newTier,
          commission: newCommission,
          totalRides: newRides,
        },
      })

      // Notify driver
      this.createNotification({
        type: "driver",
        recipientId: driverId,
        title: `Congratulations! You've Reached ${newTier}`,
        message: `You've completed ${milestoneRides} rides! Your commission rate has been updated to ${newCommission}%. Keep up the great work!`,
        category: "fee_change",
        data: {
          tier: newTier,
          commission: newCommission,
          totalRides: newRides,
        },
      })
    }
  }
}

export const notificationsDB = new NotificationsDB()
