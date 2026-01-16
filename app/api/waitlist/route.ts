import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"
import { z } from "zod"
import { requireAdmin } from "@/lib/rbac"

const waitlistSchema = z.object({
  appointmentTypeId: z.string(),
  providerId: z.string().optional(),
  preferredDays: z.array(z.number()).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const status = searchParams.get("status")

    const where: any = {}

    if (session.user.role === "PATIENT") {
      where.patientId = session.user.id
    } else if (session.user.role === "ADMIN") {
      if (patientId) where.patientId = patientId
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (status) {
      where.status = status
    }

    const entries = await prisma.waitlistEntry.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, email: true } },
        provider: { select: { id: true, name: true, email: true } },
        appointmentType: { select: { id: true, name: true, duration: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(entries)
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
    if (!session?.user?.id || session.user.role !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentTypeId, providerId, preferredDays } = waitlistSchema.parse(body)

    const entry = await prisma.waitlistEntry.create({
      data: {
        patientId: session.user.id,
        appointmentTypeId,
        providerId: providerId || null,
        preferredDays: preferredDays ? JSON.stringify(preferredDays) : null,
        status: "active",
      },
      include: {
        appointmentType: { select: { name: true } },
      },
    })

    await logAuditEvent(
      session.user.id,
      "WAITLIST_ENTRY_CREATED",
      "WaitlistEntry",
      entry.id,
      { appointmentTypeId, providerId }
    )

    return NextResponse.json(entry, { status: 201 })
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
