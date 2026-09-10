import { existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const databasePath = './data/local_installed_base.db';
if (existsSync(databasePath)) rmSync(databasePath);

const seed = spawnSync(process.execPath, ['seed.js'], { stdio: 'inherit' });
process.exit(seed.status ?? 1);
