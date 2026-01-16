import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    const policy = await prisma.clinicPolicy.findFirst({
      where: { id: "default" },
    })

    if (!policy) {
      // Return defaults if no policy exists
      return NextResponse.json({
        cancellationCutoffHours: 24,
        rescheduleCutoffHours: 12,
        officeHoursStart: "09:00",
        officeHoursEnd: "17:00",
      })
    }

    return NextResponse.json(policy)
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
    await requireAdmin()

    const body = await request.json()
    const { cancellationCutoffHours, rescheduleCutoffHours, officeHoursStart, officeHoursEnd } = body

    const policy = await prisma.clinicPolicy.upsert({
      where: { id: "default" },
      update: {
        cancellationCutoffHours,
        rescheduleCutoffHours,
        officeHoursStart,
        officeHoursEnd,
      },
      create: {
        id: "default",
        cancellationCutoffHours,
        rescheduleCutoffHours,
        officeHoursStart,
        officeHoursEnd,
      },
    })

    await logAuditEvent(
      session!.user.id,
      "CLINIC_POLICY_UPDATED",
      "ClinicPolicy",
      policy.id,
      { cancellationCutoffHours, rescheduleCutoffHours }
    )

    return NextResponse.json(policy)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
