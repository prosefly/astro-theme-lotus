import type { SidebarIssue } from './types';

const warnedIssues = new Set<string>();

function formatIssue(issue: SidebarIssue): string {
  switch (issue.type) {
    case 'duplicate-section':
      return `duplicate sidebar section slug "${issue.sectionSlug}" from labels: ${issue.labels.join(', ')}`;
    case 'missing-entry':
      return `sidebar section "${issue.sectionSlug}" references missing docs entry "${issue.slug}"`;
    case 'empty-autogenerate':
      return `sidebar section "${issue.sectionSlug}" autogenerate directory "${issue.directory}" did not match any docs entries`;
    case 'duplicate-entry':
      return `docs entry "${issue.slug}" appears in sidebar sections "${issue.firstSection}" and "${issue.duplicateSection}"; the first section owns the page`;
  }
}

function getIssueKey(issue: SidebarIssue, localeKey: string): string {
  return `${localeKey}:${issue.type}:${formatIssue(issue)}`;
}

export function warnSidebarIssues(issues: SidebarIssue[], localeKey: string): void {
  for (const issue of issues) {
    const key = getIssueKey(issue, localeKey);

    if (warnedIssues.has(key)) {
      continue;
    }

    warnedIssues.add(key);
    console.warn(`[Lotus] ${formatIssue(issue)}.`);
  }
}
