"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart, TrendingUp, Users, Calendar, Download } from "lucide-react"

interface Stats {
  totalUsers: number
  totalProviders: number
  totalPatients: number
  totalAppointments: number
  todayAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  completedAppointments: number
  cancellationRate: number
  noShowRate: number
  providerUtilization: Array<{
    providerId: string
    providerName: string
    bookedMinutes: number
    availableMinutes: number
    utilization: number
  }>
  dailyBookings: Array<{ date: string; count: number }>
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    providerId: "",
  })

  useEffect(() => {
    fetchStats()
  }, [filters])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        )
      )

      const response = await fetch(`/api/admin/stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!stats) return

    const csv = [
      ["Metric", "Value"],
      ["Total Users", stats.totalUsers],
      ["Total Providers", stats.totalProviders],
      ["Total Patients", stats.totalPatients],
      ["Total Appointments", stats.totalAppointments],
      ["Today's Appointments", stats.todayAppointments],
      ["Cancelled Appointments", stats.cancelledAppointments],
      ["No-Show Appointments", stats.noShowAppointments],
      ["Cancellation Rate", `${stats.cancellationRate}%`],
      ["No-Show Rate", `${stats.noShowRate}%`],
      [],
      ["Provider Utilization"],
      ...stats.providerUtilization.map((p) => [
        p.providerName,
        `${p.utilization}%`,
      ]),
    ]

    const csvContent = csv.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            View system metrics and performance
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ startDate: "", endDate: "", providerId: "" })
                }
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Total Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalAppointments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cancellation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.cancellationRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.cancelledAppointments} cancelled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              No-Show Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.noShowRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.noShowAppointments} no-shows
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.providerUtilization.length === 0 ? (
            <p className="text-muted-foreground">No provider data available</p>
          ) : (
            <div className="space-y-4">
              {stats.providerUtilization.map((provider) => (
                <div key={provider.providerId}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{provider.providerName}</span>
                    <span className="text-sm text-muted-foreground">
                      {provider.utilization}% utilized
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.min(provider.utilization, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {provider.bookedMinutes} min booked / {provider.availableMinutes} min
                    available
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
