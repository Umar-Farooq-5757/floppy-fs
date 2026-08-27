import Dexie, { type Table } from "dexie";

export interface FileMetadata {
  id: string;
  title: string;
  parentId: string | null;
  type: "file" | "folder";
  hash?: string;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileContent {
  hash: string;
  content: string | Blob;
}

export class FileSystemDB extends Dexie {
  nodes!: Table<FileMetadata, string>;
  contents!: Table<FileContent, string>;

  constructor() {
    super("FloppyFileSystemDB");
    this.version(1).stores({
      /*
       * Primary key:
       *   id
       *
       * Indexed fields:
       *   parentId
       *   title
       *   hash
       *
       * The compound index is kept for possible future use, but the
       * file operations intentionally do not query it with parentId = null.
       */
      nodes: "id, parentId, title, hash, [parentId+title]",
      /*
       * Primary key:
       *   hash
       */
      contents: "hash",
    });
  }
}

export const db = new FileSystemDB();
