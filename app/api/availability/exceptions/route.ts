import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"
import { z } from "zod"

const exceptionSchema = z.object({
  date: z.string().datetime(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().optional(),
  isBlocked: z.boolean().default(true),
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

    const where: any = {
      userId: session.user.id,
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const exceptions = await prisma.availabilityException.findMany({
      where,
      orderBy: { date: "asc" },
    })

    return NextResponse.json(exceptions)
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
    const { date, startTime, endTime, reason, isBlocked } = exceptionSchema.parse(body)

    const exception = await prisma.availabilityException.create({
      data: {
        userId: session.user.id,
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        reason: reason || null,
        isBlocked,
      },
    })

    await logAuditEvent(
      session.user.id,
      "AVAILABILITY_EXCEPTION_CREATED",
      "Availability",
      exception.id,
      { date, reason }
    )

    return NextResponse.json(exception, { status: 201 })
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
