import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { IoArrowBackOutline } from "react-icons/io5";
import { VscNewFile, VscNewFolder } from "react-icons/vsc";
import Notepad from "./Notepad";
import NewFile from "./NewFile";
import { useAppContext } from "../context/AppContext";
import NewFolder from "./NewFolder";
import { IoIosSearch } from "react-icons/io";
import { FaAngleRight } from "react-icons/fa";
import { createFile } from "../db/fileOperations";
import { MdOutlineFileUpload } from "react-icons/md";
import ImageViewer from "./ImageViewer";

export interface BreadCrumbItem {
  folderName: string;
  folderId: string | null;
}

interface ToolbarProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  currentFolder: any;
  currentFolderId: string | null; // Fixed: allows null at root directory
  setCurrentFolderId: (id: string | null) => void;
  setIsNewFileModalOpen: (isOpen: boolean) => void;
  setIsNewFolderModalOpen: (isOpen: boolean) => void;
  breadCrumb: BreadCrumbItem[];
}

const Toolbar: React.FC<ToolbarProps> = ({
  searchValue,
  setSearchValue,
  currentFolder,
  currentFolderId,
  setCurrentFolderId,
  setIsNewFileModalOpen,
  setIsNewFolderModalOpen,
  breadCrumb,
}) => {
  return (
    <>
      <section className="px-3 py-2 bg-black/4 border border-black/4 flex items-center gap-2">
        <div
          onClick={() => setIsNewFileModalOpen(true)}
          className="flex items-center cursor-default gap-2 hover:bg-black/4 w-fit py-1 px-2 rounded-xs">
          <VscNewFile />
          <p className="text-sm">New File</p>
        </div>
        <div
          onClick={() => setIsNewFolderModalOpen(true)}
          className="flex items-center cursor-default gap-2 hover:bg-black/4 w-fit py-1 px-2 rounded-xs">
          <VscNewFolder />
          <p className="text-sm">New Folder</p>
        </div>
        <label className="flex items-center cursor-default gap-2 hover:bg-black/4 w-fit py-1 px-2 rounded-xs">
          <MdOutlineFileUpload /> <p className="text-sm">Import File (image, video)</p>
          <input
            type="file"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file)
                await createFile(currentFolderId, file.name, file, file.type);
            }}
          />
        </label>
      </section>
      <section className="px-3 py-2 flex gap-3">
        <button
          onClick={() => setCurrentFolderId(currentFolder?.parentId ?? null)}
          className="hover:bg-black/10 px-2 rounded-xs">
          <IoArrowBackOutline />
        </button>
        {/* Breadcrumb */}
        <div className="flex border border-black/25 py-1 px-2 grow cursor-default">
          {breadCrumb.map((item, idx) => (
            <div
              onClick={() => setCurrentFolderId(item.folderId)}
              key={idx}
              className="flex items-center hover:bg-black/7 mx-0.5 px-0.5">
              <span>{item.folderName}</span>
              <FaAngleRight className="opacity-70" />
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
    isNewFileModalOpen,
    setIsNewFileModalOpen,
    isNewFolderModalOpen,
    setIsNewFolderModalOpen,
    openNodeMenu,
    activeFile,
    setActiveFile,
    handleOpenFile,
  } = useAppContext();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [breadCrumb, setBreadCrumb] = useState<BreadCrumbItem[]>([
    { folderName: "Home", folderId: null },
  ]);

  const currentItems = useLiveQuery(() => {
    if (currentFolderId === null) {
      return db.nodes.filter((node) => node.parentId === null).toArray();
    } else {
      return db.nodes.where("parentId").equals(currentFolderId).toArray();
    }
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
        setBreadCrumb([{ folderName: "Home", folderId: null }]);
        return;
      }
      const path: BreadCrumbItem[] = [];
      let currentId: string | null = currentFolderId;
      while (currentId !== null) {
        const folder: any = await db.nodes.get(currentId);
        if (!folder) break;
        path.unshift({
          folderName: folder.title,
          folderId: folder.id,
        });
        currentId = folder.parentId;
      }
      setBreadCrumb([{ folderName: "Home", folderId: null }, ...path]);
    };

    updateBreadcrumb();
  }, [currentFolderId]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);

    for (const file of files) {
      await createFile(currentFolderId, file.name, file, file.type);
    }
  };

  const renderIcon = (mimeType?: string) => {
    if (!mimeType) return "/img/anonymous.png";
    if (mimeType.startsWith("image/")) return "/img/image.png";
    if (mimeType.startsWith("video/")) return "/img/video.png";
    if (mimeType === "text/plain") return "/img/textfile.png";
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
        setIsNewFileModalOpen={setIsNewFileModalOpen}
        setIsNewFolderModalOpen={setIsNewFolderModalOpen}
        breadCrumb={breadCrumb}
      />
      <div className="flex px-5 py-5 select-none flex-wrap gap-4">
        {filteredItems?.map((item) => (
          <div
            key={item.id}
            onContextMenu={(e) => openNodeMenu(e, item.id)}
            onDoubleClick={async () => {
              console.log(item);
              if (item.type === "folder") setCurrentFolderId(item.id);
              else handleOpenFile(item);
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

      {/* Text File Editor */}
      {activeFile && activeFile.textContent !== undefined && (
        <Notepad
          key={activeFile.file.id}
          id={activeFile.file.id}
          title={activeFile.file.title}
          text={activeFile.textContent}
          setActiveFile={setActiveFile}
        />
      )}

      {/* Image / Media Preview Modal */}
      {activeFile && activeFile.objectUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {/* <div className="bg-white p-4 rounded-md max-w-2xl max-h-[80vh] flex flex-col gap-2"> */}
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
          {/* </div> */}
        </div>
      )}

      {isNewFileModalOpen && (
        <NewFile
          onClose={() => setIsNewFileModalOpen(false)}
          currentFolderId={currentFolderId}
        />
      )}
      {isNewFolderModalOpen && (
        <NewFolder
          onClose={() => setIsNewFolderModalOpen(false)}
          currentFolderId={currentFolderId}
        />
      )}
    </section>
  );
};

export default FileExplorer;
