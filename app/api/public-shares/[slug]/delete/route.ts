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

type RouteContext = {
  params: Promise<{
    slug: string
  }>
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const shares = await getPublicShares()
    const publicShare = shares.find((item) => item.slug === slug && item.enabled)

    if (!publicShare) {
      return NextResponse.json({ error: "Public share tidak ditemukan" }, { status: 404 })
    }

    const body = await request.json()
    const items = Array.isArray(body?.items) ? body.items : []

    if (!items.length) {
      return NextResponse.json({ error: "Tidak ada item yang dipilih" }, { status: 400 })
    }

    for (const item of items) {
      const targetPath = [publicShare.folderPath, item.path]
        .filter(Boolean)
        .join(path.sep)

      const { fullPath } = safeJoinSharePath(publicShare.share, targetPath)

      if (item.type === "folder") {
        await fs.rm(fullPath, { recursive: true, force: true })
      } else {
        await fs.unlink(fullPath).catch(() => {})
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: error?.message || "Gagal menghapus item" },
      { status: 500 }
    )
  }
}