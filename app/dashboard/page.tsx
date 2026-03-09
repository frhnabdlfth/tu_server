"use client"

import { AppShell } from "@/components/app-shell"
import DashboardView from "@/components/dashboard/dashboard-view"

export default function Page() {
  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  )
}