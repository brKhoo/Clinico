import { requireAdmin } from "@/lib/rbac"
import { redirect } from "next/navigation"
import WebhookManagement from "@/components/admin-webhooks"

export default async function AdminWebhooksPage() {
  const session = await requireAdmin()
  
  if (!session) {
    redirect("/login")
  }

  return <WebhookManagement />
}
