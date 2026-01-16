"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Settings, Plus, X } from "lucide-react"
import { format } from "date-fns"

export default function ProviderAvailability() {
  const router = useRouter()
  const { toast } = useToast()
  const [exceptions, setExceptions] = useState<any[]>([])
  const [showExceptionForm, setShowExceptionForm] = useState(false)
  const [exceptionForm, setExceptionForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    isBlocked: true,
  })

  useEffect(() => {
    fetchExceptions()
  }, [])

  const fetchExceptions = async () => {
    try {
      const response = await fetch("/api/availability/exceptions")
      if (response.ok) {
        const data = await response.json()
        setExceptions(data)
      }
    } catch (error) {
      console.error("Failed to fetch exceptions:", error)
    }
  }

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/availability/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exceptionForm),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Exception added successfully",
        })
        setShowExceptionForm(false)
        setExceptionForm({
          date: "",
          startTime: "",
          endTime: "",
          reason: "",
          isBlocked: true,
        })
        fetchExceptions()
      } else {
        throw new Error("Failed to add exception")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add exception",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Availability Settings</h1>
        <p className="text-muted-foreground">
          Configure your weekly availability and exceptions
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Availability</CardTitle>
            <CardDescription>
              Set your regular weekly schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Manage your weekly availability from the main availability page.
            </p>
            <Button onClick={() => router.push("/availability")}>
              <Settings className="h-4 w-4 mr-2" />
              Go to Availability Page
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Availability Exceptions</CardTitle>
                <CardDescription>
                  Add vacation days, holidays, or other schedule changes
                </CardDescription>
              </div>
              <Button onClick={() => setShowExceptionForm(!showExceptionForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Exception
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showExceptionForm && (
              <form onSubmit={handleAddException} className="mb-6 space-y-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="exceptionDate">Date</Label>
                  <Input
                    id="exceptionDate"
                    type="date"
                    value={exceptionForm.date}
                    onChange={(e) =>
                      setExceptionForm({ ...exceptionForm, date: e.target.value })
                    }
                    required
                    aria-label="Exception date"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exceptionStartTime">Start Time (optional)</Label>
                    <Input
                      id="exceptionStartTime"
                      type="time"
                      value={exceptionForm.startTime}
                      onChange={(e) =>
                        setExceptionForm({ ...exceptionForm, startTime: e.target.value })
                      }
                      aria-label="Exception start time"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exceptionEndTime">End Time (optional)</Label>
                    <Input
                      id="exceptionEndTime"
                      type="time"
                      value={exceptionForm.endTime}
                      onChange={(e) =>
                        setExceptionForm({ ...exceptionForm, endTime: e.target.value })
                      }
                      aria-label="Exception end time"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="exceptionReason">Reason (optional)</Label>
                  <Textarea
                    id="exceptionReason"
                    value={exceptionForm.reason}
                    onChange={(e) =>
                      setExceptionForm({ ...exceptionForm, reason: e.target.value })
                    }
                    placeholder="e.g., Vacation, Holiday"
                    rows={2}
                    aria-label="Exception reason"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Exception</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowExceptionForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {exceptions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No exceptions added yet
              </p>
            ) : (
              <div className="space-y-2">
                {exceptions.map((exception) => (
                  <div
                    key={exception.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {format(new Date(exception.date), "MMMM d, yyyy")}
                      </p>
                      {exception.startTime && exception.endTime && (
                        <p className="text-sm text-muted-foreground">
                          {exception.startTime} - {exception.endTime}
                        </p>
                      )}
                      {exception.reason && (
                        <p className="text-sm text-muted-foreground">{exception.reason}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        exception.isBlocked
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {exception.isBlocked ? "Blocked" : "Available"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

