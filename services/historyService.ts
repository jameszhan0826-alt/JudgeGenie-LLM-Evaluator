import { HistoryItem } from '../types';

const STORAGE_KEY = 'idea_spark_history';

export const historyService = {
  getHistory(): HistoryItem[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse history', e);
      return [];
    }
  },

  saveItem(item: HistoryItem): void {
    const history = this.getHistory();
    
    // Exclude large binary/base64 data from persistent storage to avoid quota limits
    // Also limit transcript sizes if they are excessively large
    const { audioRecap, ...itemToSave } = item;
    
    if (itemToSave.transcript && itemToSave.transcript.length > 500000) {
      itemToSave.transcript = itemToSave.transcript.substring(0, 500000) + '... [Truncated for storage]';
    }
    if (itemToSave.vttTranscript && itemToSave.vttTranscript.length > 500000) {
      itemToSave.vttTranscript = itemToSave.vttTranscript.substring(0, 500000) + '... [Truncated for storage]';
    }
    
    const index = history.findIndex(h => h.id === item.id);
    if (index !== -1) {
      history[index] = { ...history[index], ...itemToSave };
    } else {
      history.unshift(itemToSave);
    }
    
    // Keep only the last 15 items to be safe
    const trimmedHistory = history.slice(0, 15);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
    } catch (e) {
      console.warn('LocalStorage quota exceeded, attempting to save with fewer items', e);
      try {
        // If it fails, try saving only the last 5 items
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory.slice(0, 5)));
      } catch (innerError) {
        console.error('Failed to save even minimal history', innerError);
      }
    }
  },

  findItemByFile(filename: string, fileSize: number): HistoryItem | undefined {
    const history = this.getHistory();
    return history.find(h => h.filename === filename && h.fileSize === fileSize);
  },

  deleteItem(id: string): void {
    const history = this.getHistory();
    const filtered = history.filter(h => h.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to update history after deletion', e);
    }
  },

  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
