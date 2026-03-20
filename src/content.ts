import type { SearchResult, RankedResult } from './types.js';

// ---- Google検索結果をDOMから抽出 ----
function extractSearchResults(): SearchResult[] {
  const results: SearchResult[] = [];

  // Google検索結果の各アイテムを取得
  // data-snnum属性で順位が取れる
  const items = document.querySelectorAll('div[data-snnum]');

  items.forEach((item, index) => {
    const titleEl = item.querySelector('h3');
    const linkEl = item.querySelector('a[href]');
    const snippetEl = item.querySelector('div[data-sncf]') ?? item.querySelector('.VwiC3b');

    if (!titleEl || !linkEl) return;

    const url = linkEl.getAttribute('href') ?? '';
    if (!url.startsWith('http')) return; // 広告・内部リンクを除外

    results.push({
      title: titleEl.textContent ?? '',
      url,
      snippet: snippetEl?.textContent ?? '',
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
  const items = document.querySelectorAll('div[data-snnum]');
  if (items.length === 0) return;

  const parent = items[0].parentElement;
  if (!parent) return;

  // 並び替え後の順序でDOMを並べ直す
  const sorted = [...ranked].sort((a, b) => a.newRank - b.newRank);

  sorted.forEach((result) => {
    const originalIndex = result.rank - 1;
    const el = items[originalIndex];
    if (el) parent.appendChild(el); // 末尾に追加することで並び替え
  });

  // 順位バッジを追加
  sorted.forEach((result) => {
    const originalIndex = result.rank - 1;
    const el = items[originalIndex] as HTMLElement;
    if (!el) return;

    // 既存バッジを削除
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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
