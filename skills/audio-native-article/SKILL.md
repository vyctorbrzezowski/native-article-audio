---
name: audio-native-article
description: Transform articles, blog posts, documentation pages, newsletters, or essays into audio-native TTS packages instead of literal transcripts. Use when preparing narration scripts, section timing metadata, image/table/chart/code descriptions, listening-first summaries, voice-test excerpts, or audio player data for written content with headings, images, diagrams, tables, charts, screenshots, code blocks, or other non-textual material.
---

# Audio-Native Article

Create listener-first narration that preserves the article's meaning while adapting the page for audio. Do not read the page literally when a listener needs context, transitions, or a spoken explanation of visual material.

## Workflow

1. Inventory the article.
   - Read the source content and frontmatter/metadata.
   - Capture title, author/byline, date, dek/description, headings, links, images, figures, tables, charts, code blocks, callouts, and embeds.
   - If working from Markdown or HTML, you may run `scripts/extract_article_context.mjs <article-file>` for a first-pass JSON inventory.

2. Decide what the listener needs.
   - Keep claims, facts, dates, numbers, names, and attribution faithful.
   - Convert visual or structural material into concise spoken context.
   - Preserve the article's point of view, but remove web-only friction such as raw URLs, redundant nav text, decorative alt text, and repeated captions.

3. Write the audio-native script.
   - Start with title, byline when useful, publication date when useful, and a one-sentence orientation.
   - Use headings as spoken section transitions, not as flat labels.
   - Turn tables/charts into the takeaway, then mention the strongest supporting values.
   - Turn screenshots/images into what they prove or illustrate.
   - Turn code into intent and short commands only when the exact syntax matters.
   - Add brief transitions when the page jumps visually but audio needs continuity.

4. Create playback metadata.
   - Produce `sections.json` with heading labels in source order for current-section UI and hover previews.
   - If generating audio, produce or request waveform peaks as normalized `0..1` values.
   - Keep visual descriptions in a separate notes file if they are too detailed for the final script.

5. Validate before TTS.
   - Read the script aloud mentally for pacing and listener fatigue.
   - Check that every image/table/chart/code block was either narrated, summarized, or intentionally skipped as decorative.
   - Compare against the source for factual drift.
   - Estimate duration at 140-165 spoken words per minute.

## Output Shape

Prefer this package when the user asks to prepare a full audio version:

```text
audio/
  script.txt
  sections.json
  visual-notes.md
  manifest.json
```

`script.txt` is what goes to TTS. `visual-notes.md` records why visual material was included, condensed, or skipped. `manifest.json` tracks source path/URL, voice/provider settings if known, word count, estimated duration, and generated audio filenames.

## Non-Text Material

Use `references/audio-native-writing.md` when the article contains images, charts, tables, screenshots, code, formulas, or diagrams.

Do not say "image shows" repeatedly. Vary the phrasing and connect visuals to the argument:

- "The screenshot makes the failure mode concrete..."
- "The table's important pattern is..."
- "The chart is not about the exact curve; it shows..."
- "The command example is short enough to read..."

## Guardrails

- Do not invent facts hidden outside the source.
- Do not preserve source markdown or HTML syntax unless syntax is the topic.
- Do not read full URLs unless the URL itself matters.
- Do not include secrets, private keys, local-only paths, or provider API keys in outputs.
- Do not optimize for a TTS vendor's branding or embed widget; keep the narration and metadata provider-neutral.

