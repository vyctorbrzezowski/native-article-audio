#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('Usage: extract_article_context.mjs <article.md|article.html>');
  process.exit(2);
}

const source = readFileSync(file, 'utf8');

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: {}, body: text };
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (item) frontmatter[item[1]] = item[2].replace(/^["']|["']$/g, '');
  }
  return { frontmatter, body: text.slice(match[0].length) };
}

function compact(text) {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function summarizeMarkdown(body) {
  const blocks = [];
  const lines = body.split('\n');
  let paragraph = [];

  const flushParagraph = () => {
    const text = compact(paragraph.join(' '));
    if (text) blocks.push({ type: 'paragraph', text });
    paragraph = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const image = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    const table = line.includes('|') && lines[index + 1]?.match(/^\s*\|?[\s:-]+\|/);
    const fence = line.match(/^```(.*)$/);

    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', depth: heading[1].length, text: compact(heading[2]) });
      continue;
    }

    if (image) {
      flushParagraph();
      blocks.push({ type: 'image', alt: compact(image[1]), src: image[2] });
      continue;
    }

    if (table) {
      flushParagraph();
      const rows = [];
      while (index < lines.length && lines[index].includes('|')) {
        rows.push(lines[index]);
        index += 1;
      }
      index -= 1;
      blocks.push({ type: 'table', rows: rows.length, preview: rows.slice(0, 4).map(compact) });
      continue;
    }

    if (fence) {
      flushParagraph();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: 'code', language: fence[1].trim(), lines: code.length, preview: code.slice(0, 6) });
      continue;
    }

    if (!line.trim()) flushParagraph();
    else paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

const { frontmatter, body } = parseFrontmatter(source);
const blocks = summarizeMarkdown(body);
const result = {
  source: basename(file),
  frontmatter,
  counts: {
    headings: blocks.filter((block) => block.type === 'heading').length,
    images: blocks.filter((block) => block.type === 'image').length,
    tables: blocks.filter((block) => block.type === 'table').length,
    codeBlocks: blocks.filter((block) => block.type === 'code').length,
    paragraphs: blocks.filter((block) => block.type === 'paragraph').length,
  },
  blocks,
};

console.log(JSON.stringify(result, null, 2));

