"use client"

import { AppShell } from "@/components/app-shell"
import { StudentsView } from "@/components/students/StudentsView"

export default function Page() {
  return (
    <AppShell>
      <StudentsView />
    </AppShell>
  )
}