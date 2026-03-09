import { NextResponse } from "next/server"
import { getSystemMonitorData } from "@/lib/system-monitor"

export async function GET() {
  try {
    const data = await getSystemMonitorData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to get system monitor data:", error)
    return NextResponse.json(
      { error: "Failed to get system monitor data" },
      { status: 500 }
    )
  }
}