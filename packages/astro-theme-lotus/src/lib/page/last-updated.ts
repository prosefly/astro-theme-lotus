import { stat } from 'node:fs/promises';
import path from 'node:path';
import type { CollectionEntry } from 'astro:content';

type DocsEntry = CollectionEntry<'docs'>;

export async function getEntryLastUpdated(
  entry: DocsEntry,
): Promise<Date | boolean | undefined> {
  if (entry.data.lastUpdated === false) {
    return false;
  }

  if (entry.data.lastUpdated instanceof Date) {
    return entry.data.lastUpdated;
  }

  if (!entry.filePath) {
    return entry.data.lastUpdated;
  }

  try {
    const sourcePath = path.isAbsolute(entry.filePath)
      ? entry.filePath
      : path.resolve(process.cwd(), entry.filePath);
    const stats = await stat(sourcePath);

    return stats.mtime;
  } catch {
    return entry.data.lastUpdated;
  }
}
