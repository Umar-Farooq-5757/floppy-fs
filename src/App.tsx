import "./App.css";
import Header from "./components/Header";
import ContextMenu, { type MenuItem } from "./components/ContextMenu";
import FileExplorer from "./components/FileExplorer";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./context/AppContext";
import { VscNewFile, VscNewFolder, VscRename } from "react-icons/vsc";
import { RiDeleteBinLine } from "react-icons/ri";
import { FiEdit3 } from "react-icons/fi";
import { deleteNode } from "./db/fileOperations";
import Terminal from "./components/Terminal";

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
    <div className={`min-h-screen ${!checked && 'bg-black text-white'}`}>
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

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}

export default App;
