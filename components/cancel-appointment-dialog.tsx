"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle } from "lucide-react"

interface CancelAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: {
    id: string
    title: string
    startTime: string
  }
  onCancelled: () => void
}

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onCancelled,
}: CancelAppointmentDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel appointment")
      }

      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      })

      onCancelled()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Appointment
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this appointment?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Appointment:</strong> {appointment.title}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Date:</strong> {new Date(appointment.startTime).toLocaleString()}
          </p>
          <p className="text-sm text-destructive mt-4">
            This action cannot be undone. You may be subject to cancellation fees if you cancel within the policy cutoff time.
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Keep Appointment
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? "Cancelling..." : "Cancel Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
