import { NextResponse } from "next/server"
import { exec } from "node:child_process"
import { promisify } from "node:util"

const execAsync = promisify(exec)
const SMB_HOST = process.env.SMB_HOST

type ShareItem = {
  name: string
  remark?: string
}

export async function GET() {
  try {
    const { stdout } = await execAsync(`net view \\\\${SMB_HOST}`)

    const lines = stdout.split("\n").map((line) => line.trim()).filter(Boolean)

    const shares: ShareItem[] = []

    let parsing = false

    for (const line of lines) {
      if (line.includes("-----")) {
        parsing = true
        continue
      }

      if (!parsing) continue
      if (line.toLowerCase().includes("the command completed successfully")) break

      const match = line.match(/^([^\s]+)\s+(Disk|Print|IPC)\s*(.*)$/i)
      if (!match) continue

      const [, name, , remark] = match

      if (name.endsWith("$")) continue

      shares.push({
        name,
        remark: remark?.trim() || undefined,
      })
    }

    return NextResponse.json({
      host: SMB_HOST,
      shares,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Gagal mengambil daftar folder share dari server" },
      { status: 500 }
    )
  }
}