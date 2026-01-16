"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import AppointmentDetails from "@/components/appointment-details"

export default function PatientAppointmentPage() {
  const params = useParams()
  const router = useRouter()
  const [appointmentId, setAppointmentId] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      setAppointmentId(params.id as string)
    }
  }, [params.id])

  if (!appointmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <AppointmentDetails appointmentId={appointmentId} />
}
