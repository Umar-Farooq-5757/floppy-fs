import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export interface MenuPosition {
  x: number;
  y: number;
}

export interface MenuItem {
  icon: ReactNode;
  label: string;
  action: () => void | Promise<void>;
}

interface ContextMenuProps {
  position: MenuPosition | null;
  onClose: () => void;
  menuItems: MenuItem[];
}

const ContextMenu = ({ position, onClose, menuItems }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!position) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (
        menuRef.current &&
        target instanceof Node &&
        !menuRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [position, onClose]);

  if (!position) {
    return null;
  }
  const handleMenuItemClick = async (item: MenuItem) => {
    try {
      await item.action();
    } catch (error) {
      console.error(`Context menu action "${item.label}" failed:`, error);
    } finally {
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
      className="fixed z-50 min-w-60 rounded-sm border border-slate-300 bg-white shadow-md py-1 px-2">
      {menuItems.map((item, index) => (
        <button
          key={`${item.label}-${index}`}
          type="button"
          onClick={() => void handleMenuItemClick(item)}
          className="flex hover:bg-black/4 border-l-3 border-white hover:border-blue-500 opacity-85 w-full items-center gap-2 rounded-r-sm px-2 py-2 text-sm font-medium">
          {item.icon}
          <p>{item.label}</p>
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;
