"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Folder,
  Search,
  Download,
  Grid3X3,
  List,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  Clock3,
  HardDrive,
  Share2,
  Upload,
  Trash2,
  CheckSquare,
  Square,
  ChevronRight,
  House,
  FolderPlus,
  Loader2,
  Pencil,
  FolderInput,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type PublicFileItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  extension?: string;
  size?: number;
  modifiedAt?: string;
  href?: string;
  previewUrl?: string;
  path?: string;
};

type PublicShareViewProps = {
  slug: string;
  title: string;
  description?: string;
  ownerName?: string;
  currentPath?: string;
  items: PublicFileItem[];
};

type FolderOption = {
  path: string;
  name: string;
  depth: number;
};

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function isImageFile(extension?: string) {
  return ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(
    (extension || "").toLowerCase(),
  );
}

function isVideoFile(extension?: string) {
  return ["mp4", "webm", "ogg", "mov", "m4v"].includes(
    (extension || "").toLowerCase(),
  );
}

function getFileIcon(item: PublicFileItem) {
  if (item.type === "folder") return Folder;

  const ext = item.extension?.toLowerCase();

  if (["xlsx", "xls", "csv"].includes(ext || "")) return FileSpreadsheet;
  if (["png", "jpg", "jpeg", "webp", "svg"].includes(ext || "")) {
    return FileImage;
  }
  if (["zip", "rar", "7z"].includes(ext || "")) return FileArchive;

  return FileText;
}

function FileThumbnail({ item }: { item: PublicFileItem }) {
  if (item.type === "folder") {
    return (
      <div className="flex h-24 w-full items-center justify-center rounded-2xl bg-muted">
        <Folder className="size-10 text-muted-foreground" />
      </div>
    );
  }

  if (isImageFile(item.extension) && item.previewUrl) {
    return (
      <div className="overflow-hidden rounded-2xl bg-muted">
        <img
          src={item.previewUrl}
          alt={item.name}
          className="h-24 w-full object-cover"
        />
      </div>
    );
  }

  if (isVideoFile(item.extension) && item.previewUrl) {
    return (
      <div className="overflow-hidden rounded-2xl bg-muted">
        <video
          src={item.previewUrl}
          className="h-24 w-full object-cover"
          muted
          preload="metadata"
        />
      </div>
    );
  }

  const Icon = getFileIcon(item);

  return (
    <div className="flex h-24 w-full items-center justify-center rounded-2xl bg-muted">
      <Icon className="size-10 text-muted-foreground" />
    </div>
  );
}

