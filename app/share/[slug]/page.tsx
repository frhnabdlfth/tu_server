import { PublicShareView } from "@/components/public-share/public-share-view";
import { getPublicShares } from "@/lib/public-shares";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    path?: string;
  }>;
};

type SharedDocumentItem = {
  name: string;
  path: string;
  absolutePath: string;
  type: "file" | "folder";
  size?: number;
  extension?: string;
  modifiedAt?: string;
};

type SharedDocumentsResponse = {
  host: string;
  share: string;
  rootPath: string;
  currentPath: string;
  items: SharedDocumentItem[];
};

export default async function PublicSharePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { path = "" } = await searchParams;

  const shares = await getPublicShares();
  const publicShare = shares.find((item) => item.slug === slug && item.enabled);

  if (!publicShare) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-2xl border p-6 text-center">
          Link public tidak ditemukan atau sudah dinonaktifkan.
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const effectivePath = path || publicShare.folderPath || "";

  const res = await fetch(
    `${baseUrl}/api/documents?share=${encodeURIComponent(publicShare.share)}&path=${encodeURIComponent(effectivePath)}`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-2xl border p-6 text-center">
          Folder public tidak bisa diakses.
        </div>
      </div>
    );
  }

  const data: SharedDocumentsResponse = await res.json();

  const items = data.items.map((item, index) => {
    const fileUrl = `/api/documents/download?share=${encodeURIComponent(
      publicShare.share,
    )}&path=${encodeURIComponent(item.path)}`;

    return {
      id: `${item.absolutePath}-${index}`,
      name: item.name,
      type: item.type,
      extension: item.extension,
      size: item.size,
      path: item.path,
      modifiedAt: item.modifiedAt
        ? new Date(item.modifiedAt).toLocaleString("id-ID")
        : "-",
      href:
        item.type === "folder"
          ? `/share/${encodeURIComponent(slug)}?path=${encodeURIComponent(item.path)}`
          : fileUrl,
      previewUrl: item.type === "file" ? fileUrl : undefined,
    };
  });

  return (
    <PublicShareView
      slug={slug}
      title={publicShare.title}
      description={
        data.currentPath
          ? `Folder: ${data.currentPath}`
          : "Folder ini dibagikan secara publik dan dapat diunduh melalui link ini."
      }
      ownerName="TU Server"
      currentPath={data.currentPath}
      items={items}
    />
  );
}
