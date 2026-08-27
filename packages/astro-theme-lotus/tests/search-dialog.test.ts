import { describe, expect, it } from 'vitest';
import { createSearchRequestGuard } from '../src/client/search/dialog';

describe('search request guard', () => {
  it('ignores results from a request superseded by a newer input', () => {
    const guard = createSearchRequestGuard();
    const firstRequest = guard.begin();
    const secondRequest = guard.begin();

    expect(guard.isCurrent(firstRequest)).toBe(false);
    expect(guard.isCurrent(secondRequest)).toBe(true);
  });

  it('invalidates an earlier request when an empty query starts', () => {
    const guard = createSearchRequestGuard();
    const searchRequest = guard.begin();
    guard.begin();

    expect(guard.isCurrent(searchRequest)).toBe(false);
  });
});
