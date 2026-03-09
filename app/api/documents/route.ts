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

  return {
    rootPath,
    fullPath,
  }
}

export async function GET(request: NextRequest) {
  try {
    const share = request.nextUrl.searchParams.get("share")
    const subpath = request.nextUrl.searchParams.get("path") || ""

    if (!share) {
      return NextResponse.json(
        { error: "Parameter share wajib diisi" },
        { status: 400 }
      )
    }

    const { rootPath, fullPath } = safeJoinSharePath(share, subpath)

    const entries = await fs.readdir(fullPath, { withFileTypes: true })

    const items = await Promise.all(
      entries.map(async (entry) => {
        const itemPath = path.join(fullPath, entry.name)
        const stats = await fs.stat(itemPath)

        const relativePath = subpath
          ? path.join(subpath, entry.name)
          : entry.name

        return {
          name: entry.name,
          path: relativePath,
          absolutePath: itemPath,
          type: entry.isDirectory() ? "folder" : "file",
          size: entry.isDirectory() ? 0 : stats.size,
          extension: entry.isDirectory()
            ? undefined
            : path.extname(entry.name).replace(".", ""),
          modifiedAt: stats.mtime.toISOString(),
        }
      })
    )

    return NextResponse.json({
      host: SMB_HOST,
      share,
      rootPath,
      currentPath: subpath,
      items: items.sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1
        return a.name.localeCompare(b.name)
      }),
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Gagal membaca isi folder share" },
      { status: 500 }
    )
  }
}