import mysql from "mysql2/promise";

export async function getMysqlConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE,
  });
}