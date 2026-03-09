"use client"

import { ArrowDownToLine, ArrowUpFromLine, Wifi, Cable } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { InternetSpeedData } from "@/types/internet-speed"

type Props = {
  data: InternetSpeedData | null
  loading: boolean
}

export function InternetStatsCards({ data, loading }: Props) {
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-4">
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Download</CardTitle>
          <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : `${data?.download ?? 0} Mbps`}
          </div>
          <p className="text-xs text-muted-foreground">
            Trafik masuk real-time
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upload</CardTitle>
          <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : `${data?.upload ?? 0} Mbps`}
          </div>
          <p className="text-xs text-muted-foreground">
            Trafik keluar real-time
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Downloaded</CardTitle>
          <Wifi className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : `${data?.totalDownloadedMB ?? 0} MB`}
          </div>
          <p className="text-xs text-muted-foreground">
            Total data masuk
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interface</CardTitle>
          <Cable className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="truncate text-2xl font-bold">
            {loading ? "..." : data?.interface ?? "-"}
          </div>
          <p className="text-xs text-muted-foreground">
            Adapter aktif
          </p>
        </CardContent>
      </Card>
    </div>
  )
}