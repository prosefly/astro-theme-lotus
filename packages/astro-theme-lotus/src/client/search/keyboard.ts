export type SearchKeyboardAction = 'next' | 'previous' | 'submit';

export function getSearchKeyboardAction(event: KeyboardEvent): SearchKeyboardAction | undefined {
  if (event.isComposing) {
    return undefined;
  }

  if (event.key === 'ArrowDown') {
    return 'next';
  }

  if (event.key === 'ArrowUp') {
    return 'previous';
  }

  if (event.key === 'Enter') {
    return 'submit';
  }

  return undefined;
}
