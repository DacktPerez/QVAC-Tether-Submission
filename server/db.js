import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve('./data/local_installed_base.db'));

export default db;