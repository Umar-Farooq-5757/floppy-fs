import { db, type FileMetadata } from "./db";

/* ----------------------------------------------------
 * CONSTANTS
 * -------------------------------------------------- */

const INVALID_NAME_CHARACTERS = /[\/\\]/;

/* ----------------------------------------------------
 * NAME HELPERS
 * -------------------------------------------------- */

/**
 * Trims a node title.
 */
const normalizeTitle = (title: string): string => {
  return title.trim();
};

/**
 * Validates a file or folder name.
 */
const validateNodeTitle = (title: string): string => {
  const normalizedTitle = normalizeTitle(title);
  if (!normalizedTitle) {
    throw new Error("File or folder name cannot be empty.");
  }
  if (normalizedTitle === "." || normalizedTitle === "..") {
    throw new Error("This name is not allowed.");
  }
  if (INVALID_NAME_CHARACTERS.test(normalizedTitle)) {
    throw new Error("Name cannot contain / or \\.");
  }
  return normalizedTitle;
};

/**
 * Finds a node with a particular name inside a folder.
 *
 * IMPORTANT:
 * We intentionally use filter() here instead of querying
 * the [parentId+title] compound index.
 *
 * IndexedDB does not accept null as a valid key for the
 * compound index query, while this filesystem uses:
 *
 * parentId === null
 *
 * for root-level files and folders.
 */
const findNodeByName = async (
  parentId: string | null,
  title: string,
): Promise<FileMetadata | undefined> => {
  return db.nodes
    .filter((node) => node.parentId === parentId && node.title === title)
    .first();
};

/**
 * Throws an error if another node with the same name
 * already exists inside the target folder.
 */
const ensureUniqueName = async (
  parentId: string | null,
  title: string,
  ignoreNodeId?: string,
): Promise<void> => {
  const existingNode = await findNodeByName(parentId, title);
  if (existingNode && existingNode.id !== ignoreNodeId) {
    throw new Error(
      `A file or folder named "${title}" already exists in this location.`,
    );
  }
};

/* ----------------------------------------------------
 * HASH HELPERS
 * -------------------------------------------------- */

/**
 * Calculate SHA-256 hash for file content.
 *
 * Used for content deduplication.
 */
