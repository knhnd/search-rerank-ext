/// <reference types="chrome" />

document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status')!;
  const rerankBtn = document.getElementById('rerank-btn')!;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url ?? '';
    if (url.includes('google.com/search')) {
      statusEl.textContent = 'Googleの検索結果ページを検出しました';
      statusEl.style.color = 'green';
      rerankBtn.removeAttribute('disabled');
    } else {
      statusEl.textContent = 'Googleで検索すると並び替えができます';
      statusEl.style.color = '#666';
      rerankBtn.setAttribute('disabled', 'true');
    }
  });

  rerankBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;

      rerankBtn.textContent = '並び替え中...';
      rerankBtn.setAttribute('disabled', 'true');

      chrome.tabs.sendMessage(tabId, { type: 'RERANK' }, (response) => {
        if (response?.success) {
          rerankBtn.textContent = '並び替え完了！';
          statusEl.textContent = `${response.count}件を並び替えました`;
        } else {
          rerankBtn.textContent = '並び替え失敗';
          statusEl.textContent = 'エラーが発生しました';
          statusEl.style.color = 'red';
        }
        setTimeout(() => {
          rerankBtn.textContent = '並び替えを実行';
          rerankBtn.removeAttribute('disabled');
        }, 2000);
      });
    });
  });
});
