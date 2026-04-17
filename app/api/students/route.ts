import { NextResponse } from "next/server";
import { getMysqlConnection } from "@/lib/mysql";

export async function GET() {
  let connection: Awaited<ReturnType<typeof getMysqlConnection>> | null = null;

  try {
    connection = await getMysqlConnection();

    const [rows] = await connection.execute(`
      SELECT
        nisn,
        nis,
        nama,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        agama,
        nik,
        no_kk,
        anak_ke,
        status_dalam_keluarga,
        nama_ayah,
        nik_ayah,
        pekerjaan_ayah,
        pendidikan_ayah,
        nama_ibu,
        nik_ibu,
        pekerjaan_ibu,
        pendidikan_ibu,
        alamat,
        no_hp,
        nama_wali,
        pekerjaan_wali,
        pendidikan_wali,
        sekolah_asal,
        alamat_sekolah_asal,
        diterima_di_kelas,
        diterima_pada_tanggal,
        tingkat_kelas,
        status
      FROM siswas
      ORDER BY nama ASC
    `);

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("GET /api/students error:", error);

    return NextResponse.json(
      {
        error: "Gagal mengambil data siswa",
        detail: error?.message || null,
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}