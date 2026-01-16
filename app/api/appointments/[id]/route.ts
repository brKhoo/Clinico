import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getClinicPolicy() {
  const policy = await prisma.clinicPolicy.findFirst({
    where: { id: "default" },
  })
  return policy || {
    cancellationCutoffHours: 24,
    rescheduleCutoffHours: 12,
  }
}

async function checkPolicyCutoff(appointmentStartTime: Date, cutoffHours: number): Promise<boolean> {
  const now = new Date()
  const cutoffTime = new Date(appointmentStartTime.getTime() - cutoffHours * 60 * 60 * 1000)
  return now > cutoffTime
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        OR: [
          { patientId: session.user.id },
          { providerId: session.user.id },
        ],
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        provider: { select: { id: true, name: true, email: true } },
        appointmentType: { select: { id: true, name: true, duration: true, price: true } },
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, startTime, endTime, status, clinicalNotes, notes, intakeForms } = body

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        OR: [
          { patientId: session.user.id },
          { providerId: session.user.id },
        ],
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Check permissions
    const isPatient = appointment.patientId === session.user.id
    const isProvider = appointment.providerId === session.user.id

    // Policy enforcement for reschedule/cancellation
    if ((startTime || endTime) && isPatient) {
      const policy = await getClinicPolicy()
      const newStartTime = startTime ? new Date(startTime) : appointment.startTime
      const withinCutoff = await checkPolicyCutoff(newStartTime, policy.rescheduleCutoffHours)
      
      if (withinCutoff) {
        return NextResponse.json(
          { 
            error: `Cannot reschedule. Must reschedule at least ${policy.rescheduleCutoffHours} hours before the appointment.`,
            cutoffHours: policy.rescheduleCutoffHours,
          },
          { status: 400 }
        )
      }
    }

    // If times are being updated, validate and check for conflicts
    if (startTime || endTime) {
      const start = startTime ? new Date(startTime) : appointment.startTime
      const end = endTime ? new Date(endTime) : appointment.endTime

      if (start >= end) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        )
      }

      // Check for conflicts with provider's schedule
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          providerId: appointment.providerId,
          id: { not: params.id },
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
          { error: "Time slot conflicts with another appointment" },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (startTime) updateData.startTime = new Date(startTime)
    if (endTime) updateData.endTime = new Date(endTime)
    if (status) updateData.status = status
    if (clinicalNotes !== undefined && isProvider) updateData.clinicalNotes = clinicalNotes
    if (notes !== undefined && isPatient) updateData.notes = notes
    if (intakeForms !== undefined && isPatient) updateData.intakeForms = intakeForms

    const wasRescheduled = (startTime || endTime) && (startTime !== appointment.startTime.toISOString() || endTime !== appointment.endTime.toISOString())
    const wasStatusChanged = status && status !== appointment.status

    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        patient: { select: { id: true, name: true, email: true } },
        provider: { select: { id: true, name: true, email: true } },
        appointmentType: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        OR: [
          { patientId: session.user.id },
          { providerId: session.user.id },
        ],
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Policy enforcement for cancellation
    if (appointment.patientId === session.user.id) {
      const policy = await getClinicPolicy()
      const withinCutoff = await checkPolicyCutoff(appointment.startTime, policy.cancellationCutoffHours)
      
      if (withinCutoff) {
        return NextResponse.json(
          { 
            error: `Cannot cancel. Must cancel at least ${policy.cancellationCutoffHours} hours before the appointment.`,
            cutoffHours: policy.cancellationCutoffHours,
          },
          { status: 400 }
        )
      }
    }

    await prisma.appointment.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    })


    return NextResponse.json({ message: "Appointment cancelled" })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
