import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { redirect } from "next/navigation"

export type Role = "PATIENT" | "PROVIDER"

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }
  return session
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.user.role as Role)) {
    redirect("/unauthorized")
  }
  return session
}

export async function requireProvider() {
  return requireRole(["PROVIDER"])
}

export async function requirePatient() {
  return requireRole(["PATIENT"])
}

export function hasRole(userRole: string, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole as Role)
}

export function isProvider(userRole: string): boolean {
  return userRole === "PROVIDER"
}

export function isPatient(userRole: string): boolean {
  return userRole === "PATIENT"
}
