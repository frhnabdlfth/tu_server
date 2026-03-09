export type ProcessItem = {
  pid: number
  name: string
  cpu: number
  memory: number
  status: string
  path?: string
}

export type SystemMonitorData = {
  totalCpu: number
  processes: ProcessItem[]
  totalMemoryUsed: number
  totalMemory: number
}