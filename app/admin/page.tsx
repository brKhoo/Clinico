import { requireAdmin } from "@/lib/rbac"
import { redirect } from "next/navigation"
import AdminDashboard from "@/components/admin-dashboard"

export default async function AdminPage() {
  const session = await requireAdmin()
  
  if (!session) {
    redirect("/login")
  }

  return <AdminDashboard />
}
