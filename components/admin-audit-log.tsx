"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Search, Filter } from "lucide-react"
import { format } from "date-fns"

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string | null
  metadata: any
  createdAt: string
  actor: {
    id: string
    name: string | null
    email: string
    role: string
  }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    action: "",
    entityType: "",
    actorUserId: "",
  })

  useEffect(() => {
    fetchLogs()
  }, [page, filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        ),
      })

      const response = await fetch(`/api/admin/audit?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      action: "",
      entityType: "",
      actorUserId: "",
    })
    setPage(1)
  }

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Audit Log</h1>
        <p className="text-muted-foreground">
          View system activity and changes
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                placeholder="Filter by action"
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="entityType">Entity Type</Label>
              <Input
                id="entityType"
                placeholder="Filter by entity"
                value={filters.entityType}
                onChange={(e) => handleFilterChange("entityType", e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Actor</th>
                      <th className="text-left p-2">Action</th>
                      <th className="text-left p-2">Entity</th>
                      <th className="text-left p-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="p-2 text-sm">
                          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">
                              {log.actor.name || log.actor.email}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.actor.role}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="px-2 py-1 text-xs rounded bg-muted">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-2 text-sm">
                          {log.entityType}
                          {log.entityId && (
                            <span className="text-muted-foreground ml-1">
                              ({log.entityId.slice(0, 8)}...)
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {log.metadata && (
                            <details>
                              <summary className="cursor-pointer">View</summary>
                              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
