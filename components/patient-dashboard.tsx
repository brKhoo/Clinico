"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, LogOut, User, FileText } from "lucide-react"
import Link from "next/link"

interface Appointment {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  status: string
  provider?: { name: string; email: string }
  appointmentType?: { name: string; duration: number }
}

export default function PatientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchAppointments()
      checkProfile()
    }
  }, [status])

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments?role=patient")
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const data = await response.json()
        setProfileComplete(data.profileComplete || false)
      }
    } catch (error) {
      console.error("Failed to check profile:", error)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const upcoming = appointments.filter(
    (apt) => new Date(apt.startTime) > new Date() && apt.status === "SCHEDULED"
  )
  const past = appointments.filter(
    (apt) => new Date(apt.startTime) < new Date() || apt.status !== "SCHEDULED"
  )

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Clinico Scheduler</h1>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              PATIENT
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user?.name || session.user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {!profileComplete && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm">Please complete your profile to book appointments.</p>
                </div>
                <Link href="/patient/profile">
                  <Button size="sm">Complete Profile</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Patient Dashboard</h2>
            <p className="text-muted-foreground mt-2">
              Manage your appointments and view your schedule
            </p>
          </div>
          <Link href="/patient/book">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{upcoming.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Past Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{past.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{appointments.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">Upcoming Appointments</h3>
            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcoming.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{apt.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(apt.startTime).toLocaleDateString()} at{" "}
                            {new Date(apt.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {apt.provider && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Provider: {apt.provider.name}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/patient/appointments/${apt.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          {new Date(apt.startTime) > new Date() && (
                            <>
                              <Link href={`/patient/appointments/${apt.id}/reschedule`}>
                                <Button variant="outline" size="sm">
                                  Reschedule
                                </Button>
                              </Link>
                              <Link href={`/patient/appointments/${apt.id}/cancel`}>
                                <Button variant="destructive" size="sm">
                                  Cancel
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Past Appointments</h3>
            {past.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No past appointments</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {past.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="pt-6">
                      <div>
                        <h4 className="font-semibold text-lg">{apt.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(apt.startTime).toLocaleDateString()} at{" "}
                          {new Date(apt.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-muted">
                          {apt.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
