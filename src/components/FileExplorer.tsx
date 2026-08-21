import { useLiveQuery } from "dexie-react-hooks";
import React, { useState } from "react";
import { db } from "../db/db";
import {
  IoArrowBackOutline,
  IoDocumentTextOutline,
  IoFolderOutline,
} from "react-icons/io5";
import { getFileContentByHash } from "../db/fileOperations";
import { VscNewFile, VscNewFolder } from "react-icons/vsc";
import Notepad from "./Notepad";
import NewFile from "./NewFile";
import { useAppContext } from "../context/AppContext";
import { Toaster } from "react-hot-toast";
import NewFolder from "./NewFolder";

export interface ActiveFile {
  id: string;
  title: string;
  content: string;
}

export const FileExplorer: React.FC = () => {
  const {
    isNewFileModalOpen,
    setIsNewFileModalOpen,
    isNewFolderModalOpen,
    setIsNewFolderModalOpen,
  } = useAppContext();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);

  const currentItems = useLiveQuery(() => {
    if (currentFolderId === null) {
      return db.nodes.filter((node) => node.parentId === null).toArray();
    } else {
      return db.nodes.where("parentId").equals(currentFolderId).toArray();
    }
  }, [currentFolderId]);

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

  const Toolbar = () => {
    return (
      <section className="px-3 py-2 bg-black/4 border border-black/10 flex">
        <button
          onClick={() => setCurrentFolderId(currentFolder?.parentId ?? null)}
          className="opacity-60 hover:opacity-100">
          <IoArrowBackOutline />
        </button>
        <div
          onClick={() => setIsNewFileModalOpen(true)}
          className="flex items-center gap-2 hover:bg-black/10 w-fit py-1 px-2 cursor-default rounded-xs">
          <VscNewFile />
          <p className="text-sm">New File</p>
        </div>
        <div
          onClick={() => setIsNewFolderModalOpen(true)}
          className="flex items-center gap-2 hover:bg-black/10 w-fit py-1 px-2 cursor-default rounded-xs">
          <VscNewFolder />
          <p className="text-sm">New Folder</p>
        </div>
      </section>
    );
  };

  return (
    <section>
      <Toolbar />
      <div className="flex px-5 py-5 select-none">
        {currentItems?.map((item) => (
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
            className="flex flex-col items-center text-sm hover:bg-black/10 cursor-default p-2 px-5 rounded-sm">
            {item.type === "folder" ? (
              <IoFolderOutline size={44} color="#f2a900" />
            ) : (
              <IoDocumentTextOutline size={44} />
            )}
            {item.title}
          </div>
        ))}
      </div>
      {activeFile && (
        <Notepad
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
      <Toaster position="top-right" reverseOrder={false} />
    </section>
  );
};

export default FileExplorer;

// https://hastebin.com/share/ozacojutah.typescript
