"use client"

import { ProcessList } from "@/components/system-monitor/process-list"
import { SystemSummaryCards } from "@/components/system-monitor/system-summary-cards"
import { InternetStatsCards } from "@/components/internet/internet-stats-cards"
import { useSystemMonitor } from "@/hooks/use-system-monitor"
import { useInternetSpeed } from "@/hooks/use-internet-speed"

export default function DashboardView() {
  const { data, loading, memoryPercent } = useSystemMonitor()
  const {
    data: internetData,
    loading: internetLoading,
  } = useInternetSpeed()

  return (
    <>
      <SystemSummaryCards
        data={data}
        loading={loading}
        memoryPercent={memoryPercent}
      />

      <InternetStatsCards
        data={internetData}
        loading={internetLoading}
      />

      <ProcessList
        processes={data?.processes ?? []}
        loading={loading}
      />
    </>
  )
}