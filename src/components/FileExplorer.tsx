import React, { useState } from "react";
import { IoArrowBackOutline } from "react-icons/io5";
import { VscNewFile, VscNewFolder } from "react-icons/vsc";
import { IoIosSearch } from "react-icons/io";
import { FaAngleRight } from "react-icons/fa";
import { MdOutlineFileUpload } from "react-icons/md";
import NewNodeModal from "./NewNodeModal";
import RenameNodeModal from "./RenameNodeModal";
import { createFile } from "../db/fileOperations";
import { useAppContext } from "../context/AppContext";

interface ToolbarProps {
  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  currentFolderId: string | null;
  setCurrentFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsNewNodeModalOpen: (isOpen: boolean) => void;
  setCreatingFileOrFolder: React.Dispatch<
    React.SetStateAction<"file" | "folder">
  >;
}

const Toolbar: React.FC<ToolbarProps> = ({
  searchValue,
  setSearchValue,
  currentFolderId,
  setCurrentFolderId,
  setIsNewNodeModalOpen,
  setCreatingFileOrFolder,
}) => {
  const { breadCrumb, currentFolder } = useAppContext();
  return (
    <>
      <section className="px-3 py-2 bg-black/4 border border-black/4 flex flex-wrap items-center gap-2">
        <div
          onClick={() => {
            setCreatingFileOrFolder("file");
            setIsNewNodeModalOpen(true);
          }}
          className="flex items-center cursor-default gap-2 hover:bg-black/4 w-fit py-1 px-2 rounded-xs">
          <VscNewFile />
          <p className="text-sm">New File</p>
        </div>
        <div
          onClick={() => {
            setCreatingFileOrFolder("folder");
            setIsNewNodeModalOpen(true);
          }}
          className="flex items-center cursor-default gap-2 hover:bg-black/4 w-fit py-1 px-2 rounded-xs">
          <VscNewFolder />
          <p className="text-sm">New Folder</p>
        </div>
        <label className="flex items-center cursor-default gap-2 hover:bg-black/4 w-fit py-1 px-2 rounded-xs">
          <MdOutlineFileUpload />
          <p className="text-sm">
            Import File <span className="hidden sm:inline">(image, video)</span>
          </p>
          <input
            type="file"
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (
                !file.type.startsWith("image/") &&
                !file.type.startsWith("video/")
              ) {
                console.error("Only image and video files are allowed.");
                e.target.value = "";
                return;
              }
              try {
                await createFile(currentFolderId, file.name, file, file.type);
              } catch (error) {
                console.error("Failed to import file:", error);
              } finally {
                e.target.value = "";
              }
            }}
          />
        </label>
      </section>
      <section className="px-3 py-2 flex items-center gap-3 w-full">
        <button
          onClick={() => setCurrentFolderId(currentFolder?.parentId ?? null)}
          disabled={currentFolderId === null}
          className="hover:bg-black/10 p-2 sm:px-2 sm:py-2 rounded-xs disabled:opacity-40 shrink-0">
          <IoArrowBackOutline />
        </button>
        <div className="flex border border-black/25 py-1 px-2 grow items-center overflow-x-auto whitespace-nowrap cursor-default min-w-0">
          {breadCrumb.map((item, idx) => (
            <div
              onClick={() => setCurrentFolderId(item.folderId)}
              key={`${item.folderId ?? "root"}-${idx}`}
              className="flex items-center hover:bg-black/7 mx-0.5 px-0.5 min-w-0">
              <span className="truncate">{item.folderName}</span>
              <FaAngleRight className="opacity-70 shrink-0" />
            </div>
          ))}
        </div>
        <div className="border border-black/25 hidden sm:flex items-center gap-2 py-1 px-2 w-64 shrink-0">
          <IoIosSearch />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="outline-none w-full bg-transparent"
            type="text"
            placeholder="Search..."
          />
        </div>
      </section>
      {/* Mobile search bar fallback row */}
      <section className="px-3 pb-2 sm:hidden flex items-center">
        <div className="border border-black/25 flex items-center gap-2 py-1 px-2 w-full">
          <IoIosSearch />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="outline-none w-full bg-transparent"
            type="text"
            placeholder="Search..."
          />
        </div>
      </section>
    </>
  );
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
  } = useAppContext();

  const [searchValue, setSearchValue] = useState("");

  const filteredItems = currentItems?.filter((item) =>
    item.title.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);

    for (const file of files) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        console.warn(
          `Skipped ${file.name}: Only image and video files are allowed.`,
        );
        continue;
      }

      try {
        await createFile(currentFolderId, file.name, file, file.type);
      } catch (error) {
        console.error(`Failed to import ${file.name}:`, error);
      }
    }
  };

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
    if (mimeType === "text/plain") {
      return "/img/textfile.png";
    }
    if (mimeType === "application/pdf") {
      return "/img/pdf.png";
    }
    return "/img/anonymous.png";
  };
  return (
    <section onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <Toolbar
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        currentFolderId={currentFolderId}
        setCurrentFolderId={setCurrentFolderId}
        setIsNewNodeModalOpen={setIsNewNodeModalOpen}
        setCreatingFileOrFolder={setCreatingFileOrFolder}
      />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 px-3 sm:px-5 py-5 select-none gap-0">
        {filteredItems?.map((item) => (
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
            className="flex flex-col items-center text-sm hover:bg-black/5 p-2 px-0 rounded-sm text-center">
            {item.type === "folder" ? (
              <img
                className="size-16 sm:size-22 object-contain"
                src="/img/folder.png"
                alt="folder icon"
              />
            ) : (
              <img
                className="size-16 sm:size-22 object-contain"
                src={renderIcon(item.mimeType)}
                alt="file icon"
              />
            )}
            <span className="truncate w-full text-xs mt-1">{item.title}</span>
          </div>
        ))}
      </div>
      
      {isNewNodeModalOpen && (
        <NewNodeModal
          creatingFileOrFolder={creatingFileOrFolder}
          onClose={() => setIsNewNodeModalOpen(false)}
          currentFolderId={currentFolderId}
        />
      )}
      {isRenameNodeModalOpen && renameNodeId && (
        <RenameNodeModal
          onClose={() => {
            setIsRenameNodeModalOpen(false);
            setRenameNodeId(null);
          }}
        />
      )}
    </section>
  );
};

export default FileExplorer;

/**
 * Features for future:
 * Sidebar Navigation Pane: A left-hand tree view for quick directory navigation, mimicking Windows Explorer's folder tree and quick access shortcuts.
 * List & Details View: Add a toggle between the current grid view and a detailed tabular view showing columns for File Name, File Size, Type, and Date Modified.
 * Dynamic Sorting & Filtering: Allow users to sort items by name, size, type, or date modified in ascending or descending order.
 */
