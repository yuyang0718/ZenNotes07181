
export type Language = 'en' | 'zh';

export interface Category {
  id: string;
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  deletedAt?: number; // Timestamp when moved to trash
  categoryId?: string;
  isPinned?: boolean;
}

export type SearchResult = {
  noteId: string;
  index: number;
  length: number;
};
