"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

export default function AvailabilityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [availability, setAvailability] = useState<Record<number, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchAvailability()
    }
  }, [status])

  const fetchAvailability = async () => {
    try {
      const response = await fetch("/api/availability")
      if (response.ok) {
        const data = await response.json()
        const availabilityMap: Record<number, any> = {}
        data.forEach((item: any) => {
          availabilityMap[item.dayOfWeek] = item
        })
        setAvailability(availabilityMap)
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (dayOfWeek: number) => {
    const dayAvailability = availability[dayOfWeek]
    if (!dayAvailability) return

    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek,
          startTime: dayAvailability.startTime,
          endTime: dayAvailability.endTime,
          isAvailable: dayAvailability.isAvailable,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${DAYS[dayOfWeek]} availability updated`,
        })
        fetchAvailability()
      } else {
        throw new Error("Failed to update availability")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      })
    }
  }

  const handleDayChange = (dayOfWeek: number, field: string, value: string | boolean) => {
    setAvailability((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        dayOfWeek,
        [field]: value,
      },
    }))
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Clinico Scheduler</h1>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
              <CardDescription>
                Set your available hours for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {DAYS.map((day, index) => {
                  const dayAvailability = availability[index] || {
                    dayOfWeek: index,
                    startTime: "09:00",
                    endTime: "17:00",
                    isAvailable: false,
                  }

                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{day}</h3>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={dayAvailability.isAvailable}
                            onChange={(e) =>
                              handleDayChange(index, "isAvailable", e.target.checked)
                            }
                            className="rounded"
                          />
                          <span className="text-sm">Available</span>
                        </label>
                      </div>

                      {dayAvailability.isAvailable && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              value={dayAvailability.startTime}
                              onChange={(e) =>
                                handleDayChange(index, "startTime", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              value={dayAvailability.endTime}
                              onChange={(e) =>
                                handleDayChange(index, "endTime", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => handleSave(index)}
                        disabled={!dayAvailability.isAvailable}
                        size="sm"
                      >
                        Save {day}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
