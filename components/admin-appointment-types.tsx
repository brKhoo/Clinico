"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AppointmentTypeManagement() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Appointment Types</h1>
        <p className="text-muted-foreground">
          Configure appointment types, duration, and pricing
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground mb-4">
            Appointment type management interface coming soon. This will allow you to create, edit, and archive appointment types.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
