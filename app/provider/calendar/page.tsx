import { requireProvider } from "@/lib/rbac"
import { redirect } from "next/navigation"
import ProviderCalendar from "@/components/provider-calendar"

export default async function ProviderCalendarPage() {
  const session = await requireProvider()
  
  if (!session) {
    redirect("/login")
  }

  return <ProviderCalendar />
}
