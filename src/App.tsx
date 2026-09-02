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
  downloadNode,
  moveNode,
} from "./db/fileOperations";

import Terminal from "./components/Terminal";

import Notepad from "./components/Notepad";

import ImageViewer from "./components/ImageViewer";

import VideoPlayer from "./components/VideoPlayer";

import PdfViewer from "./components/PDFViewer";

import WordViewer from "./components/WordViewer";

import AudioPlayer from "./components/AudioPlayer";

import { TfiCut } from "react-icons/tfi";

import { MdContentPaste, MdOutlineFileDownload } from "react-icons/md";

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
          toast.error("There is nothing to paste.");

          return;
        }

        try {
          if (movingNode.action === "copy") {
            await copyNode(movingNode.id, currentFolderId);

            toast.success("Copied successfully.");
          } else {
            await moveNode(movingNode.id, currentFolderId);

            toast.success("Moved successfully.");
          }

          setMovingNode(null);
        } catch (error) {
          console.error("Failed to paste node:", error);

          toast.error(
            error instanceof Error ? error.message : "Failed to paste item.",
          );
        }
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

        try {
          await handleOpenFile(targetId);
        } catch (error) {
          console.error("Failed to open item:", error);

          toast.error(
            error instanceof Error ? error.message : "Failed to open item.",
          );
        }
      },
    },

    {
      icon: <TfiCut className="size-4" />,

      label: "Cut",

      action: () => {
        if (!activeMenu?.targetId) {
          return;
        }

        setMovingNode({
          id: activeMenu.targetId,
          action: "cut",
        });

        toast.success("Item cut. Choose a folder and paste.");
      },
    },

    {
      icon: <IoCopyOutline className="size-4" />,

      label: "Copy",

      action: () => {
        if (!activeMenu?.targetId) {
          return;
        }

        setMovingNode({
          id: activeMenu.targetId,
          action: "copy",
        });

        toast.success("Item copied. Choose a folder and paste.");
      },
    },

    {
      icon: <VscRename className="size-4" />,

      label: "Rename",

      action: () => {
        if (!activeMenu?.targetId) {
          return;
        }

        setRenameNodeId(activeMenu.targetId);

        setIsRenameNodeModalOpen(true);
      },
    },

    {
      icon: <MdOutlineFileDownload className="size-4" />,

      label: "Download",

      action: async () => {
        const targetId = activeMenu?.targetId;

        if (!targetId) {
          toast.error("No file or folder selected.");

          return;
        }

        try {
          await downloadNode(targetId);

          toast.success("Download started.");
        } catch (error) {
          console.error("Failed to download node:", error);

          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to download file or folder.",
          );
        }
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

          toast.success("Deleted successfully.");
        } catch (error) {
          console.error("Failed to delete node:", error);

          toast.error(
            error instanceof Error ? error.message : "Failed to delete item.",
          );
        }
      },
    },
  ];

  const currentMenuItems =
    activeMenu?.type === "node" ? nodeMenuItems : generalMenuItems;

  return (
    <div className={`min-h-screen ${!checked ? "bg-black text-white" : ""}`}>
      <Header />

      {checked ? (
        <section onContextMenu={openGeneralMenu} className="h-[90vh] w-screen">
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

      {activeFile &&
        activeFile.viewerType === "text" &&
        activeFile.textContent !== undefined && (
          <Notepad
            key={activeFile.file.id}
            id={activeFile.file.id}
            title={activeFile.file.title}
            text={activeFile.textContent}
            setActiveFile={setActiveFile}
          />
        )}

      {activeFile &&
        activeFile.objectUrl &&
        activeFile.viewerType === "image" && <ImageViewer />}

      {activeFile &&
        activeFile.objectUrl &&
        activeFile.viewerType === "video" && <VideoPlayer />}

      {activeFile &&
        activeFile.objectUrl &&
        activeFile.viewerType === "audio" && <AudioPlayer />}

      {activeFile &&
        activeFile.objectUrl &&
        activeFile.viewerType === "pdf" && <PdfViewer />}

      {activeFile &&
        activeFile.objectUrl &&
        activeFile.viewerType === "word" && <WordViewer />}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}

export default App;
