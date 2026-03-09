"use client"

import { useEffect, useMemo, useState } from "react"
import type { SystemMonitorData } from "@/types/system-monitor"

export function useSystemMonitor() {
  const [data, setData] = useState<SystemMonitorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        const res = await fetch("/api/system", { cache: "no-store" })
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json?.error || "Failed to fetch system data")
        }

        if (mounted) {
          setData(json)
          setLoading(false)
        }
      } catch (error) {
        console.error("Failed to fetch system data:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 2000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const memoryPercent = useMemo(() => {
    if (!data || !data.totalMemory) return 0
    return Number(((data.totalMemoryUsed / data.totalMemory) * 100).toFixed(1))
  }, [data])

  return {
    data,
    loading,
    memoryPercent,
  }
}