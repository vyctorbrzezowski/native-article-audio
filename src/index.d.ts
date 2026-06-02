export type NativeArticleAudioSection = {
  title: string;
  end: number;
};

export type NativeArticleAudioPlayerOptions = {
  audioSrc: string;
  title?: string;
  sections?: NativeArticleAudioSection[];
  waveform?: number[];
  rates?: number[];
};

export type NativeArticleAudioPlayer = {
  audio: HTMLAudioElement;
  destroy: () => void;
  redraw: () => void;
};

export function deriveSectionsFromArticle(article: HTMLElement, selector?: string): NativeArticleAudioSection[];

export function mountNativeArticleAudioPlayer(
  container: HTMLElement,
  options: NativeArticleAudioPlayerOptions,
): NativeArticleAudioPlayer;

export function initNativeArticleAudioPlayers(root?: ParentNode): NativeArticleAudioPlayer[];

