"use client"

import { Activity, Cpu, MemoryStick } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { SystemMonitorData } from "@/types/system-monitor"

type Props = {
  data: SystemMonitorData | null
  loading: boolean
  memoryPercent: number
}

export function SystemSummaryCards({
  data,
  loading,
  memoryPercent,
}: Props) {
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : `${data?.totalCpu ?? 0}%`}
          </div>
          <p className="text-xs text-muted-foreground">
            Penggunaan CPU real-time
          </p>
          <Progress value={data?.totalCpu ?? 0} className="mt-4" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : data?.processes.length ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Proses aktif dengan konsumsi CPU
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          <MemoryStick className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading
              ? "..."
              : `${data?.totalMemoryUsed ?? 0} / ${data?.totalMemory ?? 0} GB`}
          </div>
          <p className="text-xs text-muted-foreground">
            Penggunaan RAM sistem
          </p>
          <Progress value={memoryPercent} className="mt-4" />
        </CardContent>
      </Card>
    </div>
  )
}