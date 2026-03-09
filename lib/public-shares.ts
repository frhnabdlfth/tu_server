import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"

export type PublicShareItem = {
  slug: string
  share: string
  folderPath: string
  title: string
  createdAt: string
  enabled: boolean
}

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "public-shares.json")

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })

  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8")
  }
}

export async function getPublicShares(): Promise<PublicShareItem[]> {
  await ensureDataFile()
  const raw = await fs.readFile(DATA_FILE, "utf-8")
  return JSON.parse(raw) as PublicShareItem[]
}

export async function savePublicShares(items: PublicShareItem[]) {
  await ensureDataFile()
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf-8")
}

export function generatePublicSlug() {
  return crypto.randomBytes(6).toString("hex")
}