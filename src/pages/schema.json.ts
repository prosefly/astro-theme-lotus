import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function GET() {
  const schema = readFileSync(
    join(process.cwd(), 'packages/astro-theme-lotus/src/schema.json'),
    'utf8',
  );

  return new Response(schema, {
    headers: {
      'content-type': 'application/schema+json; charset=utf-8',
    },
  });
}
