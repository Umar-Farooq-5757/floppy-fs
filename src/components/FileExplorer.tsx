import { useLiveQuery } from "dexie-react-hooks";
import React, { useState } from "react";
import { db } from "../db/db";
import { IoArrowBackOutline } from "react-icons/io5";
import { getFileContentByHash } from "../db/fileOperations";
import { VscNewFile, VscNewFolder } from "react-icons/vsc";
import Notepad from "./Notepad";
import NewFile from "./NewFile";
import { useAppContext } from "../context/AppContext";
import NewFolder from "./NewFolder";
import { IoIosSearch } from "react-icons/io";
import { FaAngleRight } from "react-icons/fa";

export interface ActiveFile {
  id: string;
  title: string;
  content: string;
}

interface ToolbarProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  currentFolder: any;
  setCurrentFolderId: (id: string | null) => void;
  setIsNewFileModalOpen: (isOpen: boolean) => void;
  setIsNewFolderModalOpen: (isOpen: boolean) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  searchValue,
  setSearchValue,
  currentFolder,
  setCurrentFolderId,
  setIsNewFileModalOpen,
  setIsNewFolderModalOpen,
}) => {
  const [breadCrumb] = useState(["Home", "Docs", "documents"]);

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
        <div className="flex border border-black/25 py-1 px-2 grow">
          {breadCrumb.map((item, idx) => (
            <div key={idx} className="flex items-center">
              <span>{item}</span>
              <FaAngleRight className="mr-1.5 opacity-70" />
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
  } = useAppContext();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);
  const [searchValue, setSearchValue] = useState("");

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

  const handleOpenFile = async (
    fileId: string,
    title: string,
    hash: string,
  ) => {
    if (!hash) return;
    const content = await getFileContentByHash(hash);
    setActiveFile({
      id: fileId,
      title: title,
      content: content ?? "",
    });
  };

  return (
    <section>
      <Toolbar
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        currentFolder={currentFolder}
        setCurrentFolderId={setCurrentFolderId}
        setIsNewFileModalOpen={setIsNewFileModalOpen}
        setIsNewFolderModalOpen={setIsNewFolderModalOpen}
      />
      <div className="flex px-5 py-5 select-none flex-wrap">
        {filteredItems?.map((item) => (
          <div
            key={item.id}
            onDoubleClick={async () => {
              if (item.type === "file") {
                if (item.hash) {
                  handleOpenFile(item.id, item.title, item.hash);
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
