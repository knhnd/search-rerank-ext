import type { ApiConfig, SearchResult, RankedResult } from './types.js';

// ---- Google Custom Search API 呼び出し ----
async function fetchSearchResults(query: string, config: ApiConfig): Promise<SearchResult[]> {
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', config.apiKey);
  url.searchParams.set('cx', config.searchEngineId);
  url.searchParams.set('q', query);
  url.searchParams.set('num', '10');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();
  const items = data.items ?? [];

  return items.map(
    (item: any, index: number): SearchResult => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet ?? '',
      rank: index + 1,
    }),
  );
}

// ---- 並び替えロジック（並び替えのロジックは任意のバックエンドAPIに差し替え可能）----
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

// スコアリング例：URLにキーワードが含まれていたら加点（仮ロジック）
function scoreResult(r: SearchResult): number {
  let score = 10 - r.rank; // 元順位が高いほど有利
  if (r.url.includes('github.com')) score += 3;
  if (r.url.includes('stackoverflow.com')) score += 2;
  return score;
}

// ---- UI 描画 ----
function renderResults(results: RankedResult[]): void {
  const container = document.getElementById('results')!;
  container.innerHTML = '';

  for (const r of results) {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      <div class="rank">#${r.newRank} <span class="orig">(元: #${r.rank})</span></div>
      <a href="${r.url}" target="_blank">${r.title}</a>
      <p>${r.snippet}</p>
    `;
    container.appendChild(item);
  }
}

function showError(msg: string): void {
  const container = document.getElementById('results')!;
  container.innerHTML = `<div class="error">${msg}</div>`;
}

// ---- 設定の保存・読み込み ----
async function loadConfig(): Promise<ApiConfig | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiKey', 'searchEngineId'], (data) => {
      if (data.apiKey && data.searchEngineId) {
        resolve({ apiKey: data.apiKey, searchEngineId: data.searchEngineId });
      } else {
        resolve(null);
      }
    });
  });
}

async function saveConfig(config: ApiConfig): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(config, resolve);
  });
}

// ---- メイン ----
document.addEventListener('DOMContentLoaded', async () => {
  const searchBtn = document.getElementById('search-btn')!;
  const queryInput = document.getElementById('query') as HTMLInputElement;
  const saveBtn = document.getElementById('save-config')!;
  const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  const cxInput = document.getElementById('cx') as HTMLInputElement;

  // 保存済み設定を復元
  const saved = await loadConfig();
  if (saved) {
    apiKeyInput.value = saved.apiKey;
    cxInput.value = saved.searchEngineId;
  }

  // 設定保存
  saveBtn.addEventListener('click', async () => {
    await saveConfig({
      apiKey: apiKeyInput.value.trim(),
      searchEngineId: cxInput.value.trim(),
    });
    saveBtn.textContent = '保存しました！';
    setTimeout(() => (saveBtn.textContent = '設定を保存'), 1500);
  });

  // 検索実行
  searchBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query) return;

    const config = await loadConfig();
    if (!config?.apiKey || !config?.searchEngineId) {
      showError('先にAPIキーと検索エンジンIDを設定してください。');
      return;
    }

    searchBtn.textContent = '検索中...';
    searchBtn.setAttribute('disabled', 'true');

    try {
      const results = await fetchSearchResults(query, config);
      const ranked = rerank(results);
      renderResults(ranked);
    } catch (e) {
      showError(`エラーが発生しました: ${(e as Error).message}`);
    } finally {
      searchBtn.textContent = '検索';
      searchBtn.removeAttribute('disabled');
    }
  });

  // Enterキーでも検索
  queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
  });
});
