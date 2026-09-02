import React, { useEffect, useMemo, useState } from "react";
import { IoGridOutline, IoInformationCircleOutline } from "react-icons/io5";
import { FaList } from "react-icons/fa";
import NewNodeModal from "./NewNodeModal";
import RenameNodeModal from "./RenameNodeModal";
import {
  createFile,
  formatFileSize,
  getFolderSize,
} from "../db/fileOperations";
import { useAppContext } from "../context/AppContext";
import moment from "moment";
import Toolbar from "./Toolbar";
import { MdOutlineFileUpload } from "react-icons/md";

type SortBy = "name" | "date" | "size";

/**
 * File types supported by the browser filesystem.
 */
const SUPPORTED_EXTENSIONS = new Set([
  // Images
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
  "avif",

  // Videos
  "mp4",
  "webm",
  "mov",
  "avi",
  "mkv",

  // Audio
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "aac",
  "flac",

  // Text
  "txt",

  // Documents
  "pdf",
  "doc",
  "docx",
]);

/**
 * Get a file extension safely.
 *
 * Examples:
 * image.png -> png
 * report.final.pdf -> pdf
 * README -> ""
 */
const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
};

/**
 * Check whether a file is supported.
 *
 * We use both MIME type and extension because some browsers
 * provide an empty MIME type for certain document files.
 */
