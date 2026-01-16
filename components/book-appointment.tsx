"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, User, ArrowLeft } from "lucide-react"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { WaitlistJoin } from "@/components/waitlist-join"

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
      console.error("Failed to fetch appointment types:", error)
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
      console.error("Failed to fetch providers:", error)
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
      console.error("Failed to fetch slots:", error)
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

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Book Appointment</h1>
          <p className="text-muted-foreground">
            {step === "type" && "Select an appointment type"}
            {step === "provider" && "Choose a provider"}
            {step === "date" && "Select a date"}
            {step === "time" && "Choose a time slot"}
          </p>
        </div>

        {/* Step 1: Appointment Type */}
        {step === "type" && (
          <div className="grid gap-4 md:grid-cols-2">
            {appointmentTypes.map((type) => (
              <Card
                key={type.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => {
                  setSelectedType(type)
                  setStep("provider")
                }}
              >
                <CardHeader>
                  <CardTitle>{type.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {type.description && <p className="text-sm text-muted-foreground mb-2">{type.description}</p>}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {type.duration} min
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 2: Provider */}
        {step === "provider" && selectedType && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Selected: {selectedType.name}</CardTitle>
              </CardHeader>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => {
                  setSelectedProvider(null)
                  setStep("date")
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    First Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Book with the first available provider
                  </p>
                </CardContent>
              </Card>
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className={`cursor-pointer hover:bg-accent transition-colors ${
                    selectedProvider?.id === provider.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => {
                    setSelectedProvider(provider)
                    setStep("date")
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {provider.name || provider.email}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Button variant="outline" onClick={() => setStep("type")}>
              Back
            </Button>
          </div>
        )}

        {/* Step 3: Date */}
        {step === "date" && selectedType && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedType.name} with{" "}
                  {selectedProvider ? selectedProvider.name || selectedProvider.email : "First Available"}
                </CardTitle>
              </CardHeader>
            </Card>
            <div className="grid grid-cols-7 gap-2" role="grid" aria-label="Select appointment date">
              {weekDays.map((day) => (
                <Button
                  key={day.toISOString()}
                  variant={selectedDate && isSameDay(day, selectedDate) ? "default" : "outline"}
                  onClick={() => {
                    setSelectedDate(day)
                    setStep("time")
                  }}
                  className="flex flex-col h-auto py-3"
                  aria-label={`Select ${format(day, "EEEE, MMMM d")}`}
                  aria-pressed={selectedDate && isSameDay(day, selectedDate)}
                >
                  <span className="text-xs">{format(day, "EEE")}</span>
                  <span className="text-lg font-semibold">{format(day, "d")}</span>
                </Button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setStep("provider")}>
              Back
            </Button>
          </div>
        )}

        {/* Step 4: Time */}
        {step === "time" && selectedType && selectedDate && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {format(selectedDate, "EEEE, MMMM d")} - {selectedType.name}
                </CardTitle>
              </CardHeader>
            </Card>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading available slots...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">No available slots for this date</p>
                    <Button variant="outline" onClick={() => setStep("date")}>
                      Choose Different Date
                    </Button>
                  </CardContent>
                </Card>
                {selectedType && (
                  <WaitlistJoin
                    appointmentTypeId={selectedType.id}
                    providerId={selectedProvider?.id}
                    onJoined={() => router.push("/patient")}
                  />
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-2 md:grid-cols-4" role="group" aria-label="Available time slots">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? "default" : "outline"}
                      onClick={() => setSelectedTime(slot)}
                      aria-label={`Select time ${format(new Date(slot), "h:mm a")}`}
                      aria-pressed={selectedTime === slot}
                    >
                      {format(new Date(slot), "h:mm a")}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("date")}>
                    Back
                  </Button>
                  <Button
                    onClick={handleBook}
                    disabled={!selectedTime || loading}
                    className="flex-1"
                  >
                    {loading ? "Booking..." : "Book Appointment"}
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
