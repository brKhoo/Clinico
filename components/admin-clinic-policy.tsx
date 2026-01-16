"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function ClinicPolicyManagement() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [policy, setPolicy] = useState({
    cancellationCutoffHours: 24,
    rescheduleCutoffHours: 12,
    officeHoursStart: "09:00",
    officeHoursEnd: "17:00",
  })

  useEffect(() => {
    fetch("/api/admin/policy")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setPolicy(data)
        }
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policy),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Clinic policy updated successfully",
        })
      } else {
        throw new Error("Failed to update policy")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update clinic policy",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Clinic Policy</h1>
        <p className="text-muted-foreground">
          Configure cancellation and reschedule policies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cancellationCutoff">Cancellation Cutoff (hours)</Label>
              <Input
                id="cancellationCutoff"
                type="number"
                value={policy.cancellationCutoffHours}
                onChange={(e) =>
                  setPolicy({ ...policy, cancellationCutoffHours: parseInt(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="rescheduleCutoff">Reschedule Cutoff (hours)</Label>
              <Input
                id="rescheduleCutoff"
                type="number"
                value={policy.rescheduleCutoffHours}
                onChange={(e) =>
                  setPolicy({ ...policy, rescheduleCutoffHours: parseInt(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="officeHoursStart">Office Hours Start</Label>
              <Input
                id="officeHoursStart"
                type="time"
                value={policy.officeHoursStart}
                onChange={(e) =>
                  setPolicy({ ...policy, officeHoursStart: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="officeHoursEnd">Office Hours End</Label>
              <Input
                id="officeHoursEnd"
                type="time"
                value={policy.officeHoursEnd}
                onChange={(e) =>
                  setPolicy({ ...policy, officeHoursEnd: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Policy"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
