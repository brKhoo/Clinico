"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (status === "loading") {
        setLoadingTimeout(true)
      }
    }, 3000) // 3 second timeout

    return () => clearTimeout(timer)
  }, [status])

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role
      if (role === "PATIENT") {
        router.push("/patient")
      } else if (role === "PROVIDER") {
        router.push("/provider")
      } else if (role === "ADMIN") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [status, session, router])

  // Show loading only briefly, then show content even if session is still loading
  if (status === "loading" && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Clinico Scheduler</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Manage Your Appointments
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              A modern, intuitive appointment scheduling system that helps you
              stay organized and never miss an important meeting.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
