import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Asegurar que la carpeta data exista
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

const db = new Database('./data/local_installed_base.db');
const sql = fs.readFileSync('./schema.sql', 'utf8');

db.exec(sql);
console.log("Base de datos SQLite local inicializada exitosamente.");