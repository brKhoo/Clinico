import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const signature = request.headers.get("stripe-signature")

    // Store webhook event
    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        provider: "stripe",
        eventType: body.type || "unknown",
        payload: JSON.stringify(body),
        signature: signature || null,
        status: "pending",
      },
    })

    // Process payment-related events
    if (body.type === "payment_intent.succeeded") {
      const appointmentId = body.data?.object?.metadata?.appointmentId
      if (appointmentId) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { paymentStatus: "PAID" },
        })

        await logAuditEvent(
          "system",
          "APPOINTMENT_PAYMENT_RECEIVED",
          "Appointment",
          appointmentId,
          { paymentIntentId: body.data.object.id }
        )
      }
    } else if (body.type === "charge.refunded") {
      const appointmentId = body.data?.object?.metadata?.appointmentId
      if (appointmentId) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { paymentStatus: "REFUNDED" },
        })
      }
    }

    // Mark webhook as processed
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processedAt: new Date(),
        status: "processed",
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    
    // Mark webhook as failed if we have the event
    try {
      const body = await request.json()
      await prisma.webhookEvent.create({
        data: {
          provider: "stripe",
          eventType: body.type || "unknown",
          payload: JSON.stringify(body),
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
    } catch {}

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