const isSupportedFile = (file: File): boolean => {
  const extension = getFileExtension(file.name);

  if (SUPPORTED_EXTENSIONS.has(extension)) {
    return true;
  }

  const mimeType = file.type.toLowerCase();

  if (
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/") ||
    mimeType.startsWith("audio/")
  ) {
    return true;
  }

  return (
    mimeType === "text/plain" ||
    mimeType === "application/pdf" ||
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
};

/**
 * Resolve a MIME type when the browser does not provide one.
 */
const getResolvedMimeType = (file: File): string => {
  if (file.type) {
    return file.type;
  }

  const extension = getFileExtension(file.name);

  const extensionMimeTypes: Record<string, string> = {
    txt: "text/plain",

    pdf: "application/pdf",

    doc: "application/msword",

    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    avif: "image/avif",

    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",

    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    flac: "audio/flac",
  };

  return extensionMimeTypes[extension] || "application/octet-stream";
};

export const FileExplorer: React.FC = () => {
  const {
    currentFolderId,
    setCurrentFolderId,
    isNewNodeModalOpen,
    setIsNewNodeModalOpen,
    isRenameNodeModalOpen,
    setIsRenameNodeModalOpen,
    renameNodeId,
    setRenameNodeId,
    openNodeMenu,
    handleOpenFile,
    creatingFileOrFolder,
    setCreatingFileOrFolder,
    currentItems,
    showFileExtensions,
    setShowFileExtensions,
  } = useAppContext();

  /* --------------------------------------------------
   * LOCAL STATE
   * ------------------------------------------------ */

  const [searchValue, setSearchValue] = useState("");

  const [viewType, setViewType] = useState<"grid" | "list">("list");

  const [sortBy, setSortBy] = useState<SortBy>("name");

  /*
   * Stores calculated sizes.
   *
   * Files use their stored size.
   * Folders use recursively calculated sizes.
   */
  const [itemSizes, setItemSizes] = useState<Record<string, number>>({});

  /*
   * Upload progress modal state.
   */
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [uploadFileName, setUploadFileName] = useState<string | null>(null);

  /*
   * Drag state.
   *
   * Used to provide visual feedback when files
   * are dragged over the explorer.
   */
  const [isDragging, setIsDragging] = useState(false);

  /* --------------------------------------------------
   * LOAD FILE / FOLDER SIZES
   * ------------------------------------------------ */

  useEffect(() => {
    let isCancelled = false;

    const loadSizes = async () => {
      if (!currentItems) {
        if (!isCancelled) {
          setItemSizes({});
        }

        return;
      }

      try {
        const sizes: Record<string, number> = {};

        await Promise.all(
          currentItems.map(async (item) => {
            if (item.type === "file") {
              sizes[item.id] = item.size ?? 0;
              return;
            }

            sizes[item.id] = await getFolderSize(item.id);
          }),
        );

        if (!isCancelled) {
          setItemSizes(sizes);
        }
      } catch (error) {
        console.error("Failed to calculate item sizes:", error);
      }
    };

    void loadSizes();

    return () => {
      isCancelled = true;
    };
  }, [currentItems]);

  /* --------------------------------------------------
   * FILTER + SORT
   * ------------------------------------------------ */

  const filteredItems = useMemo(() => {
    if (!currentItems) {
      return [];
    }

    const search = searchValue.trim().toLowerCase();

    return [...currentItems]
      .filter((item) => item.title.toLowerCase().includes(search))
      .sort((a, b) => {
        /*
         * Keep folders above files.
         */
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1;
        }

        if (sortBy === "name") {
          return a.title.localeCompare(b.title, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        }

        if (sortBy === "date") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        /*
         * Sort by size, largest first.
         */
        const sizeDifference = (itemSizes[b.id] ?? 0) - (itemSizes[a.id] ?? 0);

        /*
         * Stable alphabetical fallback.
         */
        if (sizeDifference === 0) {
          return a.title.localeCompare(b.title, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        }

        return sizeDifference;
      });
  }, [currentItems, searchValue, sortBy, itemSizes]);

  /* --------------------------------------------------
   * IMPORT FILE
   * ------------------------------------------------ */

  const handleImportFile = async (file: File): Promise<void> => {
    if (!isSupportedFile(file)) {
      const extension = getFileExtension(file.name);

      throw new Error(
        `Unsupported file "${file.name}". ${
          extension
            ? `The .${extension} file format is not supported.`
            : "The file does not have a supported extension."
        }`,
      );
    }

    try {
      setUploadFileName(file.name);

      setUploadProgress(0);

      const resolvedMimeType = getResolvedMimeType(file);

      await createFile(
        currentFolderId,
        file.name,
        file,
        resolvedMimeType,
        (progress) => {
          setUploadProgress(progress);
        },
      );

      setUploadProgress(100);

      /*
       * Keep completed progress visible briefly.
       */
      window.setTimeout(() => {
        setUploadProgress(null);
        setUploadFileName(null);
      }, 600);
    } catch (error) {
      console.error(`Failed to import ${file.name}:`, error);

      setUploadProgress(null);
      setUploadFileName(null);

      throw error;
    }
  };

  /* --------------------------------------------------
   * DRAG AND DROP
   * ------------------------------------------------ */

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    /*
     * Only hide the overlay when the pointer
     * actually leaves the explorer.
     */
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);

    for (const file of files) {
      if (!isSupportedFile(file)) {
        console.warn(`Skipped ${file.name}: This file type is not supported.`);

        continue;
      }

      try {
        await handleImportFile(file);
      } catch (error) {
        console.error(`Failed to import ${file.name}:`, error);
      }
    }
  };

  /* --------------------------------------------------
   * ICON HELPERS
   * ------------------------------------------------ */

  const renderIcon = (mimeType?: string) => {
    if (!mimeType) {
      return "/img/anonymous.png";
    }

    if (mimeType.startsWith("image/")) {
      return "/img/image.png";
    }

    if (mimeType.startsWith("video/")) {
      return "/img/video.png";
    }

    if (mimeType.startsWith("audio/")) {
      return "/img/mp3.png";
    }

    if (mimeType === "text/plain") {
      return "/img/textfile.png";
    }

    if (mimeType === "application/pdf") {
      return "/img/pdf.png";
    }

    if (
      mimeType === "application/msword" ||
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "/img/document.png";
    }

    return "/img/anonymous.png";
  };

  /* --------------------------------------------------
   * FILE EXTENSION DISPLAY
   * ------------------------------------------------ */

  const getDisplayName = (
    fileName: string,
    type: "file" | "folder",
    showExtension: boolean,
  ): string => {
    /*
     * Folder names always remain unchanged.
     */
    if (type === "folder" || showExtension) {
      return fileName;
    }

    const lastDotIndex = fileName.lastIndexOf(".");

    /*
     * No extension or hidden file.
     */
    if (lastDotIndex <= 0) {
      return fileName;
    }

    return fileName.slice(0, lastDotIndex);
  };

  /* --------------------------------------------------
   * RENDER
   * ------------------------------------------------ */

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative pb-16">
      {/* Drag and Drop Overlay */}

      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-[1px] pointer-events-none">
          <div className="rounded-lg border-2 border-dashed border-blue-500 bg-white/90 px-8 py-6 text-center shadow-lg">
            <MdOutlineFileUpload className="mx-auto mb-3 text-4xl text-blue-500" />

            <p className="font-medium">Drop files here to import</p>

            <p className="mt-1 text-xs text-black/60">
              Images, videos, audio, text files, PDFs and Word documents
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}

      <Toolbar
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        currentFolderId={currentFolderId}
        setCurrentFolderId={setCurrentFolderId}
        setIsNewNodeModalOpen={setIsNewNodeModalOpen}
        setCreatingFileOrFolder={setCreatingFileOrFolder}
        viewType={viewType}
        sortBy={sortBy}
        setSortBy={setSortBy}
        handleImportFile={handleImportFile}
        showFileExtensions={showFileExtensions}
        setShowFileExtensions={setShowFileExtensions}
      />

      {/* GRID VIEW */}

      {viewType === "grid" && (
        <div className="grid grid-cols-3 gap-2 px-3 py-5 select-none sm:grid-cols-4 sm:px-5 md:grid-cols-6 lg:grid-cols-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onContextMenu={(e) => openNodeMenu(e, item.id)}
              onDoubleClick={async () => {
                if (item.type === "folder") {
                  setCurrentFolderId(item.id);
                } else {
                  await handleOpenFile(item);
                }
              }}
              className="flex cursor-default flex-col items-center rounded-sm p-2 text-center text-sm hover:bg-black/5 active:bg-black/8">
              <img
                className="size-16 object-contain sm:size-20"
                src={
                  item.type === "folder"
                    ? "/img/folder.png"
                    : renderIcon(item.mimeType)
                }
                alt={item.type === "folder" ? "Folder" : "File"}
              />

              <span className="mt-1 w-full truncate text-xs">
                {getDisplayName(item.title, item.type, showFileExtensions)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}

      {viewType === "list" && (
        <div className="px-3 py-5 select-none sm:px-5">
          {/* Table Header */}

          <div className="grid grid-cols-12 border-b border-black/10 px-3 py-2 text-xs font-semibold text-black/60">
            <div className="col-span-6 sm:col-span-4">Name</div>

            <div className="hidden sm:col-span-3 sm:block">Type</div>

            <div className="col-span-3 text-right sm:col-span-2">Size</div>

            <div className="col-span-3 text-right">Created</div>
          </div>

          {/* Table Rows */}

          <div className="mt-1 space-y-0.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onContextMenu={(e) => openNodeMenu(e, item.id)}
                onDoubleClick={async () => {
                  if (item.type === "folder") {
                    setCurrentFolderId(item.id);
                  } else {
                    await handleOpenFile(item);
                  }
                }}
                className="grid cursor-default grid-cols-12 items-center rounded-sm px-3 py-1.5 text-sm hover:bg-black/5 active:bg-black/8">
                {/* Name */}

                <div className="col-span-6 flex min-w-0 items-center gap-3 pr-2 sm:col-span-4">
                  <img
                    className="size-5 shrink-0 object-contain"
                    src={
                      item.type === "folder"
                        ? "/img/folder.png"
                        : renderIcon(item.mimeType)
                    }
                    alt={item.type === "folder" ? "Folder" : "File"}
                  />

                  <span className="truncate text-xs sm:text-sm">
                    {getDisplayName(item.title, item.type, showFileExtensions)}
                  </span>
                </div>

                {/* Type */}

                <div className="hidden truncate pr-2 text-xs text-black/70 sm:col-span-3 sm:block">
                  {item.type === "folder"
                    ? "File folder"
                    : item.mimeType || "Unknown"}
                </div>

                {/* Size */}

                <div className="col-span-3 truncate pr-2 text-right text-xs text-black/70 sm:col-span-2">
                  {formatFileSize(itemSizes[item.id] ?? 0)}
                </div>

                {/* Date */}

                <div className="col-span-3 truncate text-right text-xs text-black/70">
                  {moment(item.createdAt).fromNow()}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}

          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-sm text-black/50">
              {searchValue
                ? "No matching files or folders found."
                : "This folder is empty."}
            </div>
          )}
        </div>
      )}

      {/* LIST / GRID VIEW TOGGLE */}

      <div className="fixed bottom-0 right-0 left-0 z-10 flex items-center justify-between border-t border-black/5 bg-white/80 px-3 py-2 backdrop-blur-xs sm:px-10">
        <div className="flex items-center gap-2 text-xs opacity-70">
          <IoInformationCircleOutline />

          <div>
            <p>Right-click to open context menu</p>
            <p>Right-click on file/folder to perform actions</p>
          </div>
        </div>

        <div className="flex items-center rounded-sm bg-black/4 px-2 py-1">
          <button
            type="button"
            onClick={() => setViewType("grid")}
            title="Grid view"
            className={`rounded-sm px-2 py-1 ${
              viewType === "grid" ? "bg-black/12" : "hover:bg-black/7"
            }`}>
            <IoGridOutline size="19" />
          </button>

          <button
            type="button"
            onClick={() => setViewType("list")}
            title="List view"
            className={`rounded-sm px-2 py-1 ${
              viewType === "list" ? "bg-black/12" : "hover:bg-black/7"
            }`}>
            <FaList size="19" />
          </button>
        </div>
      </div>

      {/* NEW FILE / FOLDER MODAL */}

      {isNewNodeModalOpen && (
        <NewNodeModal
          creatingFileOrFolder={creatingFileOrFolder}
          onClose={() => setIsNewNodeModalOpen(false)}
          currentFolderId={currentFolderId}
        />
      )}

      {/* RENAME MODAL */}

      {isRenameNodeModalOpen && renameNodeId && (
        <RenameNodeModal
          onClose={() => {
            setIsRenameNodeModalOpen(false);
            setRenameNodeId(null);
          }}
        />
      )}

      {/* UPLOAD PROGRESS MODAL */}

      {uploadProgress !== null && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-xl">
            <div className="border-b border-black/10 px-4 py-3">
              <p className="text-sm font-medium">Importing file</p>
            </div>

            <div className="p-4">
              <div className="mb-2 flex items-center justify-between gap-4">
                <p className="min-w-0 truncate text-sm">{uploadFileName}</p>

                <span className="shrink-0 text-sm font-medium">
                  {uploadProgress}%
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full bg-blue-500 duration-150 ease-out"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-black/55">
                {uploadProgress === 100
                  ? "Import completed."
                  : "Please wait while your file is being imported..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FileExplorer;
