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

export interface ActiveFile {
  file: FileMetadata;
  objectUrl?: string;
  textContent?: string;
}

interface AppContextType {
  isNewFileModalOpen: boolean;
  setIsNewFileModalOpen: (isOpen: boolean) => void;
  isNewFolderModalOpen: boolean;
  setIsNewFolderModalOpen: (isOpen: boolean) => void;
  activeMenu: ActiveMenu | null;
  openGeneralMenu: (e: React.MouseEvent) => void;
  openNodeMenu: (e: React.MouseEvent, targetId: string) => void;
  closeMenu: () => void;
  activeFile: ActiveFile | null;
  setActiveFile: React.Dispatch<React.SetStateAction<ActiveFile | null>>;
  handleOpenFile: (target: FileMetadata | string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu | null>(null);
  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);

  const handleOpenFile = async (target: FileMetadata | string) => {
    let fileNode: FileMetadata | undefined;
    if (typeof target === "string") {
      fileNode = await db.nodes.get(target);
    } else {
      fileNode = target;
    }
    if (!fileNode || fileNode.type !== "file" || !fileNode.hash) return;
    const rawContent = await getFileContentByHash(fileNode.hash);
    if (rawContent === undefined || rawContent === null) return;

    if (activeFile?.objectUrl) {
      URL.revokeObjectURL(activeFile.objectUrl);
    }
    const isTextFile =
      fileNode.mimeType?.startsWith("text/") ||
      fileNode.mimeType === "application/json" ||
      fileNode.title.endsWith(".txt") ||
      fileNode.title.endsWith(".md") ||
      fileNode.title.endsWith(".json") ||
      typeof rawContent === "string";
    if (isTextFile) {
      let textContent = "";
      if (typeof rawContent === "string") {
        textContent = rawContent;
      } else if (rawContent instanceof Blob) {
        textContent = await rawContent.text();
      }
      setActiveFile({ file: fileNode, textContent });
    } else if (rawContent instanceof Blob) {
      const objectUrl = URL.createObjectURL(rawContent);
      setActiveFile({ file: fileNode, objectUrl });
    }
  };

  const openGeneralMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveMenu({ type: "general", x: e.clientX, y: e.clientY });
  };

  const openNodeMenu = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu({ type: "node", x: e.clientX, y: e.clientY, targetId });
  };

  const closeMenu = () => setActiveMenu(null);

  return (
    <AppContext.Provider
      value={{
        isNewFileModalOpen,
        setIsNewFileModalOpen,
        isNewFolderModalOpen,
        setIsNewFolderModalOpen,
        activeMenu,
        openGeneralMenu,
        openNodeMenu,
        closeMenu,
        activeFile,
        setActiveFile,
        handleOpenFile,
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
