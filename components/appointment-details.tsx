"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading"
import { Appointment } from "@/types/appointment"

export default function AppointmentDetails({ appointmentId }: { appointmentId: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [clinicalNotes, setClinicalNotes] = useState("")

  const fetchAppointment = useCallback(async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        cache: "no-store", // Always fetch fresh data
      })
      if (response.ok) {
        const data = await response.json()
        setAppointment(data)
        setClinicalNotes(data.clinicalNotes || "")
        setLoading(false)
      }
    } catch (error) {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    fetchAppointment()
  }, [fetchAppointment])


  const handleStatusChange = async (status: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Appointment marked as ${status}`,
        })
        fetchAppointment()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleSaveClinicalNotes = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicalNotes }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Clinical notes saved",
        })
        fetchAppointment()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      })
    }
  }

  if (loading) return <LoadingSpinner />

  if (!appointment) return <LoadingSpinner message="Appointment not found" />

  const isProvider = session?.user?.role === "PROVIDER"
  const isPatient = appointment.patientId === session?.user?.id

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{appointment.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Date & Time</p>
                <p className="font-medium">
                  {new Date(appointment.startTime).toLocaleString()} - {new Date(appointment.endTime).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <span className="px-2 py-1 text-xs rounded bg-muted">{appointment.status}</span>
              </div>
              {appointment.patient && (
                <div>
                  <p className="text-muted-foreground">Patient</p>
                  <p className="font-medium">{appointment.patient.name || appointment.patient.email}</p>
                </div>
              )}
              {appointment.provider && (
                <div>
                  <p className="text-muted-foreground">Provider</p>
                  <p className="font-medium">{appointment.provider.name || appointment.provider.email}</p>
                </div>
              )}
            </div>
            {appointment.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{appointment.description}</p>
              </div>
            )}
            {appointment.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {isProvider && appointment.status === "SCHEDULED" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Button onClick={() => handleStatusChange("COMPLETED")} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                </Button>
                <Button variant="destructive" onClick={() => handleStatusChange("NO_SHOW")} className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  No-Show
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isProvider && (
          <Card>
            <CardHeader>
              <CardTitle>Clinical Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Enter clinical notes..."
                rows={4}
              />
              <Button onClick={handleSaveClinicalNotes} size="sm">
                Save Notes
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

