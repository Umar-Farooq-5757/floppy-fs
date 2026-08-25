import { db } from "./db";

// Helper: Calculate SHA-256 hash for content deduplication
export const calculateHash = async (data: string | Blob): Promise<string> => {
  let arrayBuffer: ArrayBuffer;
  if (typeof data === "string") {
    arrayBuffer = new TextEncoder().encode(data).buffer;
  } else {
    arrayBuffer = await data.arrayBuffer();
  }
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Helper: Infer MIME type from file extension
export const getMimeType = (
  fileName: string,
  providedType?: string,
): string => {
  if (providedType && providedType !== "") return providedType;

  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
};

// ----------------------------------------------------
// CREATE Operations
// ----------------------------------------------------
export async function createFolder(parentId: string | null, title: string) {
  const id = crypto.randomUUID();
  const now = new Date();

  await db.nodes.add({
    id,
    parentId,
    title,
    type: "folder",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export const createFile = async (
  parentId: string | null,
  title: string,
  content: string | Blob = "",
  overrideMimeType?: string,
) => {
  const id = crypto.randomUUID();
  const hash = await calculateHash(content);
  const now = new Date();
  const mimeType = getMimeType(
    title,
    overrideMimeType || (content instanceof Blob ? content.type : "text/plain"),
  );

  // Dexie transaction ensures atomic write across both tables
  await db.transaction("rw", [db.nodes, db.contents], async () => {
    // Store content by hash if it doesn't already exist
    await db.contents.put({ hash, content });

    // Store file metadata
    await db.nodes.add({
      id,
      parentId,
      title,
      type: "file",
      hash,
      mimeType,
      createdAt: now,
      updatedAt: now,
    });
  });

  return id;
};

// ----------------------------------------------------
// READ Operations
// ----------------------------------------------------

export const getFileContentByHash = async (
  hash: string,
): Promise<string | undefined | Blob> => {
  const record = await db.contents.get(hash);
  return record?.content;
};

// ----------------------------------------------------
// UPDATE Operations
// ----------------------------------------------------

export const renameNode = async (id: string, newTitle: string) => {
  await db.nodes.update(id, {
    title: newTitle,
    updatedAt: new Date(),
  });
};

export const moveNode = async (id: string, newParentId: string | null) => {
  await db.nodes.update(id, {
    parentId: newParentId,
    updatedAt: new Date(),
  });
};

export const updateFileContent = async (id: string, newContent: string) => {
  const file = await db.nodes.get(id);
  if (!file || file.type !== "file") return;

  const oldHash = file.hash;
  const newHash = await calculateHash(newContent);

  await db.transaction("rw", [db.nodes, db.contents], async () => {
    // Save new content
    await db.contents.put({ hash: newHash, content: newContent });

    // Update metadata with new hash
    await db.nodes.update(id, {
      hash: newHash,
      updatedAt: new Date(),
    });

    // Cleanup old hash if no other file is referencing it (Garbage Collection)
    if (oldHash && oldHash !== newHash) {
      const remainingReferences = await db.nodes
        .where("hash")
        .equals(oldHash)
        .count();
      if (remainingReferences === 0) {
        await db.contents.delete(oldHash);
      }
    }
  });
};

// ----------------------------------------------------
// DELETE Operation (Recursive + Hash Cleanup)
// ----------------------------------------------------

export const deleteNode = async (id: string) => {
  await db.transaction("rw", [db.nodes, db.contents], async () => {
    const node = await db.nodes.get(id);
    if (!node) return;

    if (node.type === "folder") {
      const children = await db.nodes.where("parentId").equals(id).toArray();
      for (const child of children) {
        await deleteNode(child.id);
      }
    } else if (node.type === "file" && node.hash) {
      const otherFiles = await db.nodes
        .where("hash")
        .equals(node.hash)
        .toArray();
      if (otherFiles.length <= 1) {
        await db.contents.delete(node.hash);
      }
    }

    await db.nodes.delete(id);
  });
};
