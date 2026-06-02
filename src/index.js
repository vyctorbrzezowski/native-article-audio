const DEFAULT_RATES = [1, 1.25, 1.5, 0.85];

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '--:--';
  const total = Math.floor(value);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function textWeight(node) {
  return (node.textContent || '').replace(/\s+/g, ' ').trim().length;
}

function sectionForRatio(sections, total, ratio) {
  const position = Math.min(Math.max(ratio, 0), 1) * total;
  return sections.find((section) => position <= section.end) || sections.at(-1);
}

function cssColor(element, property, fallback) {
  return getComputedStyle(element).getPropertyValue(property).trim() || fallback;
}

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function parseWaveform(value) {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function deriveSectionsFromArticle(article, selector = 'h2, h3') {
  const headings = Array.from(article.querySelectorAll(selector));
  const content = article.querySelector('[data-article-content]') || article;
  const title = article.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const firstHeading = headings[0];
  let introWeight = title.length;
  let total = 0;
  const sections = [];

  for (const node of content.childNodes) {
    if (node === firstHeading) break;
    if (node instanceof HTMLHeadingElement && headings.includes(node)) break;
    introWeight += textWeight(node);
  }

  if (title && introWeight > title.length) {
    total += Math.max(introWeight, 160);
    sections.push({ title, end: total });
  }

  for (const heading of headings) {
    let weight = Math.max(textWeight(heading), 80);

    for (let node = heading.nextSibling; node; node = node.nextSibling) {
      if (node instanceof HTMLHeadingElement && headings.includes(node)) break;
      weight += textWeight(node);
    }

    total += Math.max(weight, 120);
    const headingTitle = heading.textContent?.replace(/\s+/g, ' ').trim();
    if (headingTitle) sections.push({ title: headingTitle, end: total });
  }

  return sections;
}

export function mountNativeArticleAudioPlayer(container, options) {
  if (!container) throw new Error('mountNativeArticleAudioPlayer requires a container');
  if (!options?.audioSrc) throw new Error('mountNativeArticleAudioPlayer requires audioSrc');

  const rates = options.rates?.length ? options.rates : DEFAULT_RATES;
  const sections = options.sections || [];
  const sectionTotal = sections.at(-1)?.end || 0;
  const sourceWaveform = Array.isArray(options.waveform) && options.waveform.length
    ? options.waveform.filter((value) => Number.isFinite(value))
    : Array.from({ length: 80 }, () => 0.18);

  container.innerHTML = `
    <div class="naa-player" data-native-article-audio-player>
      <audio src="${escapeAttribute(options.audioSrc)}" preload="metadata"></audio>
      <button class="naa-play" type="button" aria-label="Play audio">
        <span class="naa-play-icon" aria-hidden="true">▶</span>
        <span class="naa-pause-icon" aria-hidden="true">Ⅱ</span>
      </button>
      <div class="naa-body">
        <div class="naa-controls">
          <div class="naa-track" role="slider" tabindex="0" aria-label="Audio progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <canvas class="naa-waveform" width="520" height="44" aria-hidden="true"></canvas>
            <span class="naa-hover-line" hidden></span>
            <span class="naa-preview" hidden></span>
          </div>
          <div class="naa-heading" aria-live="polite" hidden></div>
          <span class="naa-time">0:00 / --:--</span>
          <button class="naa-rate" type="button" aria-label="Playback speed">1x</button>
        </div>
      </div>
    </div>
  `;

  const player = container.querySelector('.naa-player');
  const audio = player.querySelector('audio');
  const playButton = player.querySelector('.naa-play');
  const track = player.querySelector('.naa-track');
  const canvas = player.querySelector('.naa-waveform');
  const hoverLine = player.querySelector('.naa-hover-line');
  const preview = player.querySelector('.naa-preview');
  const heading = player.querySelector('.naa-heading');
  const time = player.querySelector('.naa-time');
  const rateButton = player.querySelector('.naa-rate');
  const context = canvas.getContext('2d');
  let hoverRatio = null;
  let rateIndex = 0;

  const currentRatio = () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return 0;
    return Math.min(Math.max(audio.currentTime / audio.duration, 0), 1);
  };

  const draw = () => {
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.clearRect(0, 0, width, height);
    const gap = 2 * dpr;
    const minBarWidth = 2 * dpr;
    const barCount = Math.max(1, Math.min(sourceWaveform.length, Math.floor((width + gap) / (minBarWidth + gap))));
    const values = Array.from({ length: barCount }, (_, index) => {
      const sourceIndex = Math.min(sourceWaveform.length - 1, Math.floor(index * sourceWaveform.length / barCount));
      return sourceWaveform[sourceIndex] ?? 0.18;
    });
    const barWidth = Math.max(minBarWidth, Math.floor((width - gap * (values.length - 1)) / values.length));
    const progressX = width * currentRatio();
    const hoverX = hoverRatio === null ? null : width * hoverRatio;
    const idle = cssColor(player, '--naa-wave-idle', 'rgba(145, 160, 184, 0.45)');
    const hover = cssColor(player, '--naa-wave-hover', 'rgba(210, 218, 232, 0.62)');
    const active = cssColor(player, '--naa-accent', '#00e5cc');
    const center = height / 2;

    values.forEach((value, index) => {
      const x = index * (barWidth + gap);
      const barHeight = Math.max(4 * dpr, Math.min(1, Math.max(0.04, value)) * height * 0.9);
      context.fillStyle = x <= progressX ? active : hoverX !== null && x <= hoverX ? hover : idle;
      context.fillRect(x, center - barHeight / 2, barWidth, barHeight);
    });
  };

  const syncHeading = () => {
    if (!sections.length || !sectionTotal || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      heading.hidden = true;
      return;
    }
    heading.textContent = sectionForRatio(sections, sectionTotal, currentRatio())?.title || '';
    heading.hidden = !heading.textContent;
  };

  const syncTime = () => {
    time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    track.setAttribute('aria-valuenow', String(Math.round(currentRatio() * 100)));
    draw();
    syncHeading();
  };

  const syncPlayState = () => {
    player.toggleAttribute('data-playing', !audio.paused);
    playButton.setAttribute('aria-label', audio.paused ? 'Play audio' : 'Pause audio');
  };

  const pointerRatio = (event) => {
    const rect = track.getBoundingClientRect();
    return rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
  };

  const seek = (ratio) => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * audio.duration;
    syncTime();
  };

  const syncPreview = (event) => {
    if (!sections.length || !sectionTotal) return;
    hoverRatio = Math.min(Math.max(pointerRatio(event), 0), 1);
    preview.textContent = sectionForRatio(sections, sectionTotal, hoverRatio)?.title || '';
    preview.hidden = !preview.textContent;
    preview.style.left = `${hoverRatio * 100}%`;
    hoverLine.style.left = `${hoverRatio * 100}%`;
    hoverLine.hidden = false;
    draw();
  };

  const listeners = [
    [playButton, 'click', async () => {
      if (audio.paused) await audio.play().catch(() => {});
      else audio.pause();
      syncPlayState();
    }],
    [rateButton, 'click', () => {
      rateIndex = (rateIndex + 1) % rates.length;
      audio.playbackRate = rates[rateIndex];
      rateButton.textContent = `${rates[rateIndex]}x`;
    }],
    [track, 'pointerenter', syncPreview],
    [track, 'pointermove', syncPreview],
    [track, 'pointerdown', (event) => seek(pointerRatio(event))],
    [track, 'pointerleave', () => {
      hoverRatio = null;
      preview.hidden = true;
      hoverLine.hidden = true;
      draw();
    }],
    [track, 'keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        seek(currentRatio() - 5 / Math.max(audio.duration || 1, 1));
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        seek(currentRatio() + 5 / Math.max(audio.duration || 1, 1));
      }
    }],
    [audio, 'loadedmetadata', syncTime],
    [audio, 'timeupdate', syncTime],
    [audio, 'play', syncPlayState],
    [audio, 'pause', syncPlayState],
    [audio, 'ended', syncTime],
  ];

  for (const [target, event, handler] of listeners) target.addEventListener(event, handler);
  const resizeObserver = new ResizeObserver(draw);
  resizeObserver.observe(track);
  syncTime();
  syncPlayState();

  return {
    audio,
    redraw: draw,
    destroy() {
      resizeObserver.disconnect();
      for (const [target, event, handler] of listeners) target.removeEventListener(event, handler);
      container.innerHTML = '';
    },
  };
}

export function initNativeArticleAudioPlayers(root = document) {
  return Array.from(root.querySelectorAll('[data-native-article-audio]:not([data-native-article-audio-bound])')).map((container) => {
    container.setAttribute('data-native-article-audio-bound', 'true');
    const article = container.closest('article') || document.querySelector('article');
    const waveform = parseWaveform(container.dataset.waveform);
    return mountNativeArticleAudioPlayer(container, {
      audioSrc: container.dataset.audioSrc,
      title: container.dataset.title || article?.querySelector('h1')?.textContent,
      sections: article ? deriveSectionsFromArticle(article) : [],
      waveform,
    });
  });
}
