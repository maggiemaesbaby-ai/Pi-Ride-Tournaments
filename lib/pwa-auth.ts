"use client"

// PWA Authentication Utilities - works across Pi Browser and PWA contexts

const PWA_USER_COOKIE = "pwa_user_id"
const PWA_USER_NAME_COOKIE = "pwa_user_name"

export function setPWAUser(userId: string, username?: string) {
  // Set cookie that's accessible in both Pi Browser and PWA
  document.cookie = `${PWA_USER_COOKIE}=${userId}; path=/; max-age=2592000; SameSite=Lax`

  if (username) {
    document.cookie = `${PWA_USER_NAME_COOKIE}=${encodeURIComponent(username)}; path=/; max-age=2592000; SameSite=Lax`
  }

  // Also store in localStorage as fallback
  if (typeof window !== "undefined") {
    localStorage.setItem("pwa_user_id", userId)
    if (username) {
      localStorage.setItem("pwa_user_name", username)
    }
  }

  console.log("[v0] PWA user stored:", userId, username)
}

export function setPWAUserId(userId: string, username?: string) {
  setPWAUser(userId, username)
}

export function getPWAUser(): { userId: string | null; username: string | null } {
  // Try cookies first (works across contexts)
  const cookies = document.cookie.split(";")
  let userId: string | null = null
  let username: string | null = null

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=")
    if (name === PWA_USER_COOKIE) {
      userId = value
    }
    if (name === PWA_USER_NAME_COOKIE) {
      username = decodeURIComponent(value)
    }
  }

  // Fallback to localStorage
  if (!userId && typeof window !== "undefined") {
    userId = localStorage.getItem("pwa_user_id")
    username = localStorage.getItem("pwa_user_name")
  }

  console.log("[v0] PWA user retrieved:", userId, username)

  return { userId, username }
}

export function clearPWAUser() {
  // Clear cookies
  document.cookie = `${PWA_USER_COOKIE}=; path=/; max-age=0`
  document.cookie = `${PWA_USER_NAME_COOKIE}=; path=/; max-age=0`

  // Clear localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("pwa_user_id")
    localStorage.removeItem("pwa_user_name")
  }

  console.log("[v0] PWA user cleared")
}
