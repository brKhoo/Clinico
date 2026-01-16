import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    await requireAdmin()

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    })

    await logAuditEvent(
      session!.user.id,
      "USER_ARCHIVED",
      "User",
      params.id,
      { email: user.email, role: user.role }
    )

    return NextResponse.json(updated)
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
    await requireAdmin()

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        isArchived: false,
        archivedAt: null,
      },
    })

    await logAuditEvent(
      session!.user.id,
      "USER_RESTORED",
      "User",
      params.id,
      { email: user.email, role: user.role }
    )

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
