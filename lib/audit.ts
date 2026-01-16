import { prisma } from "./prisma"
import { UserRole } from "@prisma/client"

export type AuditAction =
  | "APPOINTMENT_CREATED"
  | "APPOINTMENT_RESCHEDULED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_COMPLETED"
  | "APPOINTMENT_NO_SHOW"
  | "AVAILABILITY_UPDATED"
  | "AVAILABILITY_EXCEPTION_CREATED"
  | "APPOINTMENT_TYPE_CREATED"
  | "APPOINTMENT_TYPE_UPDATED"
  | "APPOINTMENT_TYPE_ARCHIVED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_ARCHIVED"
  | "USER_RESTORED"
  | "CLINIC_POLICY_UPDATED"
  | "WAITLIST_ENTRY_CREATED"
  | "WAITLIST_ENTRY_NOTIFIED"
  | "WAITLIST_ENTRY_BOOKED"

export type EntityType = "Appointment" | "Availability" | "AppointmentType" | "User" | "ClinicPolicy" | "WaitlistEntry"

export interface AuditMetadata {
  [key: string]: any
}

export async function logAuditEvent(
  actorUserId: string,
  action: AuditAction,
  entityType: EntityType,
  entityId?: string,
  metadata?: AuditMetadata
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId: entityId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error("Failed to log audit event:", error)
  }
}
