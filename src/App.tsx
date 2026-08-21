import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import type { MenuPosition } from "./components/ContextMenu";
import ContextMenu from "./components/ContextMenu";
import { VscNewFile } from "react-icons/vsc";
import { RiDeleteBinLine } from "react-icons/ri";
import { FileExplorer } from "./components/FileExplorer";

function App() {
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setMenuPosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const menuItems = [
    {icon:<VscNewFile className="size-4"/> , label: "New File", action: () => alert("Edit clicked!") },
    {icon:<VscNewFile className="size-4"/> , label: "Duplicate", action: () => alert("Duplicate clicked!") },
    {icon:<RiDeleteBinLine className="size-4"/> , label: "Delete", action: () => alert("Delete clicked!") },
  ];
  return (
    <>
      <Header />
      <Toolbar />
      <section
        onContextMenu={handleContextMenu}
        className="w-screen h-[90vh]">
          <FileExplorer/>
        </section>
      <ContextMenu
        position={menuPosition}
        onClose={() => setMenuPosition(null)}
        items={menuItems}
      />
    </>
  );
}

export default App;
