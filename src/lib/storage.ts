import "server-only";
import path from "path";
import { promises as fs } from "fs";
import { config } from "./config";
import { prisma } from "./db";

async function dirSize(dir: string): Promise<number> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  let total = 0;
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await dirSize(full);
    } else if (entry.isFile()) {
      total += (await fs.stat(full)).size;
    }
  }
  return total;
}

async function fileSize(filePath: string): Promise<number> {
  try {
    return (await fs.stat(filePath)).size;
  } catch {
    return 0;
  }
}

// DATABASE_URL is a SQLite connection string, e.g.
// "file:/data/db/app.db?connection_limit=1" (prod, absolute) or
// "file:./data/db/app.db" (dev, relative). Prisma resolves a relative path
// against the schema.prisma file's directory rather than the process cwd —
// match that so this finds the same file the app is actually using. An
// absolute `raw` short-circuits path.resolve regardless of the base, so
// this is a no-op in prod.
function databaseFilePath(): string | null {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith("file:")) return null;
  const raw = url.slice("file:".length).split("?")[0];
  return path.resolve(process.cwd(), "prisma", raw);
}

// WAL mode (see src/lib/db.ts) keeps recently-written pages in sidecar
// files until they're checkpointed back into the main one; count those too
// so the number reflects actual disk usage.
async function databaseSize(): Promise<number> {
  const dbPath = databaseFilePath();
  if (!dbPath) return 0;
  const [main, wal, shm] = await Promise.all([
    fileSize(dbPath),
    fileSize(`${dbPath}-wal`),
    fileSize(`${dbPath}-shm`)
  ]);
  return main + wal + shm;
}

export interface EventStorage {
  id: string;
  titleEn: string;
  titleZh: string;
  photoCount: number;
  bytes: number;
}

export interface StorageStats {
  photosBytes: number;
  siteImagesBytes: number;
  databaseBytes: number;
  totalBytes: number;
  events: EventStorage[];
}

/**
 * Walks the photos directory (per event) and the site-images directory on
 * disk, plus the SQLite file(s), to report actual space used. There's no
 * cheaper source of truth for this — nothing in the DB tracks file sizes.
 */
export async function getStorageStats(): Promise<StorageStats> {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      titleEn: true,
      titleZh: true,
      _count: { select: { photos: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  const events_ = await Promise.all(
    events.map(async (e): Promise<EventStorage> => ({
      id: e.id,
      titleEn: e.titleEn,
      titleZh: e.titleZh,
      photoCount: e._count.photos,
      bytes: await dirSize(path.join(config.photosDir(), e.id))
    }))
  );
  events_.sort((a, b) => b.bytes - a.bytes);

  const [siteImagesBytes, databaseBytes] = await Promise.all([
    dirSize(path.join(config.photosDir(), "_site")),
    databaseSize()
  ]);
  const photosBytes = events_.reduce((sum, e) => sum + e.bytes, 0);

  return {
    photosBytes,
    siteImagesBytes,
    databaseBytes,
    totalBytes: photosBytes + siteImagesBytes + databaseBytes,
    events: events_
  };
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exp;
  return `${exp === 0 ? value : value.toFixed(1)} ${units[exp]}`;
}
