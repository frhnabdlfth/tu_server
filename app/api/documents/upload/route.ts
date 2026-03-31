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

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim()
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const share = String(formData.get("share") || "")
    const currentPath = String(formData.get("currentPath") || "")
    const files = formData.getAll("files") as File[]

    if (!share || files.length === 0) {
      return NextResponse.json(
        { error: "Parameter share dan files wajib diisi" },
        { status: 400 }
      )
    }

    const uploadedFiles: string[] = []

    for (const file of files) {
      if (!(file instanceof File)) continue

      const safeName = sanitizeFileName(file.name)

      if (!safeName) {
        continue
      }

      const targetSubpath = currentPath
        ? path.join(currentPath, safeName)
        : safeName

      const { fullPath } = safeJoinSharePath(share, targetSubpath)

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      await fs.writeFile(fullPath, buffer)
      uploadedFiles.push(safeName)
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
    })
  } catch (error: any) {
    console.error(error)

    return NextResponse.json(
      { error: error?.message || "Gagal upload file" },
      { status: 500 }
    )
  }
}