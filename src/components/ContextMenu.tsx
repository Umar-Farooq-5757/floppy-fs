import { useEffect, useRef, type ReactNode } from "react";

export interface MenuPosition {
  x: number;
  y: number;
}

interface MenuItem {
  label: string;
  action: () => void;
  icon?: ReactNode;
}

interface ContextMenuProps {
  position: MenuPosition | null;
  onClose: () => void;
  items: MenuItem[];
}

const ContextMenu = ({ position, onClose, items }: ContextMenuProps) => {
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
      className="fixed z-50 min-w-60 rounded-lg border border-slate-200 bg-black/2 shadow-xs py-1 px-2 backdrop-blur-md transition-all">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.action();
            onClose();
          }}
          className={`flex hover:bg-black/4 opacity-85 w-full items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-all`}>
          {item.icon}
          <p>{item.label}</p>
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;
