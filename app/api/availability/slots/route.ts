import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfDay, addDays, addMinutes, isAfter, isBefore } from "date-fns"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get("providerId")
    const date = searchParams.get("date")
    const duration = parseInt(searchParams.get("duration") || "30")

    if (!providerId || !date) {
      return NextResponse.json(
        { error: "providerId and date are required" },
        { status: 400 }
      )
    }

    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay()

    // Get provider's weekly availability
    const availability = await prisma.availability.findUnique({
      where: {
        userId_dayOfWeek: {
          userId: providerId,
          dayOfWeek,
        },
      },
    })

    if (!availability || !availability.isAvailable) {
      return NextResponse.json({ slots: [] })
    }

    // Get existing appointments for this date
    const appointments = await prisma.appointment.findMany({
      where: {
        providerId,
        startTime: {
          gte: startOfDay(selectedDate),
          lt: addDays(startOfDay(selectedDate), 1),
        },
        status: { not: "CANCELLED" },
      },
    })

    // Generate available slots
    const [startHour, startMinute] = availability.startTime.split(":").map(Number)
    const [endHour, endMinute] = availability.endTime.split(":").map(Number)

    const slots: string[] = []
    const start = new Date(selectedDate)
    start.setHours(startHour, startMinute, 0, 0)
    const end = new Date(selectedDate)
    end.setHours(endHour, endMinute, 0, 0)

    let current = new Date(start)
    while (isBefore(addMinutes(current, duration), end) || current.getTime() === end.getTime()) {
      const slotEnd = addMinutes(current, duration)

      // Check if slot conflicts with existing appointment
      const hasConflict = appointments.some((apt) => {
        const aptStart = new Date(apt.startTime)
        const aptEnd = new Date(apt.endTime)
        return (
          (isAfter(current, aptStart) && isBefore(current, aptEnd)) ||
          (isAfter(slotEnd, aptStart) && isBefore(slotEnd, aptEnd)) ||
          (isBefore(current, aptStart) && isAfter(slotEnd, aptEnd))
        )
      })

      if (!hasConflict && isAfter(slotEnd, new Date())) {
        slots.push(current.toISOString())
      }

      current = addMinutes(current, 30) // 30-minute intervals
    }

    return NextResponse.json({ slots })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
