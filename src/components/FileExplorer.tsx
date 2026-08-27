import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type FileMetadata } from "../db/db";
import { IoArrowBackOutline } from "react-icons/io5";
import { VscNewFile, VscNewFolder } from "react-icons/vsc";
import { IoIosSearch } from "react-icons/io";
import { FaAngleRight } from "react-icons/fa";
import { MdOutlineFileUpload } from "react-icons/md";
import Notepad from "./Notepad";
import ImageViewer from "./ImageViewer";
import NewNodeModal from "./NewNodeModal";
import RenameNodeModal from "./RenameNodeModal";
import { createFile } from "../db/fileOperations";
import { useAppContext } from "../context/AppContext";

export interface BreadCrumbItem {
  folderName: string;
  folderId: string | null;
}

interface ToolbarProps {
  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  currentFolder: any;
  currentFolderId: string | null;
  setCurrentFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsNewNodeModalOpen: (isOpen: boolean) => void;
  breadCrumb: BreadCrumbItem[];
  setCreatingFileOrFolder: React.Dispatch<
    React.SetStateAction<"file" | "folder">
  >;
}

const Toolbar: React.FC<ToolbarProps> = ({
  searchValue,
  setSearchValue,
  currentFolder,
  currentFolderId,
  setCurrentFolderId,
  setIsNewNodeModalOpen,
  breadCrumb,
  setCreatingFileOrFolder,
}) => {
  return (
    <>
      <section className="px-3 py-2 bg-black/4 border border-black/4 flex items-center gap-2">
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
          <p className="text-sm">Import File (image, video)</p>
          <input
            type="file"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) {
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
      <section className="px-3 py-2 flex gap-3">
        <button
          onClick={() => setCurrentFolderId(currentFolder?.parentId ?? null)}
          disabled={currentFolderId === null}
          className="hover:bg-black/10 px-2 rounded-xs disabled:opacity-40">
          <IoArrowBackOutline />
        </button>
        <div className="flex border border-black/25 py-1 px-2 grow cursor-default overflow-hidden">
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
        <div className="border border-black/25 flex items-center gap-2 py-1 px-1">
          <IoIosSearch />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="outline-none"
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
    isNewNodeModalOpen,
    setIsNewNodeModalOpen,
    isRenameNodeModalOpen,
    setIsRenameNodeModalOpen,
    renameNodeId,
    setRenameNodeId,
    openNodeMenu,
    activeFile,
    setActiveFile,
    handleOpenFile,
    creatingFileOrFolder,
    setCreatingFileOrFolder,
  } = useAppContext();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState("");

  const [breadCrumb, setBreadCrumb] = useState<BreadCrumbItem[]>([
    {
      folderName: "Home",
      folderId: null,
    },
  ]);

  const currentItems = useLiveQuery(() => {
    if (currentFolderId === null) {
      return db.nodes.filter((node) => node.parentId === null).toArray();
    }
    return db.nodes.where("parentId").equals(currentFolderId).toArray();
  }, [currentFolderId]);

  const filteredItems = currentItems?.filter((item) =>
    item.title.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const currentFolder = useLiveQuery(
    () => (currentFolderId ? db.nodes.get(currentFolderId) : undefined),
    [currentFolderId],
  );

  useEffect(() => {
    const updateBreadcrumb = async () => {
      if (!currentFolderId) {
        setBreadCrumb([
          {
            folderName: "Home",
            folderId: null,
          },
        ]);
        return;
      }
      const path: BreadCrumbItem[] = [];
      let currentId: string | null = currentFolderId;
      while (currentId !== null) {
        const folder: FileMetadata | undefined = await db.nodes.get(currentId);
        if (!folder) {
          break;
        }
        path.unshift({
          folderName: folder.title,
          folderId: folder.id,
        });
        currentId = folder.parentId;
      }
      setBreadCrumb([
        {
          folderName: "Home",
          folderId: null,
        },
        ...path,
      ]);
    };
    void updateBreadcrumb();
  }, [currentFolderId]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
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
        currentFolder={currentFolder}
        currentFolderId={currentFolderId}
        setCurrentFolderId={setCurrentFolderId}
        setIsNewNodeModalOpen={setIsNewNodeModalOpen}
        breadCrumb={breadCrumb}
        setCreatingFileOrFolder={setCreatingFileOrFolder}
      />
      <div className="flex px-5 py-5 select-none flex-wrap gap-4">
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
            className="flex flex-col items-center text-sm hover:bg-black/5 p-2 rounded-sm text-center">
            {item.type === "folder" ? (
              <img
                className="size-22 object-contain"
                src="/img/folder.png"
                alt="folder icon"
              />
            ) : (
              <img
                className="size-22 object-contain"
                src={renderIcon(item.mimeType)}
                alt="file icon"
              />
            )}
            <span className="truncate w-full text-xs mt-1">{item.title}</span>
          </div>
        ))}
      </div>
      {activeFile && activeFile.textContent !== undefined && (
        <Notepad
          key={activeFile.file.id}
          id={activeFile.file.id}
          title={activeFile.file.title}
          text={activeFile.textContent}
          setActiveFile={setActiveFile}
        />
      )}
      {activeFile && activeFile.objectUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {activeFile.file.mimeType?.startsWith("image/") && (
            <ImageViewer title={activeFile.file.title} />
          )}
          {activeFile.file.mimeType?.startsWith("video/") && (
            <video
              src={activeFile.objectUrl}
              controls
              className="max-h-[60vh]"
            />
          )}
        </div>
      )}
      {isNewNodeModalOpen && (
        <NewNodeModal
          creatingFileOrFolder={creatingFileOrFolder}
          onClose={() => setIsNewNodeModalOpen(false)}
          currentFolderId={currentFolderId}
        />
      )}
      {isRenameNodeModalOpen && renameNodeId && (
        <RenameNodeModal
          nodeId={renameNodeId}
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
