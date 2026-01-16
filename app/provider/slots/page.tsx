import { requireProvider } from "@/lib/rbac"
import { redirect } from "next/navigation"
import ProviderAvailableSlots from "@/components/provider-available-slots"

export default async function ProviderSlotsPage() {
  const session = await requireProvider()
  
  if (!session) {
    redirect("/login")
  }

  return <ProviderAvailableSlots />
}
