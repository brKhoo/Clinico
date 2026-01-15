import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
        userId: session.user.id,
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Clinico not found" }, { status: 404 })
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
    const { title, description, startTime, endTime, status } = body

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Clinico not found" }, { status: 404 })
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

      // Check for conflicts with other appointments (excluding the current one)
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          userId: session.user.id,
          id: { not: params.id },
          status: { not: "cancelled" },
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

    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(status && { status }),
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
        userId: session.user.id,
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Clinico not found" }, { status: 404 })
    }

    await prisma.appointment.update({
      where: { id: params.id },
      data: { status: "cancelled" },
    })

    return NextResponse.json({ message: "Clinico cancelled" })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
