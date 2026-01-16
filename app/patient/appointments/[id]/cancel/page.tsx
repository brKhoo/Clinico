"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CancelAppointmentDialog } from "@/components/cancel-appointment-dialog"

export default function CancelPage() {
  const params = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/appointments/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setAppointment(data)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Appointment not found</p>
        </div>
      </div>
    )
  }

  return (
    <CancelAppointmentDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          router.push("/patient")
        }
      }}
      appointment={appointment}
      onCancelled={() => {
        router.push("/patient")
      }}
    />
  )
}
