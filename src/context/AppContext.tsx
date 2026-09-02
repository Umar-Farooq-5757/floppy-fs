import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getFileContentByHash } from "../db/fileOperations";
import { db, type FileMetadata } from "../db/db";
import { useLiveQuery } from "dexie-react-hooks";

export interface ActiveMenu {
  type: "general" | "node";
  x: number;
  y: number;
  targetId?: string;
}

export type FileViewerType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "word"
  | "unknown";

export interface ActiveFile {
  file: FileMetadata;
  objectUrl?: string;
  textContent?: string;
  viewerType: FileViewerType;
}

export interface BreadCrumbItem {
  folderName: string;
  folderId: string | null;
}

interface MovingNode {
  id?: string;
  action?: "copy" | "cut";
}

interface AppContextType {
  isNewNodeModalOpen: boolean;
  setIsNewNodeModalOpen: (isOpen: boolean) => void;

  isRenameNodeModalOpen: boolean;
  setIsRenameNodeModalOpen: (isOpen: boolean) => void;

  renameNodeId: string | null;
  setRenameNodeId: React.Dispatch<React.SetStateAction<string | null>>;

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

  checked: boolean;
  setChecked: React.Dispatch<React.SetStateAction<boolean>>;

  breadCrumb: BreadCrumbItem[];
  setBreadCrumb: React.Dispatch<React.SetStateAction<BreadCrumbItem[]>>;

  currentFolderId: string | null;
  setCurrentFolderId: React.Dispatch<React.SetStateAction<string | null>>;

  currentItems: FileMetadata[] | undefined;
  currentFolder: FileMetadata | undefined;

  movingNode: MovingNode | null;
  setMovingNode: React.Dispatch<React.SetStateAction<MovingNode | null>>;

  showFileExtensions: boolean;
  setShowFileExtensions: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf(".");

  if (lastDot <= 0 || lastDot === fileName.length - 1) {
    return "";
  }

  return fileName.slice(lastDot + 1).toLowerCase();
};

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [isNewNodeModalOpen, setIsNewNodeModalOpen] = useState(false);

  const [isRenameNodeModalOpen, setIsRenameNodeModalOpen] = useState(false);

  const [renameNodeId, setRenameNodeId] = useState<string | null>(null);

  const [activeMenu, setActiveMenu] = useState<ActiveMenu | null>(null);

  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);

  const [creatingFileOrFolder, setCreatingFileOrFolder] = useState<
    "file" | "folder"
  >("file");

  const [movingNode, setMovingNode] = useState<MovingNode | null>(null);

  const [checked, setChecked] = useState(() => {
    const savedMode = localStorage.getItem("mode");

    return savedMode !== null ? JSON.parse(savedMode) : true;
  });

  const [breadCrumb, setBreadCrumb] = useState<BreadCrumbItem[]>([
    {
      folderName: "Home",
      folderId: null,
    },
  ]);

  const [showFileExtensions, setShowFileExtensions] = useState(() => {
    const savedValue = localStorage.getItem("showFileExtensions");

    return savedValue !== null ? JSON.parse(savedValue) : true;
  });

  const currentFolder = useLiveQuery(
    () => (currentFolderId ? db.nodes.get(currentFolderId) : undefined),
    [currentFolderId],
  );

  const currentItems = useLiveQuery(() => {
    if (currentFolderId === null || currentFolderId === undefined) {
      return db.nodes.filter((node) => node.parentId === null).toArray();
    }

    return db.nodes.where("parentId").equals(currentFolderId).toArray();
  }, [currentFolderId]);

  const closeActiveFile = () => {
    if (activeFile?.objectUrl) {
      URL.revokeObjectURL(activeFile.objectUrl);
    }

    setActiveFile(null);
  };

  const handleOpenFile = async (
    target: FileMetadata | string,
  ): Promise<void> => {
    let node: FileMetadata | undefined;

    if (typeof target === "string") {
      node = await db.nodes.get(target);
    } else {
      node = target;
    }

    if (!node) {
      return;
    }

    /*
     * Opening a folder from the context menu.
     */
    if (node.type === "folder") {
      closeActiveFile();
      setCurrentFolderId(node.id);
      return;
    }

    if (node.type !== "file" || !node.hash) {
      return;
    }

    /*
     * Close any previously opened binary file.
     */
    if (activeFile?.objectUrl) {
      URL.revokeObjectURL(activeFile.objectUrl);
    }

    const rawContent = await getFileContentByHash(node.hash);

    if (rawContent === undefined || rawContent === null) {
      throw new Error(`Unable to load "${node.title}".`);
    }

    const extension = getExtension(node.title);

    const mimeType = node.mimeType?.toLowerCase() || "";

    const isTextFile =
      mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      [
        "txt",
        "md",
        "json",
        "csv",
        "js",
        "ts",
        "tsx",
        "jsx",
        "css",
        "html",
      ].includes(extension) ||
      typeof rawContent === "string";

    if (isTextFile) {
      let textContent = "";

      if (typeof rawContent === "string") {
        textContent = rawContent;
      } else if (rawContent instanceof Blob) {
        textContent = await rawContent.text();
      } else {
        throw new Error("Unable to read this text file.");
      }

      setActiveFile({
        file: node,
        textContent,
        viewerType: "text",
      });

      return;
    }

    if (!(rawContent instanceof Blob)) {
      throw new Error(`Unsupported content format for "${node.title}".`);
    }

    const objectUrl = URL.createObjectURL(rawContent);

    let viewerType: FileViewerType = "unknown";

    if (mimeType.startsWith("image/")) {
      viewerType = "image";
    } else if (mimeType.startsWith("video/")) {
      viewerType = "video";
    } else if (mimeType.startsWith("audio/")) {
      viewerType = "audio";
    } else if (mimeType === "application/pdf" || extension === "pdf") {
      viewerType = "pdf";
    } else if (
      mimeType === "application/msword" ||
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === "doc" ||
      extension === "docx"
    ) {
      viewerType = "word";
    }

    setActiveFile({
      file: node,
      objectUrl,
      viewerType,
    });
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

  useEffect(() => {
    localStorage.setItem(
      "showFileExtensions",
      JSON.stringify(showFileExtensions),
    );
  }, [showFileExtensions]);

  useEffect(() => {
    return () => {
      if (activeFile?.objectUrl) {
        URL.revokeObjectURL(activeFile.objectUrl);
      }
    };
  }, [activeFile]);

  return (
    <AppContext.Provider
      value={{
        currentFolderId,
        setCurrentFolderId,

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

        checked,
        setChecked,

        breadCrumb,
        setBreadCrumb,

        currentItems,
        currentFolder,

        movingNode,
        setMovingNode,

        showFileExtensions,
        setShowFileExtensions,
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
