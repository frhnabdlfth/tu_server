import { NextRequest, NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const execAsync = promisify(exec);
const SMB_HOST = "100.119.133.84";

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const resolved = await resolvePublicShare(slug);

    console.log("FOLDERS_DEBUG", { slug, resolved });

    if (!resolved) {
      return NextResponse.json(
        { error: "Public share tidak ditemukan" },
        { status: 404 },
      );
    }

    const { share, basePath } = resolved;
    const { fullPath: startPath } = safeJoinSharePath(share, basePath);
    const psRoot = escapePowerShellSingleQuoted(startPath);

    const script = `
$root = '${psRoot}'

if (-not (Test-Path -LiteralPath $root)) {
  throw "Root share tidak ditemukan: $root"
}

$items = Get-ChildItem -LiteralPath $root -Directory -Recurse -Force |
  Sort-Object FullName |
  ForEach-Object {
    $relative = $_.FullName.Substring($root.Length).TrimStart('\\') -replace '\\\\', '/'
    $depth = if ([string]::IsNullOrWhiteSpace($relative)) { 0 } else { ($relative -split '/').Length - 1 }

    [PSCustomObject]@{
      path  = $relative
      name  = $_.Name
      depth = $depth
    }
  }

$items | ConvertTo-Json -Depth 4 -Compress
`;

    const encoded = toPowerShellEncodedCommand(script);

    const { stdout, stderr } = await execAsync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { shell: "cmd.exe", maxBuffer: 10 * 1024 * 1024 },
    );

    if (stderr?.trim()) {
      console.error("FOLDERS_STDERR", stderr);
    }

    let folders: Array<{ path: string; name: string; depth: number }> = [];
    const trimmed = stdout.trim();

    if (trimmed) {
      const parsed = JSON.parse(trimmed);
      folders = Array.isArray(parsed) ? parsed : [parsed];
    }

    return NextResponse.json({
      success: true,
      folders,
    });
  } catch (error) {
    console.error("FOLDERS_ROUTE_ERROR", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar folder" },
      { status: 500 },
    );
  }
}