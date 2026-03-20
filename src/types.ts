export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  rank: number; // 元の順位
}

export interface RankedResult extends SearchResult {
  newRank: number; // 並び替え後の順位
  score: number; // 自分のスコアリング
}

export interface ApiConfig {
  apiKey: string;
  searchEngineId: string;
}
