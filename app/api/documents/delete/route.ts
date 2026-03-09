import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

const SMB_HOST = "100.119.133.84"

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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { share, path: targetPath, type } = body

    if (!share || !targetPath) {
      return NextResponse.json(
        { error: "Parameter share dan path wajib diisi" },
        { status: 400 }
      )
    }

    const { fullPath } = safeJoinSharePath(share, targetPath)

    if (type === "folder") {
      await fs.rm(fullPath, { recursive: true, force: true })
    } else {
      await fs.unlink(fullPath)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Gagal menghapus file/folder" }, { status: 500 })
  }
}