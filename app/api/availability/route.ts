import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  isAvailable: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const availability = await prisma.availability.findMany({
      where: { userId: session.user.id },
      orderBy: { dayOfWeek: "asc" },
    })

    return NextResponse.json(availability)
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
    const { dayOfWeek, startTime, endTime, isAvailable } = availabilitySchema.parse(body)

    const availability = await prisma.availability.upsert({
      where: {
        userId_dayOfWeek: {
          userId: session.user.id,
          dayOfWeek,
        },
      },
      update: {
        startTime,
        endTime,
        isAvailable: isAvailable ?? true,
      },
      create: {
        userId: session.user.id,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable: isAvailable ?? true,
      },
    })

    return NextResponse.json(availability, { status: 201 })
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
