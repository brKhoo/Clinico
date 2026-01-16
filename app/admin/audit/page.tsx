import { requireAdmin } from "@/lib/rbac"
import { redirect } from "next/navigation"
import AuditLogPage from "@/components/admin-audit-log"

export default async function AdminAuditPage() {
  const session = await requireAdmin()
  
  if (!session) {
    redirect("/login")
  }

  return <AuditLogPage />
}
