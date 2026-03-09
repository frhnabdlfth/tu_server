"use client"

import { useEffect, useState } from "react"
import type { InternetSpeedData } from "@/types/internet-speed"

export function useInternetSpeed() {
  const [data, setData] = useState<InternetSpeedData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchSpeed = async () => {
      try {
        const res = await fetch("/api/internet-speed", {
          cache: "no-store",
        })

        const json = await res.json()

        if (!res.ok) {
          throw new Error(json?.error || "Failed to fetch internet speed")
        }

        if (mounted) {
          setData(json)
          setLoading(false)
        }
      } catch (error) {
        console.error("Failed to fetch internet speed:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchSpeed()
    const interval = setInterval(fetchSpeed, 2000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return {
    data,
    loading,
  }
}