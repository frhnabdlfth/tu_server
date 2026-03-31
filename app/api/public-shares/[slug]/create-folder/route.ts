import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import { getPublicShares } from "@/lib/public-shares"

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

function sanitizeSegment(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim()
}

type RouteContext = {
  params: Promise<{
    slug: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const shares = await getPublicShares()
    const publicShare = shares.find((item) => item.slug === slug && item.enabled)

    if (!publicShare) {
      return NextResponse.json(
        { error: "Public share tidak ditemukan" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const currentPath = String(body?.currentPath || "")
    const folderName = sanitizeSegment(String(body?.folderName || ""))

    if (!folderName) {
      return NextResponse.json(
        { error: "Nama folder wajib diisi" },
        { status: 400 }
      )
    }

    const targetPath = [publicShare.folderPath, currentPath, folderName]
      .filter(Boolean)
      .join(path.sep)

    const { fullPath } = safeJoinSharePath(publicShare.share, targetPath)

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