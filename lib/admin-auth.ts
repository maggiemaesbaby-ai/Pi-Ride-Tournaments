import { cookies } from "next/headers"

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (!sessionCookie) {
      return false
    }

    const session = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString())

    // Check if session is expired
    if (session.expires < Date.now()) {
      return false
    }

    return session.authenticated === true
  } catch (error) {
    console.error("[v0] Admin auth check error:", error)
    return false
  }
}
