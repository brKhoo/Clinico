"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { FileText } from "lucide-react"

interface AppointmentIntakeProps {
  appointmentId: string
  currentNotes?: string
  currentIntakeForms?: string
  onSave: () => void
}

export function AppointmentIntake({
  appointmentId,
  currentNotes,
  currentIntakeForms,
  onSave,
}: AppointmentIntakeProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState(currentNotes || "")
  const [intakeData, setIntakeData] = useState(() => {
    try {
      return currentIntakeForms ? JSON.parse(currentIntakeForms) : {}
    } catch {
      return {}
    }
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          intakeForms: JSON.stringify(intakeData),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Intake form and notes saved",
        })
        onSave()
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save intake form",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Intake Form & Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="chiefComplaint">Chief Complaint</Label>
          <Input
            id="chiefComplaint"
            value={intakeData.chiefComplaint || ""}
            onChange={(e) =>
              setIntakeData({ ...intakeData, chiefComplaint: e.target.value })
            }
            placeholder="What brings you in today?"
            aria-label="Chief complaint"
          />
        </div>
        <div>
          <Label htmlFor="symptoms">Symptoms</Label>
          <Textarea
            id="symptoms"
            value={intakeData.symptoms || ""}
            onChange={(e) =>
              setIntakeData({ ...intakeData, symptoms: e.target.value })
            }
            placeholder="Describe your symptoms..."
            rows={3}
            aria-label="Symptoms"
          />
        </div>
        <div>
          <Label htmlFor="medications">Current Medications</Label>
          <Textarea
            id="medications"
            value={intakeData.medications || ""}
            onChange={(e) =>
              setIntakeData({ ...intakeData, medications: e.target.value })
            }
            placeholder="List current medications..."
            rows={2}
            aria-label="Current medications"
          />
        </div>
        <div>
          <Label htmlFor="allergies">Allergies</Label>
          <Input
            id="allergies"
            value={intakeData.allergies || ""}
            onChange={(e) =>
              setIntakeData({ ...intakeData, allergies: e.target.value })
            }
            placeholder="List any allergies..."
            aria-label="Allergies"
          />
        </div>
        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information..."
            rows={3}
            aria-label="Additional notes"
          />
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  )
}
