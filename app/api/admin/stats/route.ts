import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const providerId = searchParams.get("providerId")

    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const appointmentWhere: any = {
      ...dateFilter,
      ...(providerId && { providerId }),
    }

    // Get total counts
    const [
      totalUsers,
      totalProviders,
      totalPatients,
      totalAppointments,
      todayAppointments,
      cancelledAppointments,
      noShowAppointments,
      completedAppointments,
    ] = await Promise.all([
      prisma.user.count({ where: { isArchived: false } }),
      prisma.user.count({ where: { role: "PROVIDER", isArchived: false } }),
      prisma.user.count({ where: { role: "PATIENT", isArchived: false } }),
      prisma.appointment.count({ where: appointmentWhere }),
      prisma.appointment.count({
        where: {
          ...appointmentWhere,
          startTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: "SCHEDULED",
        },
      }),
      prisma.appointment.count({
        where: { ...appointmentWhere, status: "CANCELLED" },
      }),
      prisma.appointment.count({
        where: { ...appointmentWhere, status: "NO_SHOW" },
      }),
      prisma.appointment.count({
        where: { ...appointmentWhere, status: "COMPLETED" },
      }),
    ])

    // Calculate rates
    const totalScheduled = totalAppointments - cancelledAppointments
    const cancellationRate =
      totalScheduled > 0 ? (cancelledAppointments / totalScheduled) * 100 : 0
    const noShowRate =
      totalScheduled > 0 ? (noShowAppointments / totalScheduled) * 100 : 0

    // Get provider utilization
    const providers = await prisma.user.findMany({
      where: {
        role: "PROVIDER",
        isArchived: false,
        ...(providerId && { id: providerId }),
      },
      include: {
        providerAppointments: {
          where: appointmentWhere,
          select: {
            startTime: true,
            endTime: true,
            status: true,
          },
        },
        availability: true,
      },
    })

    const providerUtilization = providers.map((provider) => {
      const bookedMinutes = provider.providerAppointments
        .filter((apt) => apt.status === "SCHEDULED" || apt.status === "COMPLETED")
        .reduce((total, apt) => {
          const duration =
            (new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) /
            1000 /
            60
          return total + duration
        }, 0)

      // Calculate available minutes from availability
      const availableMinutes = provider.availability
        .filter((av) => av.isAvailable)
        .reduce((total, av) => {
          const [startH, startM] = av.startTime.split(":").map(Number)
          const [endH, endM] = av.endTime.split(":").map(Number)
          const minutesPerDay = (endH * 60 + endM) - (startH * 60 + startM)
          // Assuming 4 weeks for calculation
          return total + minutesPerDay * 4
        }, 0)

      const utilization =
        availableMinutes > 0 ? (bookedMinutes / availableMinutes) * 100 : 0

      return {
        providerId: provider.id,
        providerName: provider.name || provider.email,
        bookedMinutes,
        availableMinutes,
        utilization: Math.round(utilization * 100) / 100,
      }
    })

    // Get daily bookings
    const dailyBookings = await prisma.appointment.groupBy({
      by: ["startTime"],
      where: appointmentWhere,
      _count: true,
    })

    return NextResponse.json({
      totalUsers,
      totalProviders,
      totalPatients,
      totalAppointments,
      todayAppointments,
      cancelledAppointments,
      noShowAppointments,
      completedAppointments,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      noShowRate: Math.round(noShowRate * 100) / 100,
      providerUtilization,
      dailyBookings: dailyBookings.map((db) => ({
        date: db.startTime.toISOString().split("T")[0],
        count: db._count,
      })),
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
