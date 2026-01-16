"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, LogOut, Settings, Users } from "lucide-react"
import Link from "next/link"
import { Appointment } from "@/types/appointment"
import { LoadingSpinner } from "@/components/ui/loading"
import { AppointmentCalendar } from "@/components/appointment-calendar"

export default function ProviderDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"upcoming" | "past">("upcoming")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchAppointments()
    }
  }, [status])

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments?role=provider")
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const upcoming = appointments
    .filter((apt) => new Date(apt.startTime) >= new Date() && apt.status === "SCHEDULED")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const past = appointments
    .filter((apt) => new Date(apt.startTime) < new Date() || apt.status !== "SCHEDULED")
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10)

  const uniquePatients = new Set(
    appointments.map((apt) => apt.patient?.email).filter(Boolean)
  ).size

  const displayedAppointments = viewMode === "upcoming" ? upcoming : past

  if (status === "loading" || isLoading) return <LoadingSpinner />

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-green-950/20">
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Clinico Scheduler</h1>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 shadow-sm">
              PROVIDER
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user?.name || session.user?.email}
            </span>
            <Link href="/availability">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Availability
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{uniquePatients}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{upcoming.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Past</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{past.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <AppointmentCalendar appointments={appointments} />
          <div>
            <div className="flex gap-2 mb-4">
              <Button
                variant={viewMode === "upcoming" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("upcoming")}
              >
                Upcoming
              </Button>
              <Button
                variant={viewMode === "past" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("past")}
              >
                Past
              </Button>
            </div>
            <h3 className="text-xl font-bold mb-4">
              {viewMode === "upcoming" ? "Upcoming Appointments" : "Past Appointments"}
            </h3>
            {displayedAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No {viewMode === "upcoming" ? "upcoming" : "past"} appointments
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {displayedAppointments.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{apt.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(apt.startTime).toLocaleDateString()} at{" "}
                            {new Date(apt.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {apt.patient && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {apt.patient.name || apt.patient.email}
                            </p>
                          )}
                          {viewMode === "past" && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-muted">
                              {apt.status}
                            </span>
                          )}
                        </div>
                        <Link href={`/provider/appointments/${apt.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
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
