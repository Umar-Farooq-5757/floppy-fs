import Dexie, { type Table } from "dexie";

export interface FileMetadata {
  id: string;
  title: string;
  parentId: string | null; // ID of parent folder (null = root directory)
  type: "file" | "folder";
  hash?: string; // Content hash (only present for files)
  createdAt: Date;
  updatedAt: Date;
}

export interface FileContent {
  hash: string;
  content: string;
}

export class FileSystemDB extends Dexie {
  nodes!: Table<FileMetadata, string>;
  contents!: Table<FileContent, string>;

  constructor() {
    super("FloppyFileSystemDB");
    this.version(1).stores({
      // Primary Key: id
      // Indexes: parentId, title, hash, compound [parentId+title] for name lookups
      nodes: "id, parentId, title, hash, [parentId+title]",

      // Primary Key: hash
      contents: "hash",
    });
  }
}

export const db = new FileSystemDB();
