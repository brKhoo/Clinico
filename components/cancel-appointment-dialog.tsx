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
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogDescription>{appointment.title}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            {new Date(appointment.startTime).toLocaleString()}
          </p>
          <p className="text-sm text-destructive">
            This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Keep
          </Button>
          <Button type="button" variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading ? "Cancelling..." : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