export function PublicShareView({
  slug,
  title,
  description,
  ownerName,
  currentPath = "",
  items,
}: PublicShareViewProps) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("Menyiapkan upload...");
  const [uploadTargetName, setUploadTargetName] = useState("");
  const [uploadLoadedBytes, setUploadLoadedBytes] = useState(0);
  const [uploadTotalBytes, setUploadTotalBytes] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<PublicFileItem | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameItem, setRenameItem] = useState<PublicFileItem | null>(null);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveValue, setMoveValue] = useState("");
  const [moving, setMoving] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<FolderOption[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(keyword) ||
        (item.extension || "").toLowerCase().includes(keyword)
      );
    });
  }, [items, query]);

  const selectedTargets = useMemo(() => {
    return items.filter((item) => selectedItems.includes(item.id));
  }, [items, selectedItems]);

  const breadcrumbItems = useMemo(() => {
    const parts = currentPath.split(/[\\/]/).filter(Boolean);

    return parts.map((part, index) => {
      const path = parts.slice(0, index + 1).join("\\");
      return {
        label: part,
        href: `/share/${encodeURIComponent(slug)}?path=${encodeURIComponent(path)}`,
      };
    });
  }, [currentPath, slug]);

  const allFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedItems.includes(item.id));

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedItems((prev) =>
        prev.filter((id) => !filteredItems.some((item) => item.id === id)),
      );
      return;
    }

    const ids = filteredItems.map((item) => item.id);
    setSelectedItems((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleUploadFiles = async (
    files: FileList | null,
    isFolderUpload = false,
  ) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const totalSelectedSize = fileArray.reduce(
      (sum, file) => sum + file.size,
      0,
    );

    try {
      setUploading(true);
      setUploadDialogOpen(true);
      setUploadProgress(0);
      setUploadLoadedBytes(0);
      setUploadTotalBytes(totalSelectedSize);
      setUploadTargetName(
        isFolderUpload
          ? (
              fileArray[0] as File & { webkitRelativePath?: string }
            ).webkitRelativePath?.split("/")[0] || "Folder"
          : fileArray.length === 1
            ? fileArray[0].name
            : `${fileArray.length} file`,
      );
      setUploadStatus("Mengunggah...");

      const formData = new FormData();
      formData.append("currentPath", currentPath);

      fileArray.forEach((file) => {
        formData.append("files", file);

        const relativePath =
          isFolderUpload &&
          (file as File & { webkitRelativePath?: string }).webkitRelativePath
            ? (file as File & { webkitRelativePath?: string }).webkitRelativePath!
            : file.name;

        formData.append("relativePaths", relativePath);
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("POST", `/api/public-shares/${slug}/upload`);

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;

          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
          setUploadLoadedBytes(event.loaded);
          setUploadTotalBytes(event.total);
          setUploadStatus(`Mengunggah... ${percent}%`);
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            setUploadLoadedBytes(uploadTotalBytes || totalSelectedSize);
            setUploadStatus("Upload selesai");
            resolve();
            return;
          }

          try {
            const json = JSON.parse(xhr.responseText);
            reject(new Error(json?.error || "Gagal upload"));
          } catch {
            reject(new Error("Gagal upload"));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Terjadi kesalahan jaringan saat upload"));
        };

        xhr.send(formData);
      });

      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch (error: any) {
      console.error(error);
      setUploadStatus(error?.message || "Terjadi kesalahan saat upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
    }
  };

  const handleDeleteSelected = async () => {
    const targets = items
      .filter((item) => selectedItems.includes(item.id))
      .map((item) => ({
        path: item.path || "",
        type: item.type,
      }));

    if (targets.length === 0) {
      toast.error("Belum ada item yang dipilih");
      return;
    }

    const res = await fetch(`/api/public-shares/${slug}/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPath,
        items: targets,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(json?.error || "Gagal menghapus item");
      return;
    }

    setDeleteOpen(false);
    setSelectedItems([]);
    window.location.reload();
  };

  const handleCreateFolder = async () => {
    const folderName = newFolderName.trim();

    if (!folderName) {
      toast.error("Nama folder wajib diisi");
      return;
    }

    try {
      setCreatingFolder(true);

      const res = await fetch(`/api/public-shares/${slug}/create-folder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPath,
          folderName,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error || "Gagal membuat folder");
        return;
      }

      setCreateFolderOpen(false);
      setNewFolderName("");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat membuat folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const canPreviewFile = (item: PublicFileItem) => {
    return (
      item.type === "file" &&
      (isImageFile(item.extension) || isVideoFile(item.extension))
    );
  };

  const handleOpenPreview = (item: PublicFileItem) => {
    if (!canPreviewFile(item)) {
      if (item.href) {
        window.open(item.href, "_blank", "noopener,noreferrer");
      }
      return;
    }

    setPreviewItem(item);
    setPreviewOpen(true);
  };

  const handleOpenRename = (item: PublicFileItem) => {
    setRenameItem(item);
    setRenameValue(item.name);
    setRenameOpen(true);
  };

  const handleRenameItem = async () => {
    const newName = renameValue.trim();

    if (!renameItem) {
      toast.error("Item tidak ditemukan");
      return;
    }

    if (!newName) {
      toast.error("Nama baru wajib diisi");
      return;
    }

    if (newName === renameItem.name) {
      setRenameOpen(false);
      return;
    }

    const normalizedCurrentPath = currentPath
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "");

    const oldPath =
      renameItem.path && renameItem.path.trim()
        ? renameItem.path.replace(/\\/g, "/").replace(/^\/+/, "")
        : normalizedCurrentPath
          ? `${normalizedCurrentPath}/${renameItem.name}`
          : renameItem.name;

    try {
      setRenaming(true);

      const res = await fetch(`/api/public-shares/${slug}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPath,
          oldPath,
          newName,
          type: renameItem.type,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error || "Gagal rename item");
        return;
      }

      setRenameOpen(false);
      setRenameItem(null);
      setRenameValue("");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat rename item");
    } finally {
      setRenaming(false);
    }
  };

  const openMoveDialog = () => {
    if (selectedTargets.length === 0) {
      toast.error("Pilih item yang ingin dipindahkan terlebih dahulu");
      return;
    }

    setMoveValue("");
    setMoveOpen(true);
  };

  useEffect(() => {
    if (moveOpen) {
      fetchAvailableFolders();
    } else {
      setAvailableFolders([]);
      setMoveValue("");
    }
  }, [moveOpen]);

  const fetchAvailableFolders = async () => {
    try {
      setLoadingFolders(true);

      const res = await fetch(`/api/public-shares/${slug}/folders`, {
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error || "Gagal memuat daftar folder");
        return;
      }

      setAvailableFolders(json?.folders || []);
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat memuat daftar folder");
    } finally {
      setLoadingFolders(false);
    }
  };

  const selectableFolders = useMemo(() => {
    const selectedFolderPaths = selectedTargets
      .filter((item) => item.type === "folder")
      .map((item) =>
        (item.path || item.name).replace(/\\/g, "/").replace(/^\/+/, ""),
      );

    return availableFolders.filter((folder) => {
      const target = folder.path.replace(/\\/g, "/").replace(/^\/+/, "");

      for (const folderPath of selectedFolderPaths) {
        if (!target) continue;
        if (target === folderPath) return false;
        if (target.startsWith(`${folderPath}/`)) return false;
      }

      return true;
    });
  }, [availableFolders, selectedTargets]);

  const handleMoveSelected = async () => {
    if (selectedTargets.length === 0) {
      toast.error("Belum ada item yang dipilih");
      return;
    }

    try {
      setMoving(true);

      const payloadItems = selectedTargets.map((item) => ({
        name: item.name,
        type: item.type,
        path:
          item.path && item.path.trim()
            ? item.path.replace(/\\/g, "/").replace(/^\/+/, "")
            : item.name,
      }));

      const res = await fetch(`/api/public-shares/${slug}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destinationPath: moveValue.trim(),
          items: payloadItems,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.error || "Gagal memindahkan item");
        return;
      }

      setMoveOpen(false);
      setMoveValue("");
      setAvailableFolders([]);
      setSelectedItems([]);
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat memindahkan item");
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border bg-card/70 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Share2 className="size-4" />
              <span>Public Share</span>
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {ownerName && <Badge variant="secondary">By {ownerName}</Badge>}
              <Badge variant="outline">{items.length} items</Badge>
              <Badge variant="outline">Path: {currentPath || "/"}</Badge>
              <Badge variant="outline">{selectedItems.length} dipilih</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:w-[560px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari file atau folder..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="mr-2 size-4" />
                Grid
              </Button>

              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="mr-2 size-4" />
                List
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-2 size-4" />
                Upload File
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => folderInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-2 size-4" />
                Upload Folder
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateFolderOpen(true)}
              >
                <FolderPlus className="mr-2 size-4" />
                Tambah Folder
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={openMoveDialog}
                disabled={selectedItems.length === 0}
              >
                <FolderInput className="mr-2 size-4" />
                Pindah
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={selectedItems.length === 0}
              >
                <Trash2 className="mr-2 size-4" />
                Hapus
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={toggleSelectAllFiltered}
                disabled={filteredItems.length === 0}
              >
                {allFilteredSelected ? (
                  <CheckSquare className="mr-2 size-4" />
                ) : (
                  <Square className="mr-2 size-4" />
                )}
                {allFilteredSelected ? "Batal Pilih Semua" : "Pilih Semua"}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleUploadFiles(e.target.files, false)}
            />

            <input
              ref={folderInputRef}
              type="file"
              multiple
              className="hidden"
              // @ts-expect-error non-standard browser attribute
              webkitdirectory=""
              // @ts-expect-error non-standard browser attribute
              directory=""
              onChange={(e) => handleUploadFiles(e.target.files, true)}
            />
          </div>
        </header>

        <nav className="flex flex-wrap items-center gap-1 rounded-2xl border bg-card px-4 py-3 text-sm">
          <Link
            href={`/share/${encodeURIComponent(slug)}`}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <House className="size-4" />
            <span>Root</span>
          </Link>

          {breadcrumbItems.map((item) => (
            <div key={item.href} className="flex items-center gap-1">
              <ChevronRight className="size-4 text-muted-foreground" />
              <Link
                href={item.href}
                className="rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            </div>
          ))}
        </nav>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-3xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-muted p-3">
                <Folder className="size-5" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Folders</div>
                <div className="text-2xl font-semibold">
                  {items.filter((item) => item.type === "folder").length}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-muted p-3">
                <FileText className="size-5" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Files</div>
                <div className="text-2xl font-semibold">
                  {items.filter((item) => item.type === "file").length}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-muted p-3">
                <HardDrive className="size-5" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Size</div>
                <div className="text-2xl font-semibold">
                  {formatBytes(
                    items.reduce((sum, item) => sum + (item.size || 0), 0),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {filteredItems.length === 0 && (
          <Card className="rounded-3xl">
            <CardContent className="p-10 text-center text-muted-foreground">
              Tidak ada file atau folder yang cocok.
            </CardContent>
          </Card>
        )}

        {viewMode === "grid" && filteredItems.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.includes(item.id);

              return (
                <Card
                  key={item.id}
                  className={`rounded-3xl border transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                    isSelected ? "ring-2 ring-primary/30" : ""
                  }`}
                >
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-1 items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.id)}
                          className="mt-1 h-4 w-4"
                        />

                        <div className="flex-1">
                          <FileThumbnail item={item} />
                        </div>
                      </div>

                      <Badge
                        variant={
                          item.type === "folder" ? "secondary" : "outline"
                        }
                      >
                        {item.type}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="line-clamp-2 text-base font-medium">
                        {item.name}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HardDrive className="size-3.5" />
                          {formatBytes(item.size)}
                        </span>

                        {item.modifiedAt && (
                          <span className="flex items-center gap-1">
                            <Clock3 className="size-3.5" />
                            {item.modifiedAt}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-2 pt-2">
                      {item.type === "folder" ? (
                        <>
                          <Button
                            asChild
                            variant="outline"
                            className="flex-1 rounded-2xl"
                          >
                            <Link href={item.href || "#"}>Buka Folder</Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => handleOpenRename(item)}
                          >
                            <Pencil className="size-4" />
                          </Button>

                          <Button asChild className="flex-1 rounded-2xl">
                            <a
                              href={`/api/public-shares/${encodeURIComponent(slug)}/download-folder?path=${encodeURIComponent(item.path || "")}`}
                            >
                              <Download className="mr-2 size-4" />
                              Unduh
                            </a>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            className="flex-1 rounded-2xl"
                            onClick={() => handleOpenPreview(item)}
                          >
                            Buka
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => handleOpenRename(item)}
                          >
                            <Pencil className="size-4" />
                          </Button>

                          <Button asChild size="sm" className="rounded-xl">
                            <a href={item.href || "#"} download>
                              <Download className="mr-2 size-4" />
                              Unduh
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}

        {viewMode === "list" && filteredItems.length > 0 && (
          <section className="overflow-hidden rounded-3xl border bg-card">
            <div className="grid grid-cols-12 gap-3 border-b px-5 py-3 text-sm text-muted-foreground">
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-3 text-right">Action</div>
            </div>

            {filteredItems.map((item) => {
              const Icon = getFileIcon(item);
              const isSelected = selectedItems.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-12 items-center gap-3 border-b px-5 py-4 last:border-b-0 hover:bg-muted/40 ${
                    isSelected ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      className="h-4 w-4"
                    />
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {isImageFile(item.extension) && item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : isVideoFile(item.extension) && item.previewUrl ? (
                        <video
                          src={item.previewUrl}
                          className="h-full w-full object-cover"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Icon className="size-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{item.name}</div>
                      {item.modifiedAt && (
                        <div className="text-xs text-muted-foreground">
                          {item.modifiedAt}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Badge
                      variant={item.type === "folder" ? "secondary" : "outline"}
                    >
                      {item.type}
                    </Badge>
                  </div>

                  <div className="col-span-2 text-sm text-muted-foreground">
                    {formatBytes(item.size)}
                  </div>

                  <div className="col-span-3 flex justify-end gap-2">
                    {item.type === "folder" ? (
                      <>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                        >
                          <Link href={item.href || "#"}>Buka</Link>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => handleOpenRename(item)}
                        >
                          <Pencil className="mr-2 size-4" />
                          Rename
                        </Button>

                        <Button asChild size="sm" className="rounded-xl">
                          <a
                            href={`/api/public-shares/${encodeURIComponent(slug)}/download-folder?path=${encodeURIComponent(item.path || "")}`}
                          >
                            <Download className="mr-2 size-4" />
                            Unduh
                          </a>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => handleOpenRename(item)}
                        >
                          <Pencil className="mr-2 size-4" />
                          Rename
                        </Button>

                        <Button asChild size="sm" className="rounded-xl">
                          <a href={item.href || "#"} download>
                            <Download className="mr-2 size-4" />
                            Unduh
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>

      <Dialog open={uploadDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              Upload Sedang Berjalan
            </DialogTitle>
            <DialogDescription>
              {uploadTargetName || "Sedang menyiapkan upload"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Progress value={uploadProgress} className="w-full" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{uploadStatus}</span>
              <span className="font-medium">{uploadProgress}%</span>
            </div>

            <div className="text-xs text-muted-foreground">
              {formatBytes(uploadLoadedBytes)} / {formatBytes(uploadTotalBytes)}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Folder</DialogTitle>
            <DialogDescription>
              Buat folder baru di lokasi public share yang sedang dibuka.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Folder</label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Contoh: Dokumen Baru"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateFolderOpen(false);
                setNewFolderName("");
              }}
              disabled={creatingFolder}
            >
              Batal
            </Button>
            <Button onClick={handleCreateFolder} disabled={creatingFolder}>
              {creatingFolder ? "Membuat..." : "Buat Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Rename {renameItem?.type === "folder" ? "Folder" : "File"}
            </DialogTitle>
            <DialogDescription>
              Ubah nama {renameItem?.type === "folder" ? "folder" : "file"} yang
              dipilih.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Baru</label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Masukkan nama baru"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameOpen(false);
                setRenameItem(null);
                setRenameValue("");
              }}
              disabled={renaming}
            >
              Batal
            </Button>
            <Button onClick={handleRenameItem} disabled={renaming}>
              {renaming ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItems.length} item akan dihapus permanen dari folder
              public ini.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="min-w-0">
              <div className="truncate font-medium">
                {previewItem?.name || "Preview"}
              </div>
              <div className="text-xs text-muted-foreground">
                {previewItem?.extension?.toUpperCase() || ""}
              </div>
            </div>
          </div>

          <div className="flex max-h-[75vh] min-h-[300px] items-center justify-center bg-black/5 p-4">
            {previewItem &&
              isImageFile(previewItem.extension) &&
              previewItem.previewUrl && (
                <img
                  src={previewItem.previewUrl}
                  alt={previewItem.name}
                  className="max-h-[70vh] max-w-full rounded-lg object-contain"
                />
              )}

            {previewItem &&
              isVideoFile(previewItem.extension) &&
              previewItem.previewUrl && (
                <video
                  src={previewItem.previewUrl}
                  controls
                  autoPlay
                  className="max-h-[70vh] max-w-full rounded-lg"
                />
              )}

            {previewItem &&
              !isImageFile(previewItem.extension) &&
              !isVideoFile(previewItem.extension) && (
                <div className="text-sm text-muted-foreground">
                  Preview tidak tersedia untuk file ini.
                </div>
              )}
          </div>

          <div className="flex justify-end gap-2 border-t px-4 py-3">
            {previewItem?.href && (
              <Button asChild>
                <a href={previewItem.href} download>
                  <Download className="mr-2 size-4" />
                  Unduh
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pindah Item Terpilih</DialogTitle>
            <DialogDescription>
              Pindahkan beberapa file/folder sekaligus ke folder tujuan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2 rounded-xl border p-3">
              <div className="text-sm font-medium">
                {selectedTargets.length} item dipilih
              </div>
              <div className="max-h-28 space-y-1 overflow-auto text-sm text-muted-foreground">
                {selectedTargets.map((item) => (
                  <div key={item.id}>
                    • {item.name} ({item.type})
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Folder Tujuan</label>
              <Input
                value={moveValue}
                onChange={(e) => setMoveValue(e.target.value)}
                placeholder="Klik folder di bawah atau kosongkan untuk root"
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk memindahkan ke root share/public share.
              </p>
            </div>

            <div className="rounded-xl border">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <div className="text-sm font-medium">Daftar Folder</div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={fetchAvailableFolders}
                  disabled={loadingFolders}
                >
                  {loadingFolders ? "Memuat..." : "Refresh"}
                </Button>
              </div>

              <div className="max-h-80 overflow-auto p-2">
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted ${
                    moveValue === "" ? "bg-muted" : ""
                  }`}
                  onClick={() => setMoveValue("")}
                >
                  <Folder className="size-4" />
                  <span>/</span>
                </button>

                {loadingFolders && (
                  <div className="px-3 py-4 text-sm text-muted-foreground">
                    Memuat folder...
                  </div>
                )}

                {!loadingFolders && selectableFolders.length === 0 && (
                  <div className="px-3 py-4 text-sm text-muted-foreground">
                    Tidak ada folder lain yang tersedia.
                  </div>
                )}

                {!loadingFolders &&
                  selectableFolders.map((folder) => (
                    <button
                      key={folder.path || "__root__"}
                      type="button"
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted ${
                        moveValue === folder.path ? "bg-muted" : ""
                      }`}
                      onClick={() => setMoveValue(folder.path)}
                      style={{ paddingLeft: `${12 + folder.depth * 20}px` }}
                    >
                      <Folder className="size-4 shrink-0" />
                      <span className="truncate">{folder.path || "/"}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMoveOpen(false);
                setMoveValue("");
                setAvailableFolders([]);
              }}
              disabled={moving}
            >
              Batal
            </Button>
            <Button onClick={handleMoveSelected} disabled={moving}>
              {moving ? "Memindahkan..." : "Pindah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}