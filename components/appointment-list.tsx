"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatTime } from "@/lib/utils"
import { Trash2, Calendar, Clock, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EditAppointmentDialog } from "@/components/edit-appointment-dialog"

interface Appointment {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  status: string
}

interface AppointmentListProps {
  appointments: Appointment[]
  onUpdate: () => void
}

export function AppointmentList({ appointments, onUpdate }: AppointmentListProps) {
  const { toast } = useToast()
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) {
      return
    }

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Appointment cancelled",
        })
        onUpdate()
      } else {
        throw new Error("Failed to cancel appointment")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      })
    }
  }

  const sortedAppointments = [...appointments]
    .filter((apt) => apt.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  if (sortedAppointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No appointments scheduled</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {sortedAppointments.map((appointment) => {
        const startDate = new Date(appointment.startTime)
        const endDate = new Date(appointment.endTime)
        const isPast = startDate < new Date()

        return (
          <Card key={appointment.id} className={isPast ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{appointment.title}</CardTitle>
                  {appointment.description && (
                    <CardDescription className="mt-2">
                      {appointment.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingAppointment(appointment)
                      setIsEditDialogOpen(true)
                    }}
                    className="hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCancel(appointment.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatTime(startDate)} - {formatTime(endDate)}
                  </span>
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      appointment.status === "scheduled"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : appointment.status === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
      </div>
      <EditAppointmentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        appointment={editingAppointment}
        onAppointmentUpdated={onUpdate}
      />
    </>
  )
}
