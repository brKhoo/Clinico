import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("activeOnly") === "true"

    const where: any = {
      isArchived: false,
    }

    if (activeOnly) {
      where.isActive = true
    }

    const appointmentTypes = await prisma.appointmentType.findMany({
      where,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(appointmentTypes)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
