import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { getFileContentByHash } from "../db/fileOperations";
import { db, type FileMetadata } from "../db/db";

export interface ActiveMenu {
  type: "general" | "node";
  x: number;
  y: number;
  targetId?: string;
}

interface AppContextType {
  isNewNodeModalOpen: boolean;
  setIsNewNodeModalOpen: (isOpen: boolean) => void;
  isRenameNodeModalOpen: boolean;
  setIsRenameNodeModalOpen: (isOpen: boolean) => void;
  activeMenu: ActiveMenu | null;
  openGeneralMenu: (e: React.MouseEvent) => void;
  openNodeMenu: (e: React.MouseEvent, targetId: string) => void;
  closeMenu: () => void;
  activeFile: ActiveFile | null;
  setActiveFile: React.Dispatch<React.SetStateAction<ActiveFile | null>>;
  handleOpenFile: (target: FileMetadata | string) => Promise<void>;
  creatingFileOrFolder: "file" | "folder";
  setCreatingFileOrFolder: React.Dispatch<
    React.SetStateAction<"file" | "folder">
  >;
  renameNodeId: string | null;
  setRenameNodeId: React.Dispatch<React.SetStateAction<string | null>>;
}
export interface ActiveFile {
  file: FileMetadata;
  objectUrl?: string;
  textContent?: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
export const AppContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isNewNodeModalOpen, setIsNewNodeModalOpen] = useState(false);
  const [isRenameNodeModalOpen, setIsRenameNodeModalOpen] = useState(false);
  const [renameNodeId, setRenameNodeId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu | null>(null);
  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);
  const [creatingFileOrFolder, setCreatingFileOrFolder] = useState<
    "file" | "folder"
  >("file");

  const handleOpenFile = async (target: FileMetadata | string) => {
    try {
      let fileNode: FileMetadata | undefined;
      if (typeof target === "string") {
        fileNode = await db.nodes.get(target);
      } else {
        fileNode = target;
      }
      if (!fileNode || fileNode.type !== "file" || !fileNode.hash) {
        return;
      }
      const rawContent = await getFileContentByHash(fileNode.hash);
      if (rawContent === undefined || rawContent === null) {
        return;
      }
      if (activeFile?.objectUrl) {
        URL.revokeObjectURL(activeFile.objectUrl);
      }
      const isTextFile =
        fileNode.mimeType?.startsWith("text/") ||
        fileNode.mimeType === "application/json" ||
        fileNode.title.toLowerCase().endsWith(".txt") ||
        fileNode.title.toLowerCase().endsWith(".md") ||
        fileNode.title.toLowerCase().endsWith(".json") ||
        typeof rawContent === "string";

      if (isTextFile) {
        let textContent = "";
        if (typeof rawContent === "string") {
          textContent = rawContent;
        } else if (rawContent instanceof Blob) {
          textContent = await rawContent.text();
        }
        setActiveFile({
          file: fileNode,
          textContent,
        });
        return;
      }

      if (rawContent instanceof Blob) {
        const objectUrl = URL.createObjectURL(rawContent);
        setActiveFile({
          file: fileNode,
          objectUrl,
        });
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  const openGeneralMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveMenu({
      type: "general",
      x: e.clientX,
      y: e.clientY,
    });
  };

  const openNodeMenu = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu({
      type: "node",
      x: e.clientX,
      y: e.clientY,
      targetId,
    });
  };

  const closeMenu = () => {
    setActiveMenu(null);
  };

  return (
    <AppContext.Provider
      value={{
        isNewNodeModalOpen,
        setIsNewNodeModalOpen,
        isRenameNodeModalOpen,
        setIsRenameNodeModalOpen,
        renameNodeId,
        setRenameNodeId,
        activeMenu,
        openGeneralMenu,
        openNodeMenu,
        closeMenu,
        activeFile,
        setActiveFile,
        handleOpenFile,
        creatingFileOrFolder,
        setCreatingFileOrFolder,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }

  return context;
};
