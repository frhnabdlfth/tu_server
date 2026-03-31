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
  return value.replace(/[<>:"|?*\x00-\x1F]/g, "_").trim()
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
      return NextResponse.json({ error: "Public share tidak ditemukan" }, { status: 404 })
    }

    const formData = await request.formData()
    const currentPath = String(formData.get("currentPath") || "")
    const files = formData.getAll("files") as File[]
    const relativePaths = formData.getAll("relativePaths").map(String)

    if (!files.length) {
      return NextResponse.json({ error: "Tidak ada file yang diupload" }, { status: 400 })
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const originalRelativePath = relativePaths[i] || file.name

      const safeRelativePath = originalRelativePath
        .split(/[\\/]/)
        .map(sanitizeSegment)
        .filter(Boolean)
        .join(path.sep)

      const combinedPath = [publicShare.folderPath, currentPath, safeRelativePath]
        .filter(Boolean)
        .join(path.sep)

      const { fullPath } = safeJoinSharePath(publicShare.share, combinedPath)

      await fs.mkdir(path.dirname(fullPath), { recursive: true })

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      await fs.writeFile(fullPath, buffer)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: error?.message || "Gagal upload file/folder" },
      { status: 500 }
    )
  }
}