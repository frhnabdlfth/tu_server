import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { getPublicShares } from "@/lib/public-shares"

const execFileAsync = promisify(execFile)
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

type RouteContext = {
  params: Promise<{
    slug: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const folderPath = request.nextUrl.searchParams.get("path") || ""

    const shares = await getPublicShares()
    const publicShare = shares.find((item) => item.slug === slug && item.enabled)

    if (!publicShare) {
      return NextResponse.json({ error: "Public share tidak ditemukan" }, { status: 404 })
    }

    const targetPath = [publicShare.folderPath, folderPath]
      .filter(Boolean)
      .join(path.sep)

    const { fullPath } = safeJoinSharePath(publicShare.share, targetPath)
    const folderName = path.basename(fullPath) || "folder"

    const tempZipPath = path.join(os.tmpdir(), `${folderName}-${Date.now()}.zip`)

    await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path "${fullPath}\\*" -DestinationPath "${tempZipPath}" -Force`,
    ])

    const fileBuffer = await fs.readFile(tempZipPath)
    await fs.unlink(tempZipPath).catch(() => {})

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${folderName}.zip"`,
      },
    })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: error?.message || "Gagal download folder" },
      { status: 500 }
    )
  }
}