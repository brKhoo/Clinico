import { requireProvider } from "@/lib/rbac"
import { redirect } from "next/navigation"
import ProviderAvailability from "@/components/provider-availability"

export default async function ProviderAvailabilityPage() {
  const session = await requireProvider()
  
  if (!session) {
    redirect("/login")
  }

  return <ProviderAvailability />
}
