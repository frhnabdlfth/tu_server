"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Users, Eye } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SiswaItem = {
  id?: number;
  nisn: string;
  nis: string;
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  nik: string;
  no_kk: string;
  anak_ke: string | number;
  status_dalam_keluarga: string;
  nama_ayah: string;
  nik_ayah: string;
  pekerjaan_ayah: string;
  pendidikan_ayah: string;
  nama_ibu: string;
  nik_ibu: string;
  pekerjaan_ibu: string;
  pendidikan_ibu: string;
  alamat: string;
  no_hp: string;
  nama_wali: string;
  pekerjaan_wali: string;
  pendidikan_wali: string;
  sekolah_asal: string;
  alamat_sekolah_asal: string;
  diterima_di_kelas: string;
  diterima_pada_tanggal: string;
  tingkat_kelas: string;
  status: string;
  kelas?: string;
};

type SiswaResponse = {
  data: SiswaItem[];
};

function formatTanggalIndonesia(dateString?: string) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTempatTanggalLahir(tempat?: string, tanggal?: string) {
  const tempatLahir = tempat || "-";
  const tanggalLahir = formatTanggalIndonesia(tanggal);
  return `${tempatLahir}, ${tanggalLahir}`;
}

function formatJenisKelaminShort(value?: string) {
  if (value === "L") return "L";
  if (value === "P") return "P";
  return "-";
}

function formatJenisKelaminFull(value?: string) {
  if (value === "L") return "Laki-Laki";
  if (value === "P") return "Perempuan";
  return value || "-";
}

function getStatusVariant(
  status?: string,
): "default" | "destructive" | "secondary" {
  const normalized = (status || "").toLowerCase();

  if (normalized === "aktif") return "default";
  if (normalized === "nonaktif" || normalized === "non aktif") {
    return "destructive";
  }

  return "secondary";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b py-3 md:grid-cols-[220px_1fr]">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value || "-"}</div>
    </div>
  );
}

