"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, AlertCircle, CheckCircle } from "lucide-react"
import { format } from "date-fns"

interface WebhookEvent {
  id: string
  provider: string
  eventType: string
  payload: any
  status: string
  error: string | null
  processedAt: string | null
  createdAt: string
}

export default function WebhookManagement() {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchEvents()
  }, [page])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/webhooks?page=${page}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error("Failed to fetch webhook events:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading webhook events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Webhook Events</h1>
        <p className="text-muted-foreground">
          View and manage webhook events from external services
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No webhook events found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.provider}</span>
                          <span className="text-sm text-muted-foreground">
                            {event.eventType}
                          </span>
                          {event.status === "processed" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : event.status === "failed" ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-yellow-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {format(new Date(event.createdAt), "MMM d, yyyy HH:mm:ss")}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          event.status === "processed"
                            ? "bg-green-100 text-green-800"
                            : event.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                    {event.error && (
                      <div className="mt-2 p-2 bg-red-50 text-red-800 text-sm rounded">
                        Error: {event.error}
                      </div>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-muted-foreground">
                        View payload
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
