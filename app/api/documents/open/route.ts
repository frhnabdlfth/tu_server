import { NextRequest, NextResponse } from "next/server"
import { exec } from "node:child_process"
import { promisify } from "node:util"
import path from "node:path"

const execAsync = promisify(exec)
const SMB_HOST = process.env.SMB_HOST

function safeJoinSharePath(share: string, subpath: string) {
  const cleanedShare = share.replace(/[\\/]+/g, "").trim()
  const cleanedSubpath = subpath
    .replace(/\.\./g, "")
    .replace(/^[/\\]+/, "")
    .trim()

  const rootPath = `\\\\${SMB_HOST}\\${cleanedShare}`
  const fullPath = cleanedSubpath ? path.join(rootPath, cleanedSubpath) : rootPath

  return { fullPath }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { share, path: filePath } = body

    if (!share || !filePath) {
      return NextResponse.json(
        { error: "Parameter share dan path wajib diisi" },
        { status: 400 }
      )
    }

    const { fullPath } = safeJoinSharePath(share, filePath)

    await execAsync(`start "" "${fullPath}"`, { shell: "cmd.exe" })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Gagal membuka file" }, { status: 500 })
  }
}