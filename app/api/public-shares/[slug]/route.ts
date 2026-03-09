import { NextRequest, NextResponse } from "next/server"
import { getPublicShares, savePublicShares } from "@/lib/public-shares"

type RouteContext = {
  params: Promise<{
    slug: string
  }>
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const items = await getPublicShares()

    const updated = items.map((item) =>
      item.slug === slug
        ? { ...item, enabled: false }
        : item
    )

    await savePublicShares(updated)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Gagal menonaktifkan public share" },
      { status: 500 }
    )
  }
}