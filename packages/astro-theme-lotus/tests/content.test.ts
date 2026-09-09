import { describe, expect, it } from 'vitest';
import { docsSchema } from '../src/content';

describe('docs content schema', () => {
  it('accepts a sidebar icon', () => {
    const schema = docsSchema()({} as never);

    expect(schema.parse({
      title: 'Badge',
      sidebar: {
        icon: 'lucide:badge',
      },
    })).toMatchObject({
      title: 'Badge',
      sidebar: {
        icon: 'lucide:badge',
      },
    });
  });
});
