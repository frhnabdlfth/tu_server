"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Globe, Copy } from "lucide-react";
import {
  FileText,
  Folder,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  ChevronRight,
  ChevronLeft,
  Download,
  Pencil,
  Trash2,
  ExternalLink,
  Save,
  X,
  FolderPlus,
  CheckSquare,
  Square,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type ShareItem = {
  name: string;
  remark?: string;
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

type SharesResponse = {
  host: string;
  shares: ShareItem[];
};

type SharedDocumentsResponse = {
  host: string;
  share: string;
  rootPath: string;
  currentPath: string;
  items: SharedDocumentItem[];
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

function getFileIcon(item: SharedDocumentItem) {
  if (item.type === "folder") return Folder;

  const ext = item.extension?.toLowerCase();

  if (["xlsx", "xls", "csv"].includes(ext || "")) return FileSpreadsheet;
  if (["png", "jpg", "jpeg", "webp", "svg"].includes(ext || ""))
    return FileImage;
  if (["zip", "rar", "7z"].includes(ext || "")) return FileArchive;

  return FileText;
}

function isTextFile(extension?: string) {
  return ["txt", "md", "json", "csv", "log"].includes(
    (extension || "").toLowerCase(),
  );
}

export function DocumentsView() {
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [selectedShare, setSelectedShare] = useState("");
  const [data, setData] = useState<SharedDocumentsResponse | null>(null);
  const [loadingShares, setLoadingShares] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [query, setQuery] = useState("");
  const [editingFile, setEditingFile] = useState<SharedDocumentItem | null>(
    null,
  );
  const [editorContent, setEditorContent] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [deleteSingleOpen, setDeleteSingleOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SharedDocumentItem | null>(
    null,
  );

  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [publicShareOpen, setPublicShareOpen] = useState(false);
  const [publicShareLoading, setPublicShareLoading] = useState(false);
  const [publicShareUrl, setPublicShareUrl] = useState("");
  const [publicShareTitle, setPublicShareTitle] = useState("");

  const fetchShares = async () => {
    try {
      setLoadingShares(true);
      const res = await fetch("/api/shares", { cache: "no-store" });
      const json: SharesResponse = await res.json();

      if (!res.ok) throw new Error("Failed to fetch shares");
      setShares(json.shares);
    } catch (error) {
      console.error(error);
      setShares([]);
    } finally {
      setLoadingShares(false);
    }
  };

  const fetchDocuments = async (share: string, subpath = "") => {
    try {
      setLoadingDocuments(true);

      const params = new URLSearchParams({
        share,
        path: subpath,
      });

      const res = await fetch(`/api/documents?${params.toString()}`, {
        cache: "no-store",
      });

      const json: SharedDocumentsResponse = await res.json();

      if (!res.ok) throw new Error("Failed to fetch documents");
      setData(json);
      setSelectedItems([]);
    } catch (error) {
      console.error(error);
      setData(null);
      setSelectedItems([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  useEffect(() => {
    if (selectedShare) {
      fetchDocuments(selectedShare, "");
    } else {
      setData(null);
      setSelectedItems([]);
    }
  }, [selectedShare]);

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    const keyword = query.trim().toLowerCase();

    if (!keyword) return items;

    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.path.toLowerCase().includes(keyword) ||
        (item.extension || "").toLowerCase().includes(keyword)
      );
    });
  }, [data, query]);

  const allFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedItems.includes(item.absolutePath));

  const toggleSelectItem = (absolutePath: string) => {
    setSelectedItems((prev) =>
      prev.includes(absolutePath)
        ? prev.filter((item) => item !== absolutePath)
        : [...prev, absolutePath],
    );
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedItems((prev) =>
        prev.filter(
          (selected) =>
            !filteredItems.some((item) => item.absolutePath === selected),
        ),
      );
      return;
    }

    const filteredPaths = filteredItems.map((item) => item.absolutePath);

    setSelectedItems((prev) =>
      Array.from(new Set([...prev, ...filteredPaths])),
    );
  };

  const goToFolder = (folderPath: string) => {
    if (!selectedShare) return;
    fetchDocuments(selectedShare, folderPath);
  };

  const goBack = () => {
    if (!selectedShare || !data?.currentPath) return;

    const parts = data.currentPath.split(/[\\/]/).filter(Boolean);
    parts.pop();
    const parentPath = parts.join("\\");

    fetchDocuments(selectedShare, parentPath);
  };

  const handleDownload = (item: SharedDocumentItem) => {
    window.open(
      `/api/documents/download?share=${encodeURIComponent(
        selectedShare,
      )}&path=${encodeURIComponent(item.path)}`,
      "_blank",
    );
  };

  const handleOpen = async (item: SharedDocumentItem) => {
    await fetch("/api/documents/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        share: selectedShare,
        path: item.path,
      }),
    });
  };

  const handleEdit = async (item: SharedDocumentItem) => {
    const res = await fetch(
      `/api/documents/edit?share=${encodeURIComponent(
        selectedShare,
      )}&path=${encodeURIComponent(item.path)}`,
    );
    const json = await res.json();

    if (!res.ok) {
      alert("Gagal membuka file untuk diedit");
      return;
    }

    setEditingFile(item);
    setEditorContent(json.content || "");
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;

    const res = await fetch("/api/documents/edit", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        share: selectedShare,
        path: editingFile.path,
        content: editorContent,
      }),
    });

    if (!res.ok) {
      alert("Gagal menyimpan file");
      return;
    }

    setEditingFile(null);
    setEditorContent("");
    fetchDocuments(selectedShare, data?.currentPath || "");
  };

  const openDeleteSingleDialog = (item: SharedDocumentItem) => {
    setItemToDelete(item);
    setDeleteSingleOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    const res = await fetch("/api/documents/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        share: selectedShare,
        path: itemToDelete.path,
        type: itemToDelete.type,
      }),
    });

    if (!res.ok) {
      alert("Gagal menghapus item");
      return;
    }

    setDeleteSingleOpen(false);
    setItemToDelete(null);
    fetchDocuments(selectedShare, data?.currentPath || "");
  };

  const handleDeleteSelected = async () => {
    const itemsToDelete = filteredItems.filter((item) =>
      selectedItems.includes(item.absolutePath),
    );

    if (itemsToDelete.length === 0) {
      alert("Belum ada item yang dipilih");
      return;
    }

    const results = await Promise.all(
      itemsToDelete.map((item) =>
        fetch("/api/documents/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            share: selectedShare,
            path: item.path,
            type: item.type,
          }),
        }),
      ),
    );

    const hasFailed = results.some((res) => !res.ok);

    if (hasFailed) {
      alert("Sebagian item gagal dihapus");
    }

    setDeleteSelectedOpen(false);
    fetchDocuments(selectedShare, data?.currentPath || "");
  };

  const handleCreateFolder = async () => {
    if (!selectedShare) return;

    const folderName = newFolderName.trim();

    if (!folderName) {
      alert("Nama folder wajib diisi");
      return;
    }

    const res = await fetch("/api/documents/create-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        share: selectedShare,
        currentPath: data?.currentPath || "",
        folderName,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      alert(json?.error || "Gagal membuat folder");
      return;
    }

    setCreateFolderOpen(false);
    setNewFolderName("");
    fetchDocuments(selectedShare, data?.currentPath || "");
  };

  const handleUploadFile = async () => {
    if (!selectedShare) return;

    if (selectedFiles.length === 0) {
      alert("Pilih file terlebih dahulu");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("share", selectedShare);
      formData.append("currentPath", data?.currentPath || "");

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        alert(json?.error || "Gagal upload file");
        return;
      }

      setUploadOpen(false);
      setSelectedFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchDocuments(selectedShare, data?.currentPath || "");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePublicShare = async () => {
    if (!selectedShare) return;

    try {
      setPublicShareLoading(true);

      const res = await fetch("/api/public-shares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          share: selectedShare,
          folderPath: data?.currentPath || "",
          title:
            publicShareTitle.trim() ||
            `${selectedShare}${data?.currentPath ? ` - ${data.currentPath}` : ""}`,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error || "Gagal membuat public share");
        return;
      }

      const baseUrl = window.location.origin;

      setPublicShareUrl(`${baseUrl}/share/${json.slug}`);
    } catch (error) {
      console.error(error);
      alert("Gagal membuat public share");
    } finally {
      setPublicShareLoading(false);
    }
  };

  const handleCopyPublicLink = async () => {
    if (!publicShareUrl) return;
    await navigator.clipboard.writeText(publicShareUrl);
    alert("Link public berhasil disalin");
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col gap-4">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Pilih share folder dari PC lokal/server lalu buka isinya
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <select
              value={selectedShare}
              onChange={(e) => setSelectedShare(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Pilih shared folder</option>
              {shares.map((share) => (
                <option key={share.name} value={share.name}>
                  {share.name}
                </option>
              ))}
            </select>

            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari file atau folder..."
                className="pl-9"
              />
            </div>

            <Button variant="outline" onClick={fetchShares}>
              <RefreshCw className="mr-2 size-4" />
              Refresh Share
            </Button>

            <Button
              variant="outline"
              onClick={() => setUploadOpen(true)}
              disabled={!selectedShare}
            >
              <Upload className="mr-2 size-4" />
              Upload File
            </Button>

            <Button
              variant="outline"
              onClick={() => setCreateFolderOpen(true)}
              disabled={!selectedShare}
            >
              <FolderPlus className="mr-2 size-4" />
              Tambah Folder
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setPublicShareTitle(
                  `${selectedShare}${data?.currentPath ? ` - ${data.currentPath}` : ""}`,
                );
                setPublicShareUrl("");
                setPublicShareOpen(true);
              }}
              disabled={!selectedShare}
            >
              <Globe className="mr-2 size-4" />
              Izinkan Public
            </Button>

            <Button
              variant="destructive"
              onClick={() => setDeleteSelectedOpen(true)}
              disabled={selectedItems.length === 0}
            >
              <Trash2 className="mr-2 size-4" />
              Hapus Terpilih
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {selectedShare && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goBack}
                disabled={!data?.currentPath}
              >
                <ChevronLeft className="mr-2 size-4" />
                Kembali
              </Button>

              <Button
                variant="outline"
                size="sm"
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

              <div className="text-sm text-muted-foreground">
                {selectedItems.length} item dipilih
              </div>
            </div>
          )}

          {loadingDocuments && (
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">
              Memuat isi folder...
            </div>
          )}

          {!loadingDocuments && filteredItems.length > 0 && (
            <div className="grid gap-3">
              {filteredItems.map((item) => {
                const Icon = getFileIcon(item);
                const isSelected = selectedItems.includes(item.absolutePath);

                return (
                  <div
                    key={item.absolutePath}
                    className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50 ${
                      isSelected ? "ring-2 ring-primary/30" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.absolutePath)}
                        className="mt-1 h-4 w-4"
                      />

                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="size-5 text-foreground" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{item.name}</div>
                        <div className="truncate text-sm text-muted-foreground">
                          {item.path}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          item.type === "folder" ? "secondary" : "outline"
                        }
                      >
                        {item.type}
                      </Badge>

                      {item.extension && (
                        <Badge variant="outline">
                          {item.extension.toUpperCase()}
                        </Badge>
                      )}

                      <Badge variant="outline">{formatBytes(item.size)}</Badge>

                      {item.type === "folder" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => goToFolder(item.path)}
                        >
                          Buka
                          <ChevronRight className="ml-2 size-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(item)}
                          >
                            <Download className="mr-2 size-4" />
                            Download
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpen(item)}
                          >
                            <ExternalLink className="mr-2 size-4" />
                            Buka
                          </Button>

                          {isTextFile(item.extension) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteSingleDialog(item)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Hapus
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {editingFile && (
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Edit File</CardTitle>
                  <CardDescription>{editingFile.name}</CardDescription>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingFile(null);
                      setEditorContent("");
                    }}
                  >
                    <X className="mr-2 size-4" />
                    Batal
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    <Save className="mr-2 size-4" />
                    Simpan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="min-h-[400px] font-mono"
                />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload file ke folder yang sedang dibuka.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih File</label>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) =>
                setSelectedFiles(Array.from(e.target.files || []))
              }
            />
            {selectedFiles.length > 0 && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{selectedFiles.length} file dipilih:</p>
                <ul className="list-disc pl-5">
                  {selectedFiles.map((file) => (
                    <li key={`${file.name}-${file.size}`}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadOpen(false);
                setSelectedFiles([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={uploading}
            >
              Batal
            </Button>
            <Button
              onClick={handleUploadFile}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? "Mengupload..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Folder</DialogTitle>
            <DialogDescription>
              Buat folder baru di lokasi yang sedang dibuka.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Folder</label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Contoh: Laporan 2026"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateFolderOpen(false);
                setNewFolderName("");
              }}
            >
              Batal
            </Button>
            <Button onClick={handleCreateFolder}>Buat Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteSingleOpen} onOpenChange={setDeleteSingleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete
                ? `Item "${itemToDelete.name}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
                : "Item akan dihapus permanen."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteSingleOpen(false);
                setItemToDelete(null);
              }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteSelectedOpen}
        onOpenChange={setDeleteSelectedOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItems.length} item yang dipilih akan dihapus permanen.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteSelectedOpen(false)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={publicShareOpen} onOpenChange={setPublicShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Izinkan Akses Public</DialogTitle>
            <DialogDescription>
              Folder yang sedang dibuka akan bisa diakses publik melalui link
              khusus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Judul Public Share</label>
              <Input
                value={publicShareTitle}
                onChange={(e) => setPublicShareTitle(e.target.value)}
                placeholder="Contoh: Dokumen Kelas 6A"
              />
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Share: {selectedShare || "-"}</div>
              <div>Folder: {data?.currentPath || "/"}</div>
            </div>

            {publicShareUrl && (
              <div className="space-y-2 rounded-xl border p-3">
                <div className="text-sm font-medium">Link Public</div>
                <div className="break-all text-sm text-muted-foreground">
                  {publicShareUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPublicLink}
                >
                  <Copy className="mr-2 size-4" />
                  Copy Link
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPublicShareOpen(false);
                setPublicShareUrl("");
              }}
            >
              Tutup
            </Button>
            <Button
              onClick={handleCreatePublicShare}
              disabled={publicShareLoading}
            >
              {publicShareLoading ? "Memproses..." : "Buat Link Public"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
