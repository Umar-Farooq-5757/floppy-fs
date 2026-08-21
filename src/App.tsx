import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import type { MenuPosition } from "./components/ContextMenu";
import ContextMenu from "./components/ContextMenu";
import FileExplorer from "./components/FileExplorer";

function App() {
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setMenuPosition({
      x: e.clientX,
      y: e.clientY,
    });
  };
  return (
    <>
      <Header />
      <section onContextMenu={handleContextMenu} className="w-screen h-[90vh]">
        <FileExplorer />
      </section>
      <ContextMenu
        position={menuPosition}
        onClose={() => setMenuPosition(null)}
      />
    </>
  );
}

export default App;
