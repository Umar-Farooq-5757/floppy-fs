import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import toast from "react-hot-toast";
import { renameNode } from "../db/fileOperations";
import { db } from "../db/db";
import { useAppContext } from "../context/AppContext";
interface RenameNodeModalProps {
  onClose: () => void;
}

const RenameNodeModal = ({ onClose }: RenameNodeModalProps) => {
  const { renameNodeId, setRenameNodeId } = useAppContext();
  const [newNodeName, setNewNodeName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadNode = async () => {
      if (!renameNodeId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const node = await db.nodes.get(renameNodeId);
        if (!node) {
          toast.error("The selected file or folder no longer exists.");
          onClose();
          return;
        }
        setOriginalName(node.title);
        setNewNodeName(node.title);
        requestAnimationFrame(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        });
      } catch (error) {
        console.error("Failed to load node:", error);
        toast.error("Failed to load the item.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    loadNode();
  }, [renameNodeId, onClose]);

  const handleClose = () => {
    setRenameNodeId(null);
    onClose();
  };

  const handleRenameNode = async () => {
    const trimmedName = newNodeName.trim();
    if (!renameNodeId) {
      toast.error("No file or folder selected.");
      return;
    }
    if (!trimmedName) {
      toast.error("Name cannot be empty.");
      return;
    }
    if (trimmedName === originalName) {
      handleClose();
      return;
    }

    try {
      setIsRenaming(true);
      await renameNode(renameNodeId, trimmedName);
      toast.success("Renamed successfully.");
      handleClose();
    } catch (error) {
      console.error("Failed to rename node:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to rename item.",
      );
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameNode();
    }

    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <div
      onClick={handleClose}
      className="bg-black/30 fixed inset-0 z-60 flex items-center justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-sm overflow-hidden shadow-sm flex flex-col w-9/10 sm:w-1/2 md:w-1/3 lg:w-1/4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 pl-2">
            <p className="text-sm">Rename</p>
          </div>

          <button
            onClick={handleClose}
            title="Close"
            disabled={isRenaming}
            className="hover:bg-red-500 hover:text-white py-2 px-4 disabled:opacity-50">
            <IoMdClose size={14} />
          </button>
        </div>

        <div className="w-full h-0.5 bg-black/5" />

        <div className="py-2 space-y-2 px-3">
          <p>Enter new name:</p>

          <input
            ref={inputRef}
            className="bg-black/8 w-full border-b-2 border-transparent focus:border-blue-500 outline-none px-1 py-0.5 disabled:opacity-50"
            type="text"
            value={newNodeName}
            disabled={isLoading || isRenaming}
            onChange={(e) => setNewNodeName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="flex justify-end px-3 my-3 gap-2">
          <button
            onClick={handleClose}
            disabled={isRenaming}
            className="bg-black/8 px-2 py-0.5 rounded-sm hover:opacity-85 disabled:opacity-50">
            Cancel
          </button>

          <button
            onClick={handleRenameNode}
            disabled={isLoading || isRenaming}
            className="bg-blue-500 px-2 py-0.5 rounded-sm hover:opacity-85 text-white disabled:opacity-50">
            {isRenaming ? "Renaming..." : "Rename"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameNodeModal;
