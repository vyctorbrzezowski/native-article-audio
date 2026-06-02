# native-article-audio

Dependency-free article audio UI for narrated posts, docs, and essays.

It renders a custom audio player with a canvas waveform, hover previews for article sections, click-to-seek, playback speed control, and a live current-heading label. It is designed for audio-native articles: narration that adapts headings, images, charts, tables, code, and figures for listeners instead of reading a page literally.

## Install

```sh
npm install github:vyctorbrzezowski/native-article-audio
```

Or use the source files directly:

```html
<link rel="stylesheet" href="./src/styles.css">
<script type="module">
  import { mountNativeArticleAudioPlayer, deriveSectionsFromArticle } from './src/index.js';
</script>
```

## Usage

```js
import {
  mountNativeArticleAudioPlayer,
  deriveSectionsFromArticle,
} from 'native-article-audio';
import 'native-article-audio/styles.css';

const article = document.querySelector('article');
const container = document.querySelector('[data-audio-player]');

mountNativeArticleAudioPlayer(container, {
  audioSrc: '/audio/post.mp3',
  title: 'Post title',
  sections: deriveSectionsFromArticle(article),
  waveform: [0.24, 0.52, 0.87, 0.43],
});
```

`waveform` should be an array of normalized peak values from `0` to `1`. If omitted, the player renders a calm placeholder until you provide waveform data.

## Skill

The repo includes `skills/audio-native-article`, a Codex skill for turning articles into listening-first TTS scripts. It includes guidance for adapting non-textual material such as images, tables, charts, code snippets, and diagrams.

## Notes

- No dependencies.
- No tracking or analytics.
- Audio is a normal `<audio>` element; the custom UI is only presentation and control.
- The audio narration workflow is provider-neutral and does not require a specific TTS vendor.
