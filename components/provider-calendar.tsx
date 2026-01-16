"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday } from "date-fns"

interface Appointment {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  patient?: { name: string; email: string }
}

export default function ProviderCalendar() {
  const [viewMode, setViewMode] = useState<"day" | "week">("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [currentDate, viewMode])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const start = viewMode === "day" 
        ? new Date(currentDate.setHours(0, 0, 0, 0))
        : startOfWeek(currentDate)
      const end = viewMode === "day"
        ? new Date(currentDate.setHours(23, 59, 59, 999))
        : addDays(startOfWeek(currentDate), 6)

      const response = await fetch(
        `/api/appointments?role=provider&startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      )
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  const weekStart = startOfWeek(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 7 PM

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) =>
      isSameDay(new Date(apt.startTime), day)
    )
  }

  const getAppointmentPosition = (appointment: Appointment) => {
    const start = new Date(appointment.startTime)
    const end = new Date(appointment.endTime)
    const startHour = start.getHours()
    const startMinute = start.getMinutes()
    const duration = (end.getTime() - start.getTime()) / (1000 * 60) // minutes

    const top = ((startHour - 8) * 60 + startMinute) * 2 // 2px per minute
    const height = duration * 2

    return { top, height }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentDate((d) =>
                  viewMode === "day" ? addDays(d, -1) : subWeeks(d, 1)
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentDate((d) =>
                  viewMode === "day" ? addDays(d, 1) : addWeeks(d, 1)
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-2xl font-bold">
            {viewMode === "day"
              ? format(currentDate, "MMMM d, yyyy")
              : `${format(weekStart, "MMM d")} - ${format(addDays(weekStart, 6), "MMM d, yyyy")}`}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
        </div>
      </div>

      {viewMode === "day" ? (
        <Card>
          <CardContent className="p-0">
            <div className="relative">
              <div className="grid grid-cols-1">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-l p-2 min-h-[120px]"
                    style={{ gridColumn: "1" }}
                  >
                    <div className="font-medium text-sm mb-2">
                      {hour}:00
                    </div>
                    <div className="space-y-1">
                      {getAppointmentsForDay(currentDate)
                        .filter(
                          (apt) =>
                            new Date(apt.startTime).getHours() === hour
                        )
                        .map((apt) => {
                          const { top, height } = getAppointmentPosition(apt)
                          return (
                            <div
                              key={apt.id}
                              className="bg-primary text-primary-foreground p-2 rounded text-sm"
                              style={{ height: `${height}px` }}
                            >
                              <div className="font-medium">{apt.title}</div>
                              <div className="text-xs opacity-90">
                                {format(new Date(apt.startTime), "h:mm a")} -{" "}
                                {format(new Date(apt.endTime), "h:mm a")}
                              </div>
                              {apt.patient && (
                                <div className="text-xs opacity-75">
                                  {apt.patient.name || apt.patient.email}
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-8 min-w-[800px]">
                <div className="border-b border-r p-2 font-medium">Time</div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`border-b border-r p-2 text-center ${
                      isToday(day) ? "bg-muted" : ""
                    }`}
                  >
                    <div className="font-medium">
                      {format(day, "EEE")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(day, "MMM d")}
                    </div>
                  </div>
                ))}
                {hours.map((hour) => (
                  <>
                    <div
                      key={`time-${hour}`}
                      className="border-b border-r p-2 text-sm font-medium"
                    >
                      {hour}:00
                    </div>
                    {weekDays.map((day) => (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className="border-b border-r p-1 min-h-[60px]"
                      >
                        {getAppointmentsForDay(day)
                          .filter(
                            (apt) =>
                              new Date(apt.startTime).getHours() === hour
                          )
                          .map((apt) => (
                            <div
                              key={apt.id}
                              className="bg-primary text-primary-foreground p-1 rounded text-xs mb-1"
                            >
                              <div className="font-medium truncate">
                                {apt.title}
                              </div>
                              <div className="text-xs opacity-75 truncate">
                                {apt.patient?.name || apt.patient?.email}
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
