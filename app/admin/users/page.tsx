import { requireAdmin } from "@/lib/rbac"
import { redirect } from "next/navigation"
import UserManagement from "@/components/admin-user-management"

export default async function AdminUsersPage() {
  const session = await requireAdmin()
  
  if (!session) {
    redirect("/login")
  }

  return <UserManagement />
}
