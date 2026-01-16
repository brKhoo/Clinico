"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, FileText, CheckCircle, XCircle } from "lucide-react"
import { AppointmentIntake } from "@/components/appointment-intake"

export default function AppointmentDetails({ appointmentId }: { appointmentId: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [clinicalNotes, setClinicalNotes] = useState("")
  const [showIntake, setShowIntake] = useState(false)

  useEffect(() => {
    fetchAppointment()
  }, [appointmentId])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      if (response.ok) {
        const data = await response.json()
        setAppointment(data)
        setClinicalNotes(data.clinicalNotes || "")
        setLoading(false)
      }
    } catch (error) {
      setLoading(false)
    }
  }

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

  const isProvider = session?.user?.role === "PROVIDER" || session?.user?.role === "ADMIN"
  const isPatient = appointment.patientId === session?.user?.id
  const canEditIntake = isPatient && new Date(appointment.startTime) > new Date()

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{appointment.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">
                  {new Date(appointment.startTime).toLocaleString()} -{" "}
                  {new Date(appointment.endTime).toLocaleString()}
                </p>
              </div>
              {appointment.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{appointment.description}</p>
                </div>
              )}
              {appointment.patient && (
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">
                    {appointment.patient.name || appointment.patient.email}
                  </p>
                </div>
              )}
              {appointment.provider && (
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-medium">
                    {appointment.provider.name || appointment.provider.email}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span className="px-2 py-1 text-xs rounded bg-muted">
                  {appointment.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Intake Form */}
        {canEditIntake && (
          <AppointmentIntake
            appointmentId={appointmentId}
            currentNotes={appointment.notes}
            currentIntakeForms={appointment.intakeForms}
            onSave={fetchAppointment}
          />
        )}

        {/* Provider View: Intake Review */}
        {isProvider && (appointment.intakeForms || appointment.notes) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Patient Intake Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointment.intakeForms && (
                <div className="space-y-2 mb-4">
                  {Object.entries(JSON.parse(appointment.intakeForms)).map(([key, value]: [string, any]) => (
                    value && (
                      <div key={key}>
                        <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                        <p className="text-sm text-muted-foreground">{value}</p>
                      </div>
                    )
                  ))}
                </div>
              )}
              {appointment.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Patient Notes</p>
                  <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Provider Actions */}
        {isProvider && appointment.status === "SCHEDULED" && (
          <Card>
            <CardHeader>
              <CardTitle>Appointment Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleStatusChange("COMPLETED")}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Completed
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusChange("NO_SHOW")}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark No-Show
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clinical Notes (Provider) */}
        {isProvider && (
          <Card>
            <CardHeader>
              <CardTitle>Clinical Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clinicalNotes">Notes</Label>
                <Textarea
                  id="clinicalNotes"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Enter clinical notes after the visit..."
                  rows={6}
                  aria-label="Clinical notes"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveClinicalNotes}>
                  Save Clinical Notes
                </Button>
                {appointment.status === "COMPLETED" && appointment.patientId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Propose follow-up - redirect to booking with pre-filled info
                      const followUpDate = new Date(appointment.endTime)
                      followUpDate.setDate(followUpDate.getDate() + 30) // Suggest 30 days later
                      const params = new URLSearchParams({
                        appointmentTypeId: appointment.appointmentTypeId || "",
                        providerId: appointment.providerId || "",
                        suggestedDate: followUpDate.toISOString(),
                      })
                      router.push(`/patient/book?${params.toString()}`)
                    }}
                  >
                    Propose Follow-up
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

