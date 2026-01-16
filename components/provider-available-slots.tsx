"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, startOfWeek, isSameDay, startOfDay } from "date-fns"
import { useSession } from "next-auth/react"

export default function ProviderAvailableSlots() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [availability, setAvailability] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchData()
    }
  }, [selectedDate, session])

  const fetchData = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      // Fetch availability for the selected day
      const dayOfWeek = selectedDate.getDay()
      const availabilityResponse = await fetch("/api/availability")
      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json()
        const dayAvailability = availabilityData.find(
          (av: any) => av.dayOfWeek === dayOfWeek
        )
        setAvailability(dayAvailability)
      }

      // Fetch appointments for the selected date
      const startOfSelectedDate = startOfDay(selectedDate)
      const endOfSelectedDate = addDays(startOfSelectedDate, 1)
      const appointmentsResponse = await fetch(
        `/api/appointments?role=provider&startDate=${startOfSelectedDate.toISOString()}&endDate=${endOfSelectedDate.toISOString()}`
      )
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        const dayAppointments = appointmentsData.filter((apt: any) =>
          isSameDay(new Date(apt.startTime), selectedDate)
        )
        setAppointments(dayAppointments)
      }

      // Fetch available slots
      if (session.user.id) {
        const slotsResponse = await fetch(
          `/api/availability/slots?providerId=${session.user.id}&date=${selectedDate.toISOString()}&duration=30`
        )
        if (slotsResponse.ok) {
          const slotsData = await slotsResponse.json()
          setAvailableSlots(slotsData.slots || [])
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const goToPreviousDay = () => {
    setSelectedDate((prev) => addDays(prev, -1))
  }

  const goToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1))
  }

  const getTimeSlots = () => {
    if (!availability || !availability.isAvailable) {
      return []
    }

    const [startHour, startMinute] = availability.startTime.split(":").map(Number)
    const [endHour, endMinute] = availability.endTime.split(":").map(Number)

    const slots: string[] = []
    const start = new Date(selectedDate)
    start.setHours(startHour, startMinute, 0, 0)
    const end = new Date(selectedDate)
    end.setHours(endHour, endMinute, 0, 0)

    let current = new Date(start)
    while (current < end) {
      slots.push(current.toISOString())
      current = new Date(current.getTime() + 30 * 60000) // Add 30 minutes
    }

    return slots
  }

  const isSlotBooked = (slotTime: string) => {
    return appointments.some((apt) => {
      const aptStart = new Date(apt.startTime)
      const slot = new Date(slotTime)
      return (
        slot >= aptStart &&
        slot < new Date(apt.endTime) &&
        apt.status !== "CANCELLED"
      )
    })
  }

  const isSlotAvailable = (slotTime: string) => {
    return availableSlots.some((slot) => {
      const slotDate = new Date(slot)
      const checkDate = new Date(slotTime)
      return (
        slotDate.getHours() === checkDate.getHours() &&
        slotDate.getMinutes() === checkDate.getMinutes()
      )
    })
  }

  const allSlots = getTimeSlots()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Available Slots</h1>
        <p className="text-muted-foreground">
          View your available time slots for booking
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <Input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-auto"
                />
              </div>
              <Button variant="outline" size="sm" onClick={goToNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading slots...</p>
          </CardContent>
        </Card>
      ) : !availability || !availability.isAvailable ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              You don't have availability set for {format(selectedDate, "EEEE")}
            </p>
            <Button onClick={() => window.location.href = "/provider/availability"}>
              Set Availability
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Available Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allSlots.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No time slots available
                  </p>
                ) : (
                  allSlots.map((slot) => {
                    const slotDate = new Date(slot)
                    const isBooked = isSlotBooked(slot)
                    const isAvailable = isSlotAvailable(slot)

                    return (
                      <div
                        key={slot}
                        className={`p-3 rounded-lg border ${
                          isBooked
                            ? "bg-red-50 border-red-200"
                            : isAvailable
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {format(slotDate, "h:mm a")}
                          </span>
                          <span className="text-xs px-2 py-1 rounded">
                            {isBooked
                              ? "Booked"
                              : isAvailable
                              ? "Available"
                              : "Unavailable"}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booked Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No appointments scheduled for this day
                  </p>
                ) : (
                  appointments
                    .sort(
                      (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime()
                    )
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3 rounded-lg border bg-blue-50 border-blue-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{apt.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(apt.startTime), "h:mm a")} -{" "}
                              {format(new Date(apt.endTime), "h:mm a")}
                            </p>
                            {apt.patient && (
                              <p className="text-sm text-muted-foreground">
                                Patient: {apt.patient.name || apt.patient.email}
                              </p>
                            )}
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-blue-100">
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded bg-green-200"></div>
            <span>Available for booking</span>
            <div className="w-4 h-4 rounded bg-red-200 ml-4"></div>
            <span>Booked</span>
            <div className="w-4 h-4 rounded bg-gray-200 ml-4"></div>
            <span>Unavailable</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
