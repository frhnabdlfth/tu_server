import { NextResponse } from "next/server"
import si from "systeminformation"

function toMbps(bytesPerSecond: number) {
  return Number(((bytesPerSecond * 8) / 1024 / 1024).toFixed(2))
}

export async function GET() {
  try {
    const interfaces = await si.networkInterfaces()
    const activeInterfaces = interfaces.filter(
      (item) =>
        item.operstate === "up" &&
        !item.internal &&
        (item.default || item.ip4 || item.ip6)
    )

    const stats = await si.networkStats()

    const activeStats = stats.filter((stat) =>
      activeInterfaces.some((net) => net.iface === stat.iface)
    )

    const targetStats = activeStats.length > 0 ? activeStats : stats

    const rxSec = targetStats.reduce((sum, item) => sum + (item.rx_sec || 0), 0)
    const txSec = targetStats.reduce((sum, item) => sum + (item.tx_sec || 0), 0)
    const rxBytes = targetStats.reduce((sum, item) => sum + (item.rx_bytes || 0), 0)
    const txBytes = targetStats.reduce((sum, item) => sum + (item.tx_bytes || 0), 0)

    return NextResponse.json({
      interface:
        activeInterfaces[0]?.ifaceName ||
        activeInterfaces[0]?.iface ||
        targetStats[0]?.iface ||
        "Unknown",
      download: toMbps(rxSec),
      upload: toMbps(txSec),
      totalDownloadedMB: Number((rxBytes / 1024 / 1024).toFixed(2)),
      totalUploadedMB: Number((txBytes / 1024 / 1024).toFixed(2)),
    })
  } catch (error) {
    console.error("Failed to get network stats:", error)

    return NextResponse.json(
      { error: "Failed to get real-time network stats" },
      { status: 500 }
    )
  }
}