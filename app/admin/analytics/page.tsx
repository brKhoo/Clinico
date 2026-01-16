import { requireAdmin } from "@/lib/rbac"
import { redirect } from "next/navigation"
import AdminAnalytics from "@/components/admin-analytics"

export default async function AdminAnalyticsPage() {
  const session = await requireAdmin()
  
  if (!session) {
    redirect("/login")
  }

  return <AdminAnalytics />
}
