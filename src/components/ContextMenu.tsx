import { useEffect, useRef } from "react";

export interface MenuPosition {
  x: number;
  y: number;
}
export interface MenuItem {
  icon: React.ReactNode;
  label: string;
  action: () => void;
}
interface ContextMenuProps {
  position: MenuPosition | null;
  onClose: () => void;
  menuItems: MenuItem[];
}

const ContextMenu = ({ position, onClose, menuItems }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Close menu when pressing Escape
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (position) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [position, onClose]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      className="fixed z-50 min-w-60 rounded-lg border border-slate-300 bg-white shadow-md py-1 px-2 transition-all">
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.action();
            onClose();
          }}
          className={`flex hover:bg-black/4 border-l-3 border-white hover:border-blue-500 opacity-85 w-full items-center gap-2 rounded-r-sm px-2 py-2 text-sm font-medium`}>
          {item.icon}
          <p>{item.label}</p>
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;
