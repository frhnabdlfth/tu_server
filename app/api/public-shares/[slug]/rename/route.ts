import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import { getPublicShares } from "@/lib/public-shares"

const SMB_HOST = process.env.SMB_HOST

function safeJoinSharePath(share: string, subpath: string) {
  const cleanedShare = share.replace(/[\\/]+/g, "").trim()
  const cleanedSubpath = String(subpath || "")
    .replace(/\.\./g, "")
    .replace(/^[/\\]+/, "")
    .trim()

  const rootPath = `\\\\${SMB_HOST}\\${cleanedShare}`
  const fullPath = cleanedSubpath ? path.join(rootPath, cleanedSubpath) : rootPath

  return { rootPath, fullPath }
}

function sanitizeSegment(value: string) {
  const trimmed = String(value || "").trim()

  if (!trimmed) {
    throw new Error("Nama baru wajib diisi")
  }

  if (
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    trimmed.includes("..")
  ) {
    throw new Error("Nama baru tidak valid")
  }

  return trimmed
}

function normalizeRelativePath(input?: string) {
  if (!input) return ""
  return String(input).replace(/\\/g, "/").replace(/^\/+/, "").trim()
}

type RouteContext = {
  params: Promise<{
    slug: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const currentPath = normalizeRelativePath(body?.currentPath)
    let oldPath = normalizeRelativePath(body?.oldPath)
    const itemName = String(body?.name || "").trim()
    const newName = sanitizeSegment(body?.newName)
    const itemType = body?.type as "file" | "folder" | undefined

    if (!itemType || !["file", "folder"].includes(itemType)) {
      return NextResponse.json(
        { error: "Tipe item tidak valid" },
        { status: 400 }
      )
    }

    if (!oldPath && currentPath && itemName) {
      oldPath = normalizeRelativePath(`${currentPath}/${itemName}`)
    } else if (!oldPath && itemName) {
      oldPath = normalizeRelativePath(itemName)
    }

    if (!oldPath) {
      return NextResponse.json(
        { error: "Path item tidak ditemukan" },
        { status: 400 }
      )
    }

    const baseSubpath = normalizeRelativePath(publicShare.folderPath || "")
    const oldSubpath = [baseSubpath, oldPath].filter(Boolean).join(path.sep)

    const parentRelativeDir = normalizeRelativePath(path.dirname(oldPath))
    const newSubpath = [baseSubpath, parentRelativeDir, newName]
      .filter(Boolean)
      .join(path.sep)

    const { rootPath, fullPath: oldAbsolutePath } = safeJoinSharePath(
      publicShare.share,
      oldSubpath
    )

    const { fullPath: newAbsolutePath } = safeJoinSharePath(
      publicShare.share,
      newSubpath
    )

    console.log("RENAME_DEBUG", {
      slug,
      body,
      share: publicShare.share,
      folderPath: publicShare.folderPath,
      rootPath,
      currentPath,
      oldPath,
      oldSubpath,
      newSubpath,
      oldAbsolutePath,
      newAbsolutePath,
    })

    const oldStat = await fs.stat(oldAbsolutePath).catch(() => null)

    if (!oldStat) {
      return NextResponse.json(
        {
          error: "File atau folder tidak ditemukan",
          debug: {
            share: publicShare.share,
            folderPath: publicShare.folderPath,
            oldPath,
            oldAbsolutePath,
          },
        },
        { status: 404 }
      )
    }

    if (itemType === "file" && !oldStat.isFile()) {
      return NextResponse.json(
        { error: "Item bukan file" },
        { status: 400 }
      )
    }

    if (itemType === "folder" && !oldStat.isDirectory()) {
      return NextResponse.json(
        { error: "Item bukan folder" },
        { status: 400 }
      )
    }

    const targetStat = await fs.stat(newAbsolutePath).catch(() => null)
    if (targetStat) {
      return NextResponse.json(
        { error: "Nama baru sudah digunakan" },
        { status: 409 }
      )
    }

    await fs.rename(oldAbsolutePath, newAbsolutePath)

    return NextResponse.json({
      success: true,
      message: `${itemType === "folder" ? "Folder" : "File"} berhasil di-rename`,
      data: {
        oldPath,
        newPath: normalizeRelativePath(path.join(parentRelativeDir, newName)),
      },
    })
  } catch (error: any) {
    console.error("RENAME_ERROR", error)

    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan saat rename item" },
      { status: 500 }
    )
  }
}