import {
  createMarkdownProcessor,
  type MarkdownHeading,
} from '@astrojs/markdown-remark';
import type {
  OpenApiExchangeEntry,
  OpenApiIntroductionEntry,
} from './types';

let processorPromise: ReturnType<typeof createMarkdownProcessor> | undefined;

export async function getOpenApiHeadings(content: string): Promise<MarkdownHeading[]> {
  processorPromise ??= createMarkdownProcessor({
    remarkRehype: { allowDangerousHtml: false },
  });
  const processor = await processorPromise;
  const result = await processor.render(content);

  return result.metadata.headings.filter((heading) =>
    heading.slug !== 'footnote-label'
    && heading.depth >= 2
    && heading.depth <= 3
  );
}

export function createOpenApiPageMarkdown(
  entry: OpenApiIntroductionEntry | OpenApiExchangeEntry,
): string {
  if ('body' in entry) {
    return joinSections([
      `# ${entry.data.title}`,
      entry.data.description,
      entry.body,
    ]);
  }

  const endpoint = entry.data.path ?? entry.data.name;
  const metadata = endpoint ? `\`${entry.data.method.toUpperCase()} ${endpoint}\`` : undefined;
  const content = entry.data.content ?? entry.data.description;
  const lead = entry.data.lead && !content?.trimStart().startsWith(entry.data.lead.trim())
    ? entry.data.lead
    : undefined;

  return joinSections([
    `# ${entry.data.summary}`,
    metadata,
    lead,
    content,
    createParameterMarkdown(entry),
    createResponseMarkdown(entry),
  ]);
}

function createParameterMarkdown(entry: OpenApiExchangeEntry): string | undefined {
  if (entry.data.parameters.length === 0) {
    return undefined;
  }

  const parameters = entry.data.parameters.map((parameter) => {
    const name = String(parameter.name ?? 'parameter');
    const location = parameter.in ? ` (${String(parameter.in)})` : '';
    const description = parameter.description ? ` — ${String(parameter.description)}` : '';

    return `- \`${name}\`${location}${description}`;
  });

  return ['## Parameters', '', ...parameters].join('\n');
}

function createResponseMarkdown(entry: OpenApiExchangeEntry): string | undefined {
  if (entry.data.responses.length === 0) {
    return undefined;
  }

  const responses = entry.data.responses.map((response) => {
    const status = String(response.status ?? 'response');
    const description = response.description ? ` — ${String(response.description)}` : '';

    return `- \`${status}\`${description}`;
  });

  return ['## Responses', '', ...responses].join('\n');
}

function joinSections(sections: Array<string | undefined>): string {
  return `${sections.filter((section) => section?.trim()).join('\n\n').trim()}\n`;
}
