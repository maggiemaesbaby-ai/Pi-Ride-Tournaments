export interface Notification {
  id: string
  userId: string
  type: "purchase" | "sale" | "offer" | "order_update" | "message" | "system"
  title: string
  message: string
  read: boolean
  data?: {
    orderId?: string
    productId?: string
    offerId?: string
    amount?: number
    [key: string]: any
  }
  createdAt: number
}

export interface EmailNotification {
  id: string
  to: string
  subject: string
  body: string
  sentAt: number
  orderId?: string
  productId?: string
}

export class NotificationDB {
  private static NOTIFICATIONS_KEY = "app_notifications"
  private static EMAILS_KEY = "app_emails"

  private static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
  }

  // Notification Management
  static createNotification(notification: Omit<Notification, "id" | "createdAt" | "read">): string {
    if (!this.isBrowser()) return ""

    const notifications = this.getAllNotifications()
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: Date.now(),
    }
    notifications.push(newNotification)
    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications))

    console.log("[v0] Notification created:", newNotification)
    return newNotification.id
  }

  static getAllNotifications(): Notification[] {
    if (!this.isBrowser()) return []

    const data = localStorage.getItem(this.NOTIFICATIONS_KEY)
    return data ? JSON.parse(data) : []
  }

  static getNotificationsByUser(userId: string): Notification[] {
    return this.getAllNotifications()
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  static getUnreadCount(userId: string): number {
    return this.getAllNotifications().filter((n) => n.userId === userId && !n.read).length
  }

  static markAsRead(id: string): boolean {
    if (!this.isBrowser()) return false

    const notifications = this.getAllNotifications()
    const index = notifications.findIndex((n) => n.id === id)
    if (index === -1) return false

    notifications[index].read = true
    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications))
    return true
  }

  static markAllAsRead(userId: string): boolean {
    if (!this.isBrowser()) return false

    const notifications = this.getAllNotifications()
    let updated = false

    notifications.forEach((n) => {
      if (n.userId === userId && !n.read) {
        n.read = true
        updated = true
      }
    })

    if (updated) {
      localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications))
    }
    return updated
  }

  static deleteNotification(id: string): boolean {
    if (!this.isBrowser()) return false

    const notifications = this.getAllNotifications()
    const filtered = notifications.filter((n) => n.id !== id)
    if (filtered.length === notifications.length) return false

    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(filtered))
    return true
  }

  // Email Simulation (for demo purposes - in production, use actual email service)
  static sendEmail(email: Omit<EmailNotification, "id" | "sentAt">): string {
    if (!this.isBrowser()) return ""

    const emails = this.getAllEmails()
    const newEmail: EmailNotification = {
      ...email,
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sentAt: Date.now(),
    }
    emails.push(newEmail)
    localStorage.setItem(this.EMAILS_KEY, JSON.stringify(emails))

    console.log("[v0] Email sent:", newEmail)
    return newEmail.id
  }

  static getAllEmails(): EmailNotification[] {
    if (!this.isBrowser()) return []

    const data = localStorage.getItem(this.EMAILS_KEY)
    return data ? JSON.parse(data) : []
  }

  // Helper methods for common notification scenarios
  static notifyPurchase(
    buyerId: string,
    sellerId: string,
    adminId: string,
    orderId: string,
    productTitle: string,
    amount: number,
  ) {
    // Notify buyer
    this.createNotification({
      userId: buyerId,
      type: "purchase",
      title: "Purchase Confirmed!",
      message: `Your order for "${productTitle}" (${amount}π) has been confirmed. Track your order in My Account.`,
      data: { orderId, amount, productTitle },
    })

    this.sendEmail({
      to: "buyer@example.com",
      subject: "Order Confirmation - Pi Ride Marketplace",
      body: `Thank you for your purchase!\n\nProduct: ${productTitle}\nAmount: ${amount}π\nOrder ID: ${orderId}\n\nYou can track your order at: [marketplace link]`,
      orderId,
    })

    // Notify seller
    this.createNotification({
      userId: sellerId,
      type: "sale",
      title: "New Sale!",
      message: `You sold "${productTitle}" for ${amount}π. Please prepare the item for shipment.`,
      data: { orderId, amount, productTitle },
    })

    this.sendEmail({
      to: "seller@example.com",
      subject: "New Sale - Pi Ride Marketplace",
      body: `Congratulations! You have a new sale.\n\nProduct: ${productTitle}\nAmount: ${amount}π\nOrder ID: ${orderId}\n\nPlease log in to your dashboard to manage this order.`,
      orderId,
    })

    // Notify admin
    this.createNotification({
      userId: adminId,
      type: "system",
      title: "New Order",
      message: `Order ${orderId}: "${productTitle}" sold for ${amount}π`,
      data: { orderId, amount, productTitle, buyerId, sellerId },
    })

    console.log("[v0] Purchase notifications sent for order:", orderId)
  }

  static notifyOrderUpdate(
    userId: string,
    orderId: string,
    status: string,
    productTitle: string,
    trackingNumber?: string,
  ) {
    const messages = {
      paid: "Your payment has been confirmed.",
      shipped: trackingNumber
        ? `Your order has been shipped! Tracking: ${trackingNumber}`
        : "Your order has been shipped!",
      delivered: "Your order has been delivered. Enjoy your purchase!",
      cancelled: "Your order has been cancelled.",
    }

    this.createNotification({
      userId,
      type: "order_update",
      title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `"${productTitle}" - ${messages[status as keyof typeof messages] || "Order status updated"}`,
      data: { orderId, status, trackingNumber },
    })

    this.sendEmail({
      to: "user@example.com",
      subject: `Order Update - ${productTitle}`,
      body: `Your order status has been updated.\n\nProduct: ${productTitle}\nStatus: ${status}\n${trackingNumber ? `Tracking: ${trackingNumber}\n` : ""}\nOrder ID: ${orderId}`,
      orderId,
    })
  }

  static notifyOffer(sellerId: string, offerId: string, productTitle: string, amount: number, buyerUsername: string) {
    this.createNotification({
      userId: sellerId,
      type: "offer",
      title: "New Offer Received",
      message: `${buyerUsername} offered ${amount}π for "${productTitle}"`,
      data: { offerId, amount, productTitle },
    })

    this.sendEmail({
      to: "seller@example.com",
      subject: "New Offer on Your Product",
      body: `You have received a new offer!\n\nProduct: ${productTitle}\nOffer: ${amount}π\nFrom: ${buyerUsername}\n\nLog in to accept, counter, or reject this offer.`,
    })
  }
}
