import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"
import { z } from "zod"

const appointmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  providerId: z.string().optional(),
  appointmentTypeId: z.string().optional(),
  patientId: z.string().optional(), // For admin creating appointments
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const role = searchParams.get("role")
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const providerId = searchParams.get("providerId")

    const where: any = {}

    // Role-based filtering
    if (role === "patient") {
      where.patientId = session.user.id
    } else if (role === "provider") {
      where.providerId = session.user.id
    } else {
      // Default: show appointments where user is patient or provider
      where.OR = [
        { patientId: session.user.id },
        { providerId: session.user.id },
      ]
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (status) {
      where.status = status
    }

    if (providerId) {
      where.providerId = providerId
    }

    if (search) {
      // SQLite doesn't support case-insensitive search, so we use contains
      where.OR = [
        ...(where.OR || []),
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, email: true } },
        provider: { select: { id: true, name: true, email: true } },
        appointmentType: { select: { id: true, name: true, duration: true } },
      },
      orderBy: { startTime: "asc" },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, startTime, endTime, providerId, appointmentTypeId, patientId } = appointmentSchema.parse(body)

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      )
    }

    // Determine patient and provider IDs based on role
    let finalPatientId = patientId
    let finalProviderId = providerId

    if (session.user.role === "PATIENT") {
      finalPatientId = session.user.id
      if (!finalProviderId) {
        return NextResponse.json(
          { error: "Provider ID is required" },
          { status: 400 }
        )
      }
    } else if (session.user.role === "PROVIDER") {
      finalProviderId = session.user.id
      if (!finalPatientId) {
        return NextResponse.json(
          { error: "Patient ID is required" },
          { status: 400 }
        )
      }
    } else if (session.user.role === "ADMIN") {
      if (!finalPatientId || !finalProviderId) {
        return NextResponse.json(
          { error: "Both patient and provider IDs are required" },
          { status: 400 }
        )
      }
    }

    // Check for conflicts with provider's schedule
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        providerId: finalProviderId,
        status: { not: "CANCELLED" },
        OR: [
          {
            startTime: { lte: start },
            endTime: { gt: start },
          },
          {
            startTime: { lt: end },
            endTime: { gte: end },
          },
          {
            startTime: { gte: start },
            endTime: { lte: end },
          },
        ],
      },
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: "Time slot is already booked" },
        { status: 400 }
      )
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: finalPatientId,
        providerId: finalProviderId,
        appointmentTypeId: appointmentTypeId || null,
        title,
        description: description || null,
        startTime: start,
        endTime: end,
        status: "SCHEDULED",
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        provider: { select: { id: true, name: true, email: true } },
        appointmentType: { select: { id: true, name: true } },
      },
    })

    // Log audit event
    await logAuditEvent(
      session.user.id,
      "APPOINTMENT_CREATED",
      "Appointment",
      appointment.id,
      {
        patientId: finalPatientId,
        providerId: finalProviderId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      }
    )

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
