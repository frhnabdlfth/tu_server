import { NextRequest, NextResponse } from "next/server"

const DEMO_EMAIL = "admin@tu.local"
const DEMO_PASSWORD = "admin123"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set("tu_session", "authenticated", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })

    return response
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 }
    )
  }
}