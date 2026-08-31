import "./App.css";
import Header from "./components/Header";
import ContextMenu, { type MenuItem } from "./components/ContextMenu";
import FileExplorer from "./components/FileExplorer";
import toast, { Toaster } from "react-hot-toast";
import { useAppContext } from "./context/AppContext";
import { VscNewFile, VscNewFolder, VscRename } from "react-icons/vsc";
import { RiDeleteBinLine } from "react-icons/ri";
import { FiEdit3 } from "react-icons/fi";
import {
  copyNode,
  deleteNode,
  moveNode,
} from "./db/fileOperations";
import Terminal from "./components/Terminal";
import Notepad from "./components/Notepad";
import ImageViewer from "./components/ImageViewer";
import VideoPlayer from "./components/VideoPlayer";
import { TfiCut } from "react-icons/tfi";
import { MdContentPaste } from "react-icons/md";
import { IoCopyOutline } from "react-icons/io5";

function App() {
  const {
    setIsNewNodeModalOpen,
    setIsRenameNodeModalOpen,
    setRenameNodeId,
    activeMenu,
    openGeneralMenu,
    closeMenu,
    handleOpenFile,
    setCreatingFileOrFolder,
    checked,
    activeFile,
    setActiveFile,
    movingNode,
    setMovingNode,
    currentFolderId,
  } = useAppContext();

  const generalMenuItems: MenuItem[] = [
    {
      icon: <VscNewFile className="size-4" />,
      label: "New File",
      action: () => {
        setCreatingFileOrFolder("file");
        setIsNewNodeModalOpen(true);
      },
    },
    {
      icon: <VscNewFolder className="size-4" />,
      label: "New Folder",
      action: () => {
        setCreatingFileOrFolder("folder");
        setIsNewNodeModalOpen(true);
      },
    },
    {
      icon: <MdContentPaste className="size-4" />,
      label: "Paste",
      action: async () => {
        if (!movingNode?.id) {
          toast.error("There is noting to paste");
          return;
        }
        if (movingNode.action === "copy") {
          await copyNode(movingNode.id, currentFolderId);
        } else {
          await moveNode(movingNode.id, currentFolderId);
        }

        setMovingNode(null);
      },
    },
  ];

  const nodeMenuItems: MenuItem[] = [
    {
      icon: <FiEdit3 className="size-4" />,
      label: "Open / Edit",
      action: async () => {
        const targetId = activeMenu?.targetId;
        if (!targetId) {
          return;
        }
        await handleOpenFile(targetId);
      },
    },
    {
      icon: <TfiCut className="size-4" />,
      label: "Cut",
      action: () => {
        if (!activeMenu?.targetId) return;
        setMovingNode((prev) => ({
          ...prev,
          id: activeMenu.targetId,
          action: "cut",
        }));
      },
    },
    {
      icon: <IoCopyOutline className="size-4" />,
      label: "Copy",
      action: async () => {
        if (!activeMenu?.targetId) return;
        setMovingNode((prev) => ({
          ...prev,
          id: activeMenu?.targetId,
          action: "copy",
        }));
      },
    },
    {
      icon: <VscRename className="size-4" />,
      label: "Rename",
      action: () => {
        if (!activeMenu?.targetId) return;
        setRenameNodeId(activeMenu.targetId);
        setIsRenameNodeModalOpen(true);
      },
    },
    {
      icon: <RiDeleteBinLine className="size-4" />,
      label: "Delete",
      action: async () => {
        const targetId = activeMenu?.targetId;
        if (!targetId) {
          return;
        }
        try {
          await deleteNode(targetId);
        } catch (error) {
          console.error("Failed to delete node:", error);
        }
      },
    },
  ];

  const currentMenuItems =
    activeMenu?.type === "node" ? nodeMenuItems : generalMenuItems;

  return (
    <div className={`min-h-screen ${!checked && "bg-black text-white"}`}>
      <Header />
      {checked ? (
        <section onContextMenu={openGeneralMenu} className="w-screen h-[90vh]">
          <FileExplorer />
          <ContextMenu
            menuItems={currentMenuItems}
            position={
              activeMenu
                ? {
                    x: activeMenu.x,
                    y: activeMenu.y,
                  }
                : null
            }
            onClose={closeMenu}
          />
        </section>
      ) : (
        <Terminal />
      )}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {activeFile.file.mimeType?.startsWith("image/") && <ImageViewer />}
          {activeFile.file.mimeType?.startsWith("video/") && <VideoPlayer />}
        </div>
      )}
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}

export default App;