export const calculateHash = async (data: string | Blob): Promise<string> => {
  let arrayBuffer: ArrayBuffer;
  if (typeof data === "string") {
    arrayBuffer = new TextEncoder().encode(data).buffer;
  } else {
    arrayBuffer = await data.arrayBuffer();
  }
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

/* ----------------------------------------------------
 * MIME TYPE HELPERS
 * -------------------------------------------------- */

/**
 * Infer MIME type from file extension.
 */
export const getMimeType = (
  fileName: string,
  providedType?: string,
): string => {
  if (providedType && providedType.trim() !== "") {
    return providedType;
  }
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  switch (extension) {
    /* Images */
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "bmp":
      return "image/bmp";
    case "ico":
      return "image/x-icon";
    /* Videos */
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogg":
      return "video/ogg";
    case "mov":
      return "video/quicktime";
    case "avi":
      return "video/x-msvideo";
    /* Audio */
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "m4a":
      return "audio/mp4";
    /* Text */
    case "txt":
      return "text/plain";
    case "md":
      return "text/markdown";
    case "json":
      return "application/json";
    case "html":
    case "htm":
      return "text/html";
    case "css":
      return "text/css";
    case "js":
    case "mjs":
      return "text/javascript";
    case "ts":
      return "text/typescript";
    case "tsx":
      return "text/tsx";
    case "jsx":
      return "text/jsx";
    /* Documents */
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
};

/* ----------------------------------------------------
 * CREATE FOLDER
 * -------------------------------------------------- */

export const createFolder = async (
  parentId: string | null,
  title: string,
): Promise<string> => {
  const normalizedTitle = validateNodeTitle(title);
  await ensureUniqueName(parentId, normalizedTitle);
  const id = crypto.randomUUID();
  const now = new Date();
  await db.nodes.add({
    id,
    parentId,
    title: normalizedTitle,
    type: "folder",
    createdAt: now,
    updatedAt: now,
  });
  return id;
};

/* ----------------------------------------------------
 * CREATE FILE
 * -------------------------------------------------- */

export const createFile = async (
  parentId: string | null,
  title: string,
  content: string | Blob = "",
  overrideMimeType?: string,
): Promise<string> => {
  const normalizedTitle = validateNodeTitle(title);
  await ensureUniqueName(parentId, normalizedTitle);
  const id = crypto.randomUUID();
  const hash = await calculateHash(content);
  const now = new Date();
  const mimeType = getMimeType(
    normalizedTitle,
    overrideMimeType || (content instanceof Blob ? content.type : "text/plain"),
  );
  await db.transaction("rw", [db.nodes, db.contents], async () => {
    /*
     * Store content by hash.
     *
     * put() makes this safe for duplicate content.
     */
    await db.contents.put({
      hash,
      content,
    });
    await db.nodes.add({
      id,
      parentId,
      title: normalizedTitle,
      type: "file",
      hash,
      mimeType,
      createdAt: now,
      updatedAt: now,
    });
  });
  return id;
};

/* ----------------------------------------------------
 * READ FILE CONTENT
 * -------------------------------------------------- */

export const getFileContentByHash = async (
  hash: string,
): Promise<string | Blob | undefined> => {
  if (!hash) {
    return undefined;
  }
  const record = await db.contents.get(hash);
  return record?.content;
};

/* ----------------------------------------------------
 * RENAME NODE
 * -------------------------------------------------- */

export const renameNode = async (
  id: string,
  newTitle: string,
): Promise<void> => {
  if (!id) {
    throw new Error("Invalid node ID.");
  }
  const normalizedTitle = validateNodeTitle(newTitle);
  await db.transaction("rw", db.nodes, async () => {
    const node = await db.nodes.get(id);
    if (!node) {
      throw new Error("File or folder not found.");
    }
    /*
     * Do nothing if the name was not changed.
     */
    if (node.title === normalizedTitle) {
      return;
    }
    /*
     * Check for duplicate names.
     *
     * This uses findNodeByName(), which is safe
     * when parentId is null.
     */
    await ensureUniqueName(node.parentId, normalizedTitle, node.id);
    const updatedCount = await db.nodes.update(id, {
      title: normalizedTitle,
      updatedAt: new Date(),
    });
    if (updatedCount === 0) {
      throw new Error("Failed to rename file or folder.");
    }
  });
};

/* ----------------------------------------------------
 * MOVE NODE
 * -------------------------------------------------- */

export const moveNode = async (
  id: string,
  newParentId: string | null,
): Promise<void> => {
  if (!id) {
    throw new Error("Invalid node ID.");
  }
  await db.transaction("rw", db.nodes, async () => {
    const node = await db.nodes.get(id);
    if (!node) {
      throw new Error("File or folder not found.");
    }
    /*
     * A node cannot be its own parent.
     */
    if (id === newParentId) {
      throw new Error("A node cannot be moved into itself.");
    }
    /*
     * If a target parent is provided, ensure it exists
     * and is actually a folder.
     */
    if (newParentId !== null) {
      const targetParent = await db.nodes.get(newParentId);
      if (!targetParent) {
        throw new Error("Destination folder not found.");
      }
      if (targetParent.type !== "folder") {
        throw new Error("Files cannot contain other files.");
      }
    }
    /*
     * Prevent duplicate names in destination.
     */
    await ensureUniqueName(newParentId, node.title, node.id);
    /*
     * Prevent moving a folder into one of its own
     * descendants.
     */
    if (node.type === "folder" && newParentId !== null) {
      let currentParentId: string | null = newParentId;
      while (currentParentId !== null) {
        if (currentParentId === id) {
          throw new Error(
            "A folder cannot be moved into one of its own subfolders.",
          );
        }
        const currentParent: FileMetadata | undefined =
          await db.nodes.get(currentParentId);
        if (!currentParent) {
          break;
        }
        currentParentId = currentParent.parentId;
      }
    }
    const updatedCount = await db.nodes.update(id, {
      parentId: newParentId,
      updatedAt: new Date(),
    });
    if (updatedCount === 0) {
      throw new Error("Failed to move node.");
    }
  });
};

/* ----------------------------------------------------
 * UPDATE FILE CONTENT
 * -------------------------------------------------- */

export const updateFileContent = async (
  id: string,
  newContent: string,
): Promise<void> => {
  const file = await db.nodes.get(id);
  if (!file) {
    throw new Error("File not found.");
  }
  if (file.type !== "file") {
    throw new Error("Folders do not have editable file content.");
  }
  const oldHash = file.hash;
  const newHash = await calculateHash(newContent);
  await db.transaction("rw", [db.nodes, db.contents], async () => {
    /*
     * Store the new content.
     */
    await db.contents.put({
      hash: newHash,
      content: newContent,
    });
    /*
     * Update the file metadata.
     */
    const updatedCount = await db.nodes.update(id, {
      hash: newHash,
      updatedAt: new Date(),
    });
    if (updatedCount === 0) {
      throw new Error("Failed to update file.");
    }
    /*
     * Garbage-collect old content if no other file
     * references it.
     */
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

/* ----------------------------------------------------
 * DELETE NODE
 * -------------------------------------------------- */

/**
 * Internal recursive delete function.
 *
 * This function assumes that the caller already opened
 * the transaction.
 */
const deleteNodeRecursive = async (id: string): Promise<void> => {
  const node = await db.nodes.get(id);
  if (!node) {
    return;
  }
  /*
   * Recursively delete folder children.
   */
  if (node.type === "folder") {
    const children = await db.nodes.where("parentId").equals(id).toArray();
    for (const child of children) {
      await deleteNodeRecursive(child.id);
    }
  }
  /*
   * Delete file content only when this file is the
   * final reference to its hash.
   */
  if (node.type === "file" && node.hash) {
    const references = await db.nodes.where("hash").equals(node.hash).count();
    /*
     * The current node is still present at this point,
     * so <= 1 means no other file references it.
     */
    if (references <= 1) {
      await db.contents.delete(node.hash);
    }
  }
  await db.nodes.delete(id);
};

/**
 * Deletes a file or folder recursively.
 */
export const deleteNode = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error("Invalid node ID.");
  }
  await db.transaction("rw", [db.nodes, db.contents], async () => {
    await deleteNodeRecursive(id);
  });
};

/* ----------------------------------------------------
 * COPY NODE
 * -------------------------------------------------- */

/**
 * Splits a filename into its name and extension.
 *
 * Examples:
 * "photo.png" -> ["photo", ".png"]
 * "archive.tar.gz" -> ["archive.tar", ".gz"]
 * "README" -> ["README", ""]
 */
const splitFileName = (
  title: string,
): {
  name: string;
  extension: string;
} => {
  const lastDotIndex = title.lastIndexOf(".");
  /*
   * No extension or hidden file such as ".gitignore".
   */
  if (lastDotIndex <= 0) {
    return {
      name: title,
      extension: "",
    };
  }
  return {
    name: title.slice(0, lastDotIndex),
    extension: title.slice(lastDotIndex),
  };
};

/**
 * Generates a unique name for a copied node.
 *
 * Examples:
 *
 * file.txt
 * file (Copy).txt
 * file (Copy 2).txt
 *
 * Folder
 * Folder (Copy)
 * Folder (Copy 2)
 */
const generateCopyTitle = async (
  parentId: string | null,
  originalTitle: string,
  type: "file" | "folder",
): Promise<string> => {
  let baseName = originalTitle;
  let extension = "";
  /*
   * Preserve file extensions when copying files.
   */
  if (type === "file") {
    const splitName = splitFileName(originalTitle);
    baseName = splitName.name;
    extension = splitName.extension;
  }
  let copyNumber = 1;
  while (true) {
    const candidateTitle =
      copyNumber === 1
        ? `${baseName} (Copy)${extension}`
        : `${baseName} (Copy ${copyNumber})${extension}`;
    const existingNode = await findNodeByName(parentId, candidateTitle);
    if (!existingNode) {
      return candidateTitle;
    }
    copyNumber += 1;
  }
};

/**
 * Internal recursive copy function.
 *
 * Copies a node and, when the node is a folder,
 * recursively copies all of its descendants.
 *
 * Returns the ID of the newly created node.
 *
 * IMPORTANT:
 * This function assumes the caller already opened
 * the Dexie transaction.
 */
const copyNodeRecursive = async (
  sourceId: string,
  targetParentId: string | null,
  useCopyName: boolean,
): Promise<string> => {
  const sourceNode = await db.nodes.get(sourceId);
  if (!sourceNode) {
    throw new Error("Source file or folder not found.");
  }
  const newId = crypto.randomUUID();
  const now = new Date();
  /*
   * The root copied node receives a unique "Copy" name.
   *
   * Children inside the copied folder keep their original
   * names because they are being copied into a newly created
   * folder hierarchy.
   */
  const newTitle = useCopyName
    ? await generateCopyTitle(targetParentId, sourceNode.title, sourceNode.type)
    : sourceNode.title;
  /*
   * Create the copied folder.
   */
  if (sourceNode.type === "folder") {
    await db.nodes.add({
      id: newId,
      parentId: targetParentId,
      title: newTitle,
      type: "folder",
      createdAt: now,
      updatedAt: now,
    });

    /*
     * Copy every child recursively.
     */
    const children = await db.nodes
      .where("parentId")
      .equals(sourceNode.id)
      .toArray();
    for (const child of children) {
      await copyNodeRecursive(child.id, newId, false);
    }
    return newId;
  }

  /*
   * Copy a file.
   *
   * The content itself does not need to be duplicated.
   * Multiple file metadata records can safely reference
   * the same content hash.
   *
   * This works perfectly with your existing content
   * deduplication and garbage collection system.
   */
  if (!sourceNode.hash) {
    throw new Error("Cannot copy this file because its content is missing.");
  }
  const contentExists = await db.contents.get(sourceNode.hash);
  if (!contentExists) {
    throw new Error(
      "Cannot copy this file because its stored content is missing.",
    );
  }
  await db.nodes.add({
    id: newId,
    parentId: targetParentId,
    title: newTitle,
    type: "file",
    hash: sourceNode.hash,
    mimeType: sourceNode.mimeType,
    createdAt: now,
    updatedAt: now,
  });
  return newId;
};

/**
 * Copies a file or folder into another folder.
 *
 * Files reuse the same content hash because the filesystem
 * already supports content deduplication.
 *
 * Folders are copied recursively with new IDs for every
 * copied node.
 *
 * The returned value is the ID of the newly copied root node.
 */
export const copyNode = async (
  id: string,
  newParentId: string | null,
): Promise<string> => {
  if (!id) {
    throw new Error("Invalid source node ID.");
  }

  return db.transaction("rw", [db.nodes, db.contents], async () => {
    const sourceNode = await db.nodes.get(id);
    if (!sourceNode) {
      throw new Error("File or folder not found.");
    }
    /*
     * Validate destination.
     */
    if (newParentId !== null) {
      const targetParent = await db.nodes.get(newParentId);
      if (!targetParent) {
        throw new Error("Destination folder not found.");
      }
      if (targetParent.type !== "folder") {
        throw new Error("Files cannot contain other files or folders.");
      }
    }
    /*
     * Prevent copying a node directly into itself.
     */
    if (id === newParentId) {
      throw new Error("A folder cannot be copied into itself.");
    }
    /*
     * Prevent copying a folder into one of its descendants.
     */
    if (sourceNode.type === "folder" && newParentId !== null) {
      let currentParentId: string | null = newParentId;

      while (currentParentId !== null) {
        if (currentParentId === id) {
          throw new Error(
            "A folder cannot be copied into one of its own subfolders.",
          );
        }
        const currentParent: FileMetadata | undefined =
          await db.nodes.get(currentParentId);

        if (!currentParent) {
          break;
        }
        currentParentId = currentParent.parentId;
      }
    }
    return copyNodeRecursive(id, newParentId, true);
  });
};
