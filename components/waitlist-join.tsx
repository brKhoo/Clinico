"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Clock } from "lucide-react"

interface WaitlistJoinProps {
  appointmentTypeId: string
  providerId?: string
  onJoined: () => void
}

export function WaitlistJoin({ appointmentTypeId, providerId, onJoined }: WaitlistJoinProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentTypeId,
          providerId: providerId || undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "You've been added to the waitlist. We'll notify you when a slot becomes available.",
        })
        onJoined()
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to join waitlist")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join waitlist",
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
          <Clock className="h-5 w-5" />
          Join Waitlist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          No slots are currently available. Join the waitlist and we'll notify you when a slot opens up.
        </p>
        <Button onClick={handleJoin} disabled={loading}>
          {loading ? "Joining..." : "Join Waitlist"}
        </Button>
      </CardContent>
    </Card>
  )
}
