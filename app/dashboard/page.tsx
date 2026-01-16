"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Redirect based on role
      const role = session.user.role
      if (role === "PATIENT") {
        router.push("/patient")
      } else if (role === "PROVIDER") {
        router.push("/provider")
      } else if (role === "ADMIN") {
        router.push("/admin")
      }
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, session, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments")
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

  const handleAppointmentCreated = () => {
    fetchAppointments()
    setIsDialogOpen(false)
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

  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.startTime) > new Date() && apt.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Clinico Scheduler</h1>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground mt-2">
              Manage your appointments and schedule
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Total Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {appointments.filter((apt) => apt.status !== "cancelled").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {upcomingAppointments.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {
                  appointments.filter(
                    (apt) =>
                      new Date(apt.startTime).getMonth() === new Date().getMonth() &&
                      apt.status !== "cancelled"
                  ).length
                }
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4">Upcoming Appointments</h3>
          <AppointmentList
            appointments={appointments}
            onUpdate={fetchAppointments}
          />
        </div>
      </main>

      <CreateAppointmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAppointmentCreated={handleAppointmentCreated}
      />
    </div>
  )
}
