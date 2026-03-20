/// <reference types="chrome" />

// ---- UI：現在のタブの検索結果件数を表示するだけのシンプルな構成 ----
document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status')!;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url ?? '';
    if (url.includes('google.com/search')) {
      statusEl.textContent = '✅ 並び替えが有効です';
      statusEl.style.color = 'green';
    } else {
      statusEl.textContent = 'Googleで検索すると並び替えが動きます';
      statusEl.style.color = '#666';
    }
  });
});
