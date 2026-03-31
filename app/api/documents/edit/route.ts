import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

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

export async function GET(request: NextRequest) {
  try {
    const share = request.nextUrl.searchParams.get("share")
    const filePath = request.nextUrl.searchParams.get("path")

    if (!share || !filePath) {
      return NextResponse.json(
        { error: "Parameter share dan path wajib diisi" },
        { status: 400 }
      )
    }

    const { fullPath } = safeJoinSharePath(share, filePath)
    const content = await fs.readFile(fullPath, "utf-8")

    return NextResponse.json({ content })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Gagal membaca file" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { share, path: filePath, content } = body

    if (!share || !filePath) {
      return NextResponse.json(
        { error: "Parameter share dan path wajib diisi" },
        { status: 400 }
      )
    }

    const { fullPath } = safeJoinSharePath(share, filePath)
    await fs.writeFile(fullPath, content ?? "", "utf-8")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Gagal menyimpan file" }, { status: 500 })
  }
}