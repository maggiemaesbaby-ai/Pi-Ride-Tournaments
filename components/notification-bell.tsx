"use client"

import { useState, useEffect } from "react"
import { Bell } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { NotificationDB, type Notification } from "@/lib/notification-db"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useRouter } from "next/navigation"

export function NotificationBell() {
  const { user } = usePiWallet()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadNotifications()
      const interval = setInterval(loadNotifications, 10000) // Check every 10 seconds
      return () => clearInterval(interval)
    }
  }, [user])

  const loadNotifications = () => {
    if (!user) return

    const userNotifications = NotificationDB.getNotificationsByUser(user.uid)
    setNotifications(userNotifications.slice(0, 5)) // Show last 5
    setUnreadCount(NotificationDB.getUnreadCount(user.uid))
  }

  const handleNotificationClick = (notification: Notification) => {
    NotificationDB.markAsRead(notification.id)
    loadNotifications()

    // Navigate based on notification type
    if (notification.data?.orderId) {
      router.push("/marketplace/account")
    } else if (notification.data?.productId) {
      router.push("/marketplace")
    }
  }

  const handleMarkAllRead = () => {
    if (user) {
      NotificationDB.markAllAsRead(user.uid)
      loadNotifications()
    }
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="px-3 py-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3 w-full">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notification.read ? "bg-muted" : "bg-primary"}`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${notification.read ? "font-normal" : "font-semibold"}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-sm text-primary cursor-pointer"
              onClick={() => router.push("/marketplace/account?tab=messages")}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
