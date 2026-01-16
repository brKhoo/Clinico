"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  if (status === "loading" || isLoading || !session) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Availability Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS.map((day, index) => {
              const dayAvailability = availability[index] || {
                dayOfWeek: index,
                startTime: "09:00",
                endTime: "17:00",
                isAvailable: false,
              }

              return (
                <div key={index} className="border rounded p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{day}</h3>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={dayAvailability.isAvailable}
                        onChange={(e) =>
                          handleDayChange(index, "isAvailable", e.target.checked)
                        }
                        className="rounded"
                      />
                      Available
                    </label>
                  </div>

                  {dayAvailability.isAvailable && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Start</Label>
                        <Input
                          type="time"
                          value={dayAvailability.startTime}
                          onChange={(e) =>
                            handleDayChange(index, "startTime", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End</Label>
                        <Input
                          type="time"
                          value={dayAvailability.endTime}
                          onChange={(e) =>
                            handleDayChange(index, "endTime", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => handleSave(index)}
                    disabled={!dayAvailability.isAvailable}
                    size="sm"
                    className="w-full"
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
  )
}
