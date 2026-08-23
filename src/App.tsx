import "./App.css";
import Header from "./components/Header";
import ContextMenu, { type MenuItem } from "./components/ContextMenu";
import FileExplorer from "./components/FileExplorer";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./context/AppContext";
import { VscNewFile, VscNewFolder } from "react-icons/vsc";
import { RiDeleteBinLine } from "react-icons/ri";
import { deleteNode } from "./db/fileOperations";
import { FiEdit3 } from "react-icons/fi";

function App() {
  const {
    setIsNewFileModalOpen,
    setIsNewFolderModalOpen,
    activeMenu,
    openGeneralMenu,
    closeMenu,
    handleOpenFile,
  } = useAppContext();

  const generalMenuItems: MenuItem[] = [
    {
      icon: <VscNewFile className="size-4" />,
      label: "New File",
      action: () => setIsNewFileModalOpen(true),
    },
    {
      icon: <VscNewFolder className="size-4" />,
      label: "New Folder",
      action: () => setIsNewFolderModalOpen(true),
    },
  ];
  const nodeMenuItems: MenuItem[] = [
    {
      icon: <FiEdit3 className="size-4" />,
      label: "Edit",
      action: async () => {
        if (activeMenu?.targetId) {
          await handleOpenFile(activeMenu.targetId);
        }
      },
    },
    {
      icon: <RiDeleteBinLine className="size-4" />,
      label: "Delete",
      action: async () => {
        if (activeMenu?.targetId) {
          await deleteNode(activeMenu.targetId);
        }
      },
    },
  ];

  const currentMenuItems =
    activeMenu?.type === "node" ? nodeMenuItems : generalMenuItems;

  return (
    <>
      <Header />
      <section onContextMenu={openGeneralMenu} className="w-screen h-[90vh]">
        <FileExplorer />
      </section>

      <ContextMenu
        menuItems={currentMenuItems}
        position={activeMenu ? { x: activeMenu.x, y: activeMenu.y } : null}
        onClose={closeMenu}
      />

      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}

export default App;
