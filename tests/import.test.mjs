import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deriveSectionsFromArticle,
  initNativeArticleAudioPlayers,
  mountNativeArticleAudioPlayer,
} from '../src/index.js';

test('exports the public browser helpers', () => {
  assert.equal(typeof deriveSectionsFromArticle, 'function');
  assert.equal(typeof initNativeArticleAudioPlayers, 'function');
  assert.equal(typeof mountNativeArticleAudioPlayer, 'function');
});
