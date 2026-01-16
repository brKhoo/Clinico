import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { redirect } from "next/navigation"

export type Role = "PATIENT" | "PROVIDER" | "ADMIN"

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

export async function requireAdmin() {
  return requireRole(["ADMIN"])
}

export async function requireProvider() {
  return requireRole(["PROVIDER", "ADMIN"])
}

export async function requirePatient() {
  return requireRole(["PATIENT", "ADMIN"])
}

export function hasRole(userRole: string, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole as Role)
}

export function isAdmin(userRole: string): boolean {
  return userRole === "ADMIN"
}

export function isProvider(userRole: string): boolean {
  return userRole === "PROVIDER" || userRole === "ADMIN"
}

export function isPatient(userRole: string): boolean {
  return userRole === "PATIENT" || userRole === "ADMIN"
}
