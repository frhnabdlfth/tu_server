import { NextRequest, NextResponse } from "next/server"
import {
  generatePublicSlug,
  getPublicShares,
  savePublicShares,
} from "@/lib/public-shares"

export async function GET() {
  try {
    const items = await getPublicShares()
    return NextResponse.json(items)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Gagal mengambil public shares" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { share, folderPath = "", title } = body

    if (!share) {
      return NextResponse.json(
        { error: "Share wajib diisi" },
        { status: 400 }
      )
    }

    const items = await getPublicShares()

    const existing = items.find(
      (item) =>
        item.share === share &&
        item.folderPath === folderPath &&
        item.enabled === true
    )

    if (existing) {
      return NextResponse.json(existing)
    }

    const newItem = {
      slug: generatePublicSlug(),
      share,
      folderPath,
      title:
        title?.trim() ||
        (folderPath
          ? `${share} - ${folderPath}`
          : `${share}`),
      createdAt: new Date().toISOString(),
      enabled: true,
    }

    items.push(newItem)
    await savePublicShares(items)

    return NextResponse.json(newItem)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Gagal membuat public share" },
      { status: 500 }
    )
  }
}