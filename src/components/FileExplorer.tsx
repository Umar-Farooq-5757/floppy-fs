import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useState } from "react";
import { db } from "../db/db";
import { IoArrowBackOutline } from "react-icons/io5";
import { VscNewFile, VscNewFolder } from "react-icons/vsc";
import Notepad from "./Notepad";
import NewFile from "./NewFile";
import { useAppContext } from "../context/AppContext";
import NewFolder from "./NewFolder";
import { IoIosSearch } from "react-icons/io";
import { FaAngleRight } from "react-icons/fa";

export interface BreadCrumbItem {
  folderName: string;
  folderId: string | null;
}
interface ToolbarProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  currentFolder: any;
  setCurrentFolderId: (id: string | null) => void;
  setIsNewFileModalOpen: (isOpen: boolean) => void;
  setIsNewFolderModalOpen: (isOpen: boolean) => void;
  breadCrumb: BreadCrumbItem[];
}

const Toolbar: React.FC<ToolbarProps> = ({
  searchValue,
  setSearchValue,
  currentFolder,
  setCurrentFolderId,
  setIsNewFileModalOpen,
  setIsNewFolderModalOpen,
  breadCrumb,
}) => {
  return (
    <>
      <section className="px-3 py-2 bg-black/4 border border-black/4 flex">
        <div
          onClick={() => setIsNewFileModalOpen(true)}
          className="flex items-center gap-2 hover:bg-black/4 w-fit py-1 px-2 cursor-default rounded-xs">
          <VscNewFile />
          <p className="text-sm">New File</p>
        </div>
        <div
          onClick={() => setIsNewFolderModalOpen(true)}
          className="flex items-center gap-2 hover:bg-black/4 w-fit py-1 px-2 cursor-default rounded-xs">
          <VscNewFolder />
          <p className="text-sm">New Folder</p>
        </div>
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
  const [breadCrumb, setBreadCrumb] = useState([
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
        const folder = await db.nodes.get(currentId);
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

  return (
    <section>
      <Toolbar
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        currentFolder={currentFolder}
        setCurrentFolderId={setCurrentFolderId}
        setIsNewFileModalOpen={setIsNewFileModalOpen}
        setIsNewFolderModalOpen={setIsNewFolderModalOpen}
        breadCrumb={breadCrumb}
      />
      <div className="flex px-5 py-5 select-none flex-wrap">
        {filteredItems?.map((item) => (
          <div
            key={item.id}
            onContextMenu={(e) => openNodeMenu(e, item.id)}
            onDoubleClick={async () => {
              if (item.type === "file") {
                if (item.hash) {
                  handleOpenFile(item.id);
                }
              } else {
                setCurrentFolderId(item.id);
              }
            }}
            className="flex flex-col items-center text-sm hover:bg-black/4 cursor-default p-2 px-5 rounded-sm">
            {item.type === "folder" ? (
              <img
                className="size-20"
                src="/img/folder.png"
                alt="folder icon"
              />
            ) : (
              <img
                className="size-20"
                src="/img/textfile.png"
                alt="text file icon"
              />
            )}
            {item.title}
          </div>
        ))}
      </div>
      {activeFile && (
        <Notepad
          id={activeFile.id}
          title={activeFile.title}
          text={activeFile.content}
          setActiveFile={setActiveFile}
        />
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

/**
 * I am building a react app where i want two custom context menus. one is the general context menu that should appear when user clicks anywhere on the page. and the other is item-specific context menu that should appear when user clicks on an item on the page. tell me how to handle this so that both menus don't collide
 */