export function StudentsView() {
  const [students, setStudents] = useState<SiswaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState<SiswaItem | null>(
    null,
  );

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/students", {
        cache: "no-store",
      });

      const json: SiswaResponse | SiswaItem[] = await res.json();

      if (!res.ok) {
        throw new Error("Gagal mengambil data siswa");
      }

      const result = Array.isArray(json) ? json : json.data || [];
      setStudents(result);
    } catch (error) {
      console.error(error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const filteredStudents = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return students;

    return students.filter((item) =>
      [
        item.nisn,
        item.nis,
        item.nama,
        item.tempat_lahir,
        item.tingkat_kelas,
        item.kelas,
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [students, query]);

  const totalData = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalData / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Users className="size-5" />
              </div>

              <div>
                <CardTitle>Daftar Siswa</CardTitle>
                <CardDescription>
                  Menampilkan data siswa dari database
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama, NISN, NIS, kelas..."
                  className="pl-9"
                />
              </div>

              <Button variant="outline" onClick={fetchStudents}>
                <RefreshCw className="mr-2 size-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="rounded-xl border p-6 text-sm text-muted-foreground">
                Memuat data siswa...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="rounded-xl border p-6 text-sm text-muted-foreground">
                Tidak ada data siswa ditemukan.
              </div>
            ) : (
              <div className="rounded-2xl border bg-background shadow-sm">
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[1200px] w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-semibold">
                          No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          NISN
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          NIS
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Tingkat Kelas
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Nama
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Tempat, Tanggal Lahir
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          L/P
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedStudents.map((item, index) => (
                        <tr
                          key={item.id ?? `${item.nisn}-${index}`}
                          className="border-b transition-colors hover:bg-muted/30"
                        >
                          <td className="px-4 py-3">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-4 py-3">{item.nisn || "-"}</td>
                          <td className="px-4 py-3">{item.nis || "-"}</td>
                          <td className="px-4 py-3">
                            {item.tingkat_kelas || "-"}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {item.nama || "-"}
                          </td>
                          <td className="px-4 py-3">
                            {formatTempatTanggalLahir(
                              item.tempat_lahir,
                              item.tanggal_lahir,
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {formatJenisKelaminShort(item.jenis_kelamin)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getStatusVariant(item.status)}>
                              {item.status || "-"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedStudent(item)}
                            >
                              <Eye className="mr-2 size-4" />
                              Detail
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan{" "}
                    <span className="font-medium text-foreground">
                      {startIndex + 1}
                    </span>
                    {" - "}
                    <span className="font-medium text-foreground">
                      {Math.min(endIndex, totalData)}
                    </span>
                    {" dari "}
                    <span className="font-medium text-foreground">
                      {totalData}
                    </span>{" "}
                    data
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Baris
                      </span>
                      <select
                        value={perPage}
                        onChange={(e) => {
                          setPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Sebelumnya
                      </Button>

                      <div className="text-sm text-muted-foreground">
                        Halaman{" "}
                        <span className="font-medium text-foreground">
                          {currentPage}
                        </span>
                        {" / "}
                        <span className="font-medium text-foreground">
                          {totalPages}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedStudent}
        onOpenChange={(open) => {
          if (!open) setSelectedStudent(null);
        }}
      >
        <DialogContent className="w-[95vw] max-w-[95vw] rounded-2xl p-0 sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="shrink-0 border-b px-6 py-4">
              <DialogTitle>Detail Data Siswa</DialogTitle>
              <DialogDescription>
                Informasi lengkap data siswa
              </DialogDescription>
            </DialogHeader>

            {selectedStudent && (
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="grid gap-3">
                  <DetailRow label="NISN" value={selectedStudent.nisn} />
                  <DetailRow label="NIS" value={selectedStudent.nis} />
                  <DetailRow label="Nama" value={selectedStudent.nama} />
                  <DetailRow
                    label="Tempat, Tanggal Lahir"
                    value={formatTempatTanggalLahir(
                      selectedStudent.tempat_lahir,
                      selectedStudent.tanggal_lahir,
                    )}
                  />
                  <DetailRow
                    label="Jenis Kelamin"
                    value={formatJenisKelaminFull(
                      selectedStudent.jenis_kelamin,
                    )}
                  />
                  <DetailRow label="Agama" value={selectedStudent.agama} />
                  <DetailRow label="NIK" value={selectedStudent.nik} />
                  <DetailRow label="No KK" value={selectedStudent.no_kk} />
                  <DetailRow label="Anak Ke" value={selectedStudent.anak_ke} />
                  <DetailRow
                    label="Status Dalam Keluarga"
                    value={selectedStudent.status_dalam_keluarga}
                  />
                  <DetailRow
                    label="Nama Ayah"
                    value={selectedStudent.nama_ayah}
                  />
                  <DetailRow
                    label="NIK Ayah"
                    value={selectedStudent.nik_ayah}
                  />
                  <DetailRow
                    label="Pekerjaan Ayah"
                    value={selectedStudent.pekerjaan_ayah}
                  />
                  <DetailRow
                    label="Pendidikan Ayah"
                    value={selectedStudent.pendidikan_ayah}
                  />
                  <DetailRow
                    label="Nama Ibu"
                    value={selectedStudent.nama_ibu}
                  />
                  <DetailRow label="NIK Ibu" value={selectedStudent.nik_ibu} />
                  <DetailRow
                    label="Pekerjaan Ibu"
                    value={selectedStudent.pekerjaan_ibu}
                  />
                  <DetailRow
                    label="Pendidikan Ibu"
                    value={selectedStudent.pendidikan_ibu}
                  />
                  <DetailRow label="Alamat" value={selectedStudent.alamat} />
                  <DetailRow label="No HP" value={selectedStudent.no_hp} />
                  <DetailRow
                    label="Nama Wali"
                    value={selectedStudent.nama_wali}
                  />
                  <DetailRow
                    label="Pekerjaan Wali"
                    value={selectedStudent.pekerjaan_wali}
                  />
                  <DetailRow
                    label="Pendidikan Wali"
                    value={selectedStudent.pendidikan_wali}
                  />
                  <DetailRow
                    label="Sekolah Asal"
                    value={selectedStudent.sekolah_asal}
                  />
                  <DetailRow
                    label="Alamat Sekolah Asal"
                    value={selectedStudent.alamat_sekolah_asal}
                  />
                  <DetailRow
                    label="Diterima di Kelas"
                    value={selectedStudent.diterima_di_kelas}
                  />
                  <DetailRow
                    label="Diterima Pada Tanggal"
                    value={formatTanggalIndonesia(
                      selectedStudent.diterima_pada_tanggal,
                    )}
                  />
                  <DetailRow
                    label="Tingkat Kelas"
                    value={selectedStudent.tingkat_kelas}
                  />
                  <DetailRow
                    label="Kelas"
                    value={selectedStudent.kelas || "-"}
                  />
                  <DetailRow label="Status" value={selectedStudent.status} />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
