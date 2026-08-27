import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { renameNode } from "../db/fileOperations";
import toast from "react-hot-toast";

interface RenameNodeModalProps {
  nodeId: string;
  onClose: () => void;
}

const RenameNodeModal = ({ nodeId, onClose }: RenameNodeModalProps) => {
  const [newNodeName, setNewNodeName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleRenameNode = async () => {
    const name = newNodeName.trim();
    if (!name) {
      toast.error("Name cannot be empty.");
      return;
    }

    try {
      setIsRenaming(true);
      await renameNode(nodeId, name);
      toast.success("Renamed successfully.");
      onClose();
    } catch (error) {
      console.error("Failed to rename node:", error);
      const message =
        error instanceof Error ? error.message : "Failed to rename node.";
      toast.error(message);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleRenameNode();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="bg-black/30 fixed inset-0 flex items-center justify-center z-50">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-sm overflow-hidden shadow-sm flex flex-col w-9/10 sm:w-1/2 md:w-1/3 lg:w-1/4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 pl-2">
            <p className="text-sm">Rename</p>
          </div>
          <button
            onClick={onClose}
            disabled={isRenaming}
            title="Close"
            className="hover:bg-red-500 hover:text-white py-2 px-4">
            <IoMdClose size={14} />
          </button>
        </div>
        <div className="w-full h-0.5 bg-black/5" />
        <div className="py-2 space-y-2 px-3">
          <p>Enter new name:</p>
          <input
            ref={inputRef}
            className="bg-black/8 w-full border-b-2 border-transparent focus:border-blue-500 outline-none px-1 py-0.5"
            type="text"
            value={newNodeName}
            disabled={isRenaming}
            onChange={(e) => setNewNodeName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex justify-end px-3 my-3 gap-2">
          <button
            onClick={onClose}
            disabled={isRenaming}
            className="bg-black/8 px-2 py-0.5 rounded-sm hover:opacity-85">
            Cancel
          </button>
          <button
            onClick={() => void handleRenameNode()}
            disabled={isRenaming}
            className="bg-blue-500 px-2 py-0.5 rounded-sm hover:opacity-85 text-white">
            {isRenaming ? "Renaming..." : "Rename"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameNodeModal;
