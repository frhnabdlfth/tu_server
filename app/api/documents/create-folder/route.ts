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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { share, currentPath = "", folderName } = body

    if (!share || !folderName) {
      return NextResponse.json(
        { error: "Parameter share dan folderName wajib diisi" },
        { status: 400 }
      )
    }

    const safeFolderName = String(folderName)
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .trim()

    if (!safeFolderName) {
      return NextResponse.json(
        { error: "Nama folder tidak valid" },
        { status: 400 }
      )
    }

    const targetSubpath = currentPath
      ? path.join(currentPath, safeFolderName)
      : safeFolderName

    const { fullPath } = safeJoinSharePath(share, targetSubpath)

    await fs.mkdir(fullPath, { recursive: false })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(error)

    return NextResponse.json(
      { error: error?.message || "Gagal membuat folder" },
      { status: 500 }
    )
  }
}