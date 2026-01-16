import { requireAdmin } from "@/lib/rbac"
import { redirect } from "next/navigation"
import ClinicPolicyManagement from "@/components/admin-clinic-policy"

export default async function AdminPolicyPage() {
  const session = await requireAdmin()
  
  if (!session) {
    redirect("/login")
  }

  return <ClinicPolicyManagement />
}
