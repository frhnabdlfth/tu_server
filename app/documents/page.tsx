"use client"

import { AppShell } from "@/components/app-shell"
import { DocumentsView } from "@/components/documents/documents-view"

export default function Page() {
  return (
    <AppShell>
      <DocumentsView />
    </AppShell>
  )
}