"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Clock, User, ArrowLeft } from "lucide-react"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"

interface AppointmentType {
  id: string
  name: string
  description?: string
  duration: number
}

interface Provider {
  id: string
  name: string
  email: string
}

export default function BookAppointment() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<"type" | "provider" | "date" | "time">("type")
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAppointmentTypes()
    fetchProviders()
  }, [])

  // Handle URL params after data loads
  useEffect(() => {
    if (appointmentTypes.length === 0 || providers.length === 0) return

    const params = new URLSearchParams(window.location.search)
    const appointmentTypeId = params.get("appointmentTypeId")
    const providerId = params.get("providerId")
    const suggestedDate = params.get("suggestedDate")

    if (appointmentTypeId && !selectedType) {
      const type = appointmentTypes.find((t) => t.id === appointmentTypeId)
      if (type) {
        setSelectedType(type)
        setStep("provider")
      }
    }

    if (providerId && !selectedProvider) {
      const provider = providers.find((p) => p.id === providerId)
      if (provider) {
        setSelectedProvider(provider)
        if (selectedType) setStep("date")
      }
    }

    if (suggestedDate && !selectedDate) {
      setSelectedDate(new Date(suggestedDate))
      if (selectedType && selectedProvider) setStep("time")
    }
  }, [appointmentTypes, providers])

  useEffect(() => {
    if (selectedProvider && selectedDate && selectedType) {
      fetchAvailableSlots()
    }
  }, [selectedProvider, selectedDate, selectedType])

  const fetchAppointmentTypes = async () => {
    try {
      const response = await fetch("/api/appointment-types?activeOnly=true")
      if (response.ok) {
        const data = await response.json()
        setAppointmentTypes(data)
      }
    } catch (error) {
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/providers")
      if (response.ok) {
        const data = await response.json()
        setProviders(data)
      }
    } catch (error) {
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedProvider || !selectedDate || !selectedType) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/availability/slots?providerId=${selectedProvider.id}&date=${selectedDate.toISOString()}&duration=${selectedType.duration}`
      )
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const handleBook = async () => {
    if (!selectedType || !selectedProvider || !selectedDate || !selectedTime) return

    setLoading(true)
    try {
      const startTime = new Date(selectedTime)
      const endTime = new Date(startTime.getTime() + selectedType.duration * 60000)

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedType.name,
          description: selectedType.description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          providerId: selectedProvider.id,
          appointmentTypeId: selectedType.id,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Appointment booked successfully!",
        })
        router.push("/patient")
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to book appointment")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.push("/patient")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Book Appointment</h1>

        {step === "type" && (
          <div className="grid gap-3 md:grid-cols-2">
            {appointmentTypes.map((type) => (
              <Card
                key={type.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => {
                  setSelectedType(type)
                  setStep("provider")
                }}
              >
                <CardContent className="pt-6">
                  <CardTitle className="mb-1">{type.name}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {type.duration} min
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === "provider" && selectedType && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Type: {selectedType.name}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setSelectedProvider(null)
                  setStep("date")
                }}
              >
                <User className="h-4 w-4 mr-2" />
                First Available
              </Button>
              {providers.map((provider) => (
                <Button
                  key={provider.id}
                  variant={selectedProvider?.id === provider.id ? "default" : "outline"}
                  className="h-auto py-4 justify-start"
                  onClick={() => {
                    setSelectedProvider(provider)
                    setStep("date")
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  {provider.name || provider.email}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep("type")}>
              Back
            </Button>
          </div>
        )}

        {step === "date" && selectedType && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedProvider ? selectedProvider.name || selectedProvider.email : "First Available"}
            </p>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <Button
                  key={day.toISOString()}
                  variant={selectedDate && isSameDay(day, selectedDate) ? "default" : "outline"}
                  onClick={() => {
                    setSelectedDate(day)
                    setStep("time")
                  }}
                  className="flex flex-col h-auto py-2"
                >
                  <span className="text-xs">{format(day, "EEE")}</span>
                  <span className="text-base font-semibold">{format(day, "d")}</span>
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep("provider")}>
              Back
            </Button>
          </div>
        )}

        {step === "time" && selectedType && selectedDate && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{format(selectedDate, "EEEE, MMMM d")}</p>
            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading slots...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-3">No available slots</p>
                <Button variant="outline" size="sm" onClick={() => setStep("date")}>
                  Choose Different Date
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-2 md:grid-cols-4">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? "default" : "outline"}
                      onClick={() => setSelectedTime(slot)}
                    >
                      {format(new Date(slot), "h:mm a")}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep("date")}>
                    Back
                  </Button>
                  <Button onClick={handleBook} disabled={!selectedTime || loading} className="flex-1">
                    {loading ? "Booking..." : "Book"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
