import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import toast from "react-hot-toast";
import { renameNode } from "../db/fileOperations";
import { db, type FileMetadata } from "../db/db";
import { useAppContext } from "../context/AppContext";

interface RenameNodeModalProps {
  onClose: () => void;
}
const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return "";
  }
  return fileName.slice(lastDotIndex);
};
const getFileNameWithoutExtension = (fileName: string): string => {
  const extension = getFileExtension(fileName);
  if (!extension) {
    return fileName;
  }
  return fileName.slice(0, -extension.length);
};

const RenameNodeModal = ({ onClose }: RenameNodeModalProps) => {
  const { renameNodeId, setRenameNodeId } = useAppContext();
  const [newNodeName, setNewNodeName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [node, setNode] = useState<FileMetadata | null>(null);
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
        const foundNode = await db.nodes.get(renameNodeId);
        if (!foundNode) {
          toast.error("The selected file or folder no longer exists.");
          onClose();
          return;
        }
        setNode(foundNode);
        setOriginalName(foundNode.title);

        /*
         * For files, only allow editing the filename.
         * The extension remains protected.
         */
        if (foundNode.type === "file") {
          setNewNodeName(getFileNameWithoutExtension(foundNode.title));
        } else {
          setNewNodeName(foundNode.title);
        }
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

    void loadNode();
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
    if (!node) {
      toast.error("Failed to load the selected item.");
      return;
    }
    if (!trimmedName) {
      toast.error("Name cannot be empty.");
      return;
    }
    /*
     * Prevent users from entering a slash or backslash.
     */
    if (trimmedName.includes("/") || trimmedName.includes("\\")) {
      toast.error("A name cannot contain / or \\.");
      return;
    }
    let finalName = trimmedName;
    /*
     * Always restore the original extension for files.
     */
    if (node.type === "file") {
      const extension = getFileExtension(originalName);
      if (extension) {
        finalName = `${trimmedName}${extension}`;
      }
    }
    if (finalName === originalName) {
      handleClose();
      return;
    }
    try {
      setIsRenaming(true);
      await renameNode(renameNodeId, finalName);
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
      void handleRenameNode();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  const extension = node?.type === "file" ? getFileExtension(originalName) : "";

  return (
    <div
      onClick={handleClose}
      className="bg-black/30 fixed inset-0 z-60 flex items-center justify-center p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-sm overflow-hidden shadow-lg flex flex-col w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 pl-3">
            <p className="text-sm font-medium">Rename</p>
          </div>
          <button
            onClick={handleClose}
            title="Close"
            disabled={isRenaming}
            className="hover:bg-red-500 hover:text-white py-2 px-4 disabled:opacity-50 transition-colors">
            <IoMdClose size={14} />
          </button>
        </div>
        <div className="w-full h-px bg-black/10" />
        {/* Content */}
        <div className="py-4 px-4 space-y-3">
          <div>
            <p className="text-sm mb-1">
              {node?.type === "file"
                ? "Enter new file name:"
                : "Enter new folder name:"}
            </p>
            <p className="text-xs text-black/50">
              {node?.type === "file"
                ? "The file extension is preserved automatically."
                : "Choose a new name for this folder."}
            </p>
          </div>
          <div className="flex items-center">
            <input
              ref={inputRef}
              className={`bg-black/5 min-w-0 flex-1 border-b-2 border-transparent focus:border-blue-500 outline-none px-2 py-1.5 disabled:opacity-50 ${
                extension ? "rounded-l-sm" : "rounded-sm"
              }`}
              type="text"
              value={newNodeName}
              disabled={isLoading || isRenaming}
              onChange={(e) => setNewNodeName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {/* Locked extension */}
            {extension && (
              <div className="bg-black/10 border-l border-black/10 px-2 py-1.5 text-sm text-black/60 rounded-r-sm select-none">
                {extension}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 gap-2 border-t border-black/10">
          <button
            onClick={handleClose}
            disabled={isRenaming}
            className="bg-black/8 px-3 py-1.5 text-sm rounded-sm hover:bg-black/12 disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => void handleRenameNode()}
            disabled={isLoading || isRenaming || !node}
            className="bg-blue-500 px-3 py-1.5 text-sm rounded-sm hover:bg-blue-600 text-white disabled:opacity-50 transition-colors">
            {isRenaming ? "Renaming..." : "Rename"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameNodeModal;
