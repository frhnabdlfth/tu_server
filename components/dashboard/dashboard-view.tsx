"use client"

import { ProcessList } from "@/components/system-monitor/process-list"
import { SystemSummaryCards } from "@/components/system-monitor/system-summary-cards"
import { useSystemMonitor } from "@/hooks/use-system-monitor"

export default function DashboardView() {
  const { data, loading, memoryPercent } = useSystemMonitor()

  return (
    <>
      <SystemSummaryCards
        data={data}
        loading={loading}
        memoryPercent={memoryPercent}
      />

      <ProcessList
        processes={data?.processes ?? []}
        loading={loading}
      />
    </>
  )
}