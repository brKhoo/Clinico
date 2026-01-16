"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns"
import { Appointment } from "@/types/appointment"

interface AppointmentCalendarProps {
  appointments: Appointment[]
  onDateClick?: (date: Date) => void
}

export function AppointmentCalendar({ appointments, onDateClick }: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Get first day of week (0 = Sunday)
  const firstDayOfWeek = getDay(monthStart)
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => null)

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => isSameDay(new Date(apt.startTime), date))
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{format(currentDate, "MMMM yyyy")}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
          {daysBeforeMonth.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}
          {daysInMonth.map((day) => {
            const dayAppointments = getAppointmentsForDate(day)
            const hasAppointments = dayAppointments.length > 0
            const isToday = isSameDay(day, new Date())

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateClick?.(day)}
                className={`aspect-square p-1 text-sm rounded border transition-colors ${
                  isToday
                    ? "bg-primary text-primary-foreground border-primary"
                    : hasAppointments
                    ? "bg-muted border-muted-foreground/20 hover:bg-muted/80"
                    : "border-transparent hover:bg-muted/50"
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{format(day, "d")}</span>
                  {hasAppointments && (
                    <span className="text-xs mt-0.5">
                      {dayAppointments.length}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
