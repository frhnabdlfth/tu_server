import si from "systeminformation"

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

function getStatus(cpu: number) {
  if (cpu >= 20) return "High"
  if (cpu >= 5) return "Medium"
  return "Low"
}

export async function getSystemMonitorData(): Promise<SystemMonitorData> {
  const [load, processes, mem] = await Promise.all([
    si.currentLoad(),
    si.processes(),
    si.mem(),
  ])

  const mappedProcesses: ProcessItem[] = processes.list
    .map((proc) => ({
      pid: proc.pid,
      name: proc.name || proc.command || "Unknown Process",
      cpu: Number(proc.cpu?.toFixed(1) || 0),
      memory: Number((((proc.memRss || 0) / 1024 / 1024)).toFixed(1)), // MB
      status: getStatus(proc.cpu || 0),
      path: proc.path,
    }))
    .filter((proc) => proc.cpu > 0.1)
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, 15)

  return {
    totalCpu: Number(load.currentLoad.toFixed(1)),
    processes: mappedProcesses,
    totalMemoryUsed: Number((mem.used / 1024 / 1024 / 1024).toFixed(2)),
    totalMemory: Number((mem.total / 1024 / 1024 / 1024).toFixed(2)),
  }
}