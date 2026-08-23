import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { getFileContentByHash } from "../db/fileOperations";
import { db } from "../db/db";

export interface ActiveMenu {
  type: "general" | "node";
  x: number;
  y: number;
  targetId?: string;
}
export interface ActiveFile {
  id: string;
  title: string;
  content: string;
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
  handleOpenFile: (
    fileId: string,
  ) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu | null>(null);
  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);

  const handleOpenFile = async (
    fileId: string,
  ) => {
    const fileData = await db.nodes.get(fileId)
    const content = await getFileContentByHash(fileData?.hash);
    setActiveFile({
      id: fileId,
      title: fileData.title,
      content: content ?? "",
    });
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
