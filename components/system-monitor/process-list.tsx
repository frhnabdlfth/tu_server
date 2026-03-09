"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { ProcessItem } from "@/types/system-monitor"

type Props = {
  processes: ProcessItem[]
  loading: boolean
}

export function ProcessList({ processes, loading }: Props) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Traffic Channels</CardTitle>
        <CardDescription>
          Proses yang sedang menggunakan CPU seperti Task Manager
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && (
          <div className="text-sm text-muted-foreground">
            Memuat data sistem...
          </div>
        )}

        {!loading && processes.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Tidak ada proses dengan penggunaan CPU signifikan.
          </div>
        )}

        {processes.map((process) => (
          <div
            key={`${process.pid}-${process.name}`}
            className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="font-medium truncate">{process.name}</div>
              <div className="text-sm text-muted-foreground">
                PID: {process.pid} • CPU: {process.cpu}% • RAM: {process.memory} MB
              </div>
              {process.path && (
                <div className="truncate text-xs text-muted-foreground">
                  {process.path}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-40">
                <Progress value={Math.min(process.cpu, 100)} />
              </div>
              <Badge
                variant={
                  process.status === "High"
                    ? "destructive"
                    : process.status === "Medium"
                    ? "default"
                    : "secondary"
                }
              >
                {process.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}