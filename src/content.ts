import type { SearchResult, RankedResult } from './types.js';

// ---- Google検索結果をDOMから抽出 ----
function extractSearchResults(): SearchResult[] {
  const results: SearchResult[] = [];

  const h3Elements = document.querySelectorAll('h3');

  h3Elements.forEach((h3, index) => {
    const linkEl = h3.closest('a');
    if (!linkEl) return; // aタグがないものは除外（11番の'説明'など）

    const url = linkEl.getAttribute('href') ?? '';
    if (!url.startsWith('http')) return; // 外部リンクのみ対象

    // スニペット：リンクの親要素の中からテキストを探す
    const container = linkEl.closest('div[class]');
    const snippetEl = container?.querySelector('div:not(:has(h3)) span');

    results.push({
      title: h3.textContent?.trim() ?? '',
      url,
      snippet: snippetEl?.textContent?.trim() ?? '',
      rank: index + 1,
    });
  });

  return results;
}

// ---- 並び替えロジック（後でバックエンドAPIに差し替える）----
function rerank(results: SearchResult[]): RankedResult[] {
  return results
    .map((r) => ({
      ...r,
      score: scoreResult(r),
      newRank: 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, newRank: i + 1 }));
}

function scoreResult(r: SearchResult): number {
  let score = 10 - r.rank;
  if (r.url.includes('github.com')) score += 3;
  if (r.url.includes('stackoverflow.com')) score += 2;
  return score;
}

// ---- DOMを並び替え順に書き換え ----
function applyRanking(ranked: RankedResult[]): void {
  const h3Elements = document.querySelectorAll('h3');
  const validItems: Element[] = [];

  // aタグを持つh3の親コンテナを収集
  h3Elements.forEach((h3) => {
    const linkEl = h3.closest('a');
    if (!linkEl) return;
    const url = linkEl.getAttribute('href') ?? '';
    if (!url.startsWith('http')) return;

    // 検索結果1件分のコンテナを取得（なるべく上位の親）
    const container = linkEl.closest('div[data-hveid]') ?? linkEl.parentElement;
    if (container && !validItems.includes(container)) {
      validItems.push(container);
    }
  });

  if (validItems.length === 0) return;
  const parent = validItems[0].parentElement;
  if (!parent) return;

  // 並び替え
  const sorted = [...ranked].sort((a, b) => a.newRank - b.newRank);
  sorted.forEach((result) => {
    const el = validItems[result.rank - 1];
    if (el) parent.appendChild(el);
  });

  // バッジを追加
  sorted.forEach((result) => {
    const el = validItems[result.rank - 1] as HTMLElement;
    if (!el) return;

    el.querySelector('.reranker-badge')?.remove();
    const badge = document.createElement('div');
    badge.className = 'reranker-badge';
    badge.textContent = `#${result.newRank} (元: #${result.rank})`;
    badge.style.cssText = `
      font-size: 11px;
      color: #1a73e8;
      margin-bottom: 4px;
      font-weight: bold;
    `;
    el.prepend(badge);
  });
}

// ---- メイン処理 ----
function main(): void {
  const results = extractSearchResults();

  if (results.length === 0) {
    console.log('[Search Reranker] 検索結果が見つかりませんでした');
    return;
  }

  console.log(`[Search Reranker] ${results.length}件の結果を取得`, results);

  const ranked = rerank(results);
  applyRanking(ranked);

  console.log('[Search Reranker] 並び替え完了', ranked);
}

// DOMの読み込み完了を待って実行
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'RERANK') {
    try {
      const results = extractSearchResults();
      const ranked = rerank(results);
      applyRanking(ranked);
      console.log(`[Search ReRank Extension] ${ranked.length}件を並び替え完了`);
      sendResponse({ success: true, count: ranked.length });
    } catch (e) {
      console.error('[Search ReRank Extension]', e);
      sendResponse({ success: false });
    }
  }
  return true; // 非同期レスポンスのために必要
});

// ---- フローティングボタンをページに追加 ----
function addFloatingButton(): void {
  // 既存のボタンがあれば追加しない
  if (document.getElementById('rerank-floating-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'rerank-floating-btn';
  btn.textContent = '🔀 並び替え';
  btn.style.cssText = `
    position: fixed;
    bottom: 32px;
    right: 32px;
    z-index: 99999;
    padding: 12px 20px;
    background: #1a73e8;
    color: white;
    border: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: background 0.2s, transform 0.1s;
  `;

  btn.addEventListener('mouseenter', () => {
    btn.style.background = '#1557b0';
    btn.style.transform = 'scale(1.05)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = '#1a73e8';
    btn.style.transform = 'scale(1)';
  });

  btn.addEventListener('click', () => {
    btn.textContent = '⏳ 並び替え中...';
    btn.setAttribute('disabled', 'true');

    try {
      const results = extractSearchResults();
      const ranked = rerank(results);
      applyRanking(ranked);
      btn.textContent = '✅ 並び替え完了！';
      console.log(`[Search ReRank Extension] ${ranked.length}件を並び替え完了`);
    } catch (e) {
      btn.textContent = '❌ エラー';
      console.error('[Search ReRank Extension]', e);
    }

    setTimeout(() => {
      btn.textContent = '🔀 並び替え';
      btn.removeAttribute('disabled');
    }, 2000);
  });

  document.body.appendChild(btn);
}

// ---- DOMの読み込み完了後にボタンを追加 ----
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addFloatingButton);
} else {
  addFloatingButton();
}
