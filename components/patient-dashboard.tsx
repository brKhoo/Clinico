"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, LogOut } from "lucide-react"
import Link from "next/link"
import { Appointment } from "@/types/appointment"
import { LoadingSpinner } from "@/components/ui/loading"
import { RescheduleAppointmentDialog } from "@/components/reschedule-appointment-dialog"
import { CancelAppointmentDialog } from "@/components/cancel-appointment-dialog"
import { AppointmentCalendar } from "@/components/appointment-calendar"

export default function PatientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
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
      const response = await fetch("/api/appointments?role=patient")
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) return <LoadingSpinner />

  if (!session) {
    return null
  }

  const upcoming = appointments
    .filter((apt) => new Date(apt.startTime) >= new Date() && apt.status === "SCHEDULED")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const past = appointments
    .filter((apt) => new Date(apt.startTime) < new Date() || apt.status !== "SCHEDULED")
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10)

  const displayedAppointments = viewMode === "upcoming" ? upcoming : past

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-green-950/20">
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Clinico Scheduler</h1>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shadow-sm">
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Appointments</h2>
          <Link href="/patient/book">
            <Button size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Book
            </Button>
          </Link>
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
                          {apt.provider && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {apt.provider.name}
                            </p>
                          )}
                          {viewMode === "past" && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-muted">
                              {apt.status}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/patient/appointments/${apt.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          {viewMode === "upcoming" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAppointment(apt)
                                  setRescheduleOpen(true)
                                }}
                              >
                                Reschedule
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedAppointment(apt)
                                  setCancelOpen(true)
                                }}
                              >
                                Cancel
                              </Button>
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
        </div>

        {selectedAppointment && (
          <>
            <RescheduleAppointmentDialog
              open={rescheduleOpen}
              onOpenChange={setRescheduleOpen}
              appointment={selectedAppointment}
              onRescheduled={() => {
                fetchAppointments()
                setRescheduleOpen(false)
              }}
            />
            <CancelAppointmentDialog
              open={cancelOpen}
              onOpenChange={setCancelOpen}
              appointment={selectedAppointment}
              onCancelled={() => {
                fetchAppointments()
                setCancelOpen(false)
              }}
            />
          </>
        )}
      </main>
    </div>
  )
}
