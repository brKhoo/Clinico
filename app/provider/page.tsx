import { requireProvider } from "@/lib/rbac"
import { redirect } from "next/navigation"
import ProviderDashboard from "@/components/provider-dashboard"

export default async function ProviderPage() {
  const session = await requireProvider()
  
  if (!session) {
    redirect("/login")
  }

  return <ProviderDashboard />
}
