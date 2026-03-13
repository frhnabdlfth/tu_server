import { NextRequest, NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const execAsync = promisify(exec);
const SMB_HOST = "100.119.133.84";

type MoveItem = {
  path: string;
  type: "file" | "folder";
  name?: string;
};

type PublicShareRecord = {
  slug: string;
  share: string;
  basePath?: string;
};

function safeJoinSharePath(share: string, subpath: string) {
  const cleanedShare = share.replace(/[\\/]+/g, "").trim();
  const cleanedSubpath = (subpath || "")
    .replace(/\.\./g, "")
    .replace(/^[/\\]+/, "")
    .trim();

  const rootPath = `\\\\${SMB_HOST}\\${cleanedShare}`;
  const fullPath = cleanedSubpath
    ? path.win32.join(rootPath, cleanedSubpath)
    : rootPath;

  return { rootPath, fullPath };
}

function escapePowerShellSingleQuoted(value: string) {
  return value.replace(/'/g, "''");
}

function toPowerShellEncodedCommand(script: string) {
  return Buffer.from(script, "utf16le").toString("base64");
}

async function resolvePublicShare(slug: string) {
  /**
   * MODE 1:
   * kalau slug memang nama share SMB, langsung pakai ini.
   */
  // return { share: slug, basePath: "" };

  /**
   * MODE 2:
   * kalau slug adalah id public share, baca dari file JSON lokal.
   * Simpan file di: /data/public-shares.json
   *
   * isi contoh:
   * [
   *   {
   *     "slug": "33c96c0d3d53",
   *     "share": "SharedFolder",
   *     "basePath": ""
   *   }
   * ]
   */
  try {
    const filePath = path.join(process.cwd(), "data", "public-shares.json");
    const raw = await fs.readFile(filePath, "utf8");
    const records = JSON.parse(raw) as PublicShareRecord[];

    const found = records.find((item) => item.slug === slug);
    if (!found) return null;

    return {
      share: found.share,
      basePath: found.basePath || "",
    };
  } catch (error) {
    console.error("RESOLVE_PUBLIC_SHARE_ERROR", error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();

    const destinationPath = (body.destinationPath || "").trim();
    const items = (body.items || []) as MoveItem[];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Item yang akan dipindahkan wajib diisi" },
        { status: 400 },
      );
    }

    const resolved = await resolvePublicShare(slug);

    if (!resolved) {
      return NextResponse.json(
        { error: "Public share tidak ditemukan" },
        { status: 404 },
      );
    }

    const { share, basePath } = resolved;

    const { rootPath } = safeJoinSharePath(share, "");
    const { fullPath: baseFullPath } = safeJoinSharePath(share, basePath);
    const { fullPath: destinationFolderFullPath } = safeJoinSharePath(
      share,
      path.win32.join(basePath, destinationPath),
    );

    const normalizedRoot = path.win32.normalize(rootPath).toLowerCase();
    const normalizedBase = path.win32.normalize(baseFullPath).toLowerCase();
    const normalizedDestinationFolder = path.win32
      .normalize(destinationFolderFullPath)
      .toLowerCase();

    if (!normalizedDestinationFolder.startsWith(normalizedRoot)) {
      return NextResponse.json(
        { error: "Folder tujuan di luar share tidak diizinkan" },
        { status: 400 },
      );
    }

    if (!normalizedDestinationFolder.startsWith(normalizedBase)) {
      return NextResponse.json(
        { error: "Folder tujuan di luar area public share tidak diizinkan" },
        { status: 400 },
      );
    }

    const moveScripts: string[] = [];

    moveScripts.push(`
$destinationFolder = '${escapePowerShellSingleQuoted(destinationFolderFullPath)}'
if (-not (Test-Path -LiteralPath $destinationFolder)) {
  New-Item -ItemType Directory -Path $destinationFolder -Force | Out-Null
}
`);

    for (const item of items) {
      if (!item?.path) {
        return NextResponse.json(
          { error: "Setiap item wajib memiliki path" },
          { status: 400 },
        );
      }

      const sourceRelativeToShare = path.win32.join(basePath, item.path);
      const { fullPath: sourceFullPath } = safeJoinSharePath(
        share,
        sourceRelativeToShare,
      );

      const sourceBaseName = path.win32.basename(sourceFullPath);
      const finalDestinationFullPath = path.win32.join(
        destinationFolderFullPath,
        sourceBaseName,
      );

      const normalizedSource = path.win32
        .normalize(sourceFullPath)
        .toLowerCase();
      const normalizedDestination = path.win32
        .normalize(finalDestinationFullPath)
        .toLowerCase();

      if (!normalizedSource.startsWith(normalizedRoot)) {
        return NextResponse.json(
          { error: `Path sumber tidak valid: ${item.path}` },
          { status: 400 },
        );
      }

      if (!normalizedSource.startsWith(normalizedBase)) {
        return NextResponse.json(
          {
            error: `Item di luar area public share tidak diizinkan: ${item.path}`,
          },
          { status: 400 },
        );
      }

      if (!normalizedDestination.startsWith(normalizedBase)) {
        return NextResponse.json(
          { error: `Path tujuan tidak valid untuk item: ${item.path}` },
          { status: 400 },
        );
      }

      if (normalizedSource === normalizedDestination) {
        return NextResponse.json(
          {
            error: `Item "${item.name || sourceBaseName}" sudah berada di folder tujuan`,
          },
          { status: 400 },
        );
      }

      if (
        item.type === "folder" &&
        normalizedDestination.startsWith(`${normalizedSource}\\`)
      ) {
        return NextResponse.json(
          {
            error: `Folder "${item.name || sourceBaseName}" tidak bisa dipindahkan ke dalam dirinya sendiri`,
          },
          { status: 400 },
        );
      }

      moveScripts.push(`
$source = '${escapePowerShellSingleQuoted(sourceFullPath)}'
$destination = '${escapePowerShellSingleQuoted(finalDestinationFullPath)}'

if (-not (Test-Path -LiteralPath $source)) {
  throw "Sumber tidak ditemukan: ${escapePowerShellSingleQuoted(item.path)}"
}

Move-Item -LiteralPath $source -Destination $destination -Force
`);
    }

    const script = moveScripts.join("\n");
    const encoded = toPowerShellEncodedCommand(script);

    const { stderr } = await execAsync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { shell: "cmd.exe", maxBuffer: 10 * 1024 * 1024 },
    );

    if (stderr?.trim()) {
      console.error("MOVE_STDERR", stderr);
    }

    return NextResponse.json({
      success: true,
      moved: items.length,
    });
  } catch (error) {
    console.error("MOVE_ROUTE_ERROR", error);
    return NextResponse.json(
      { error: "Gagal memindahkan file/folder" },
      { status: 500 },
    );
  }
}
