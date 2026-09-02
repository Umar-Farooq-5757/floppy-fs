import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { createFile, createFolder } from "../db/fileOperations";
import toast from "react-hot-toast";

interface NewNodeModalProps {
  onClose: () => void;
  currentFolderId: string | null;
  creatingFileOrFolder: "file" | "folder";
}

const NewNodeModal = ({
  onClose,
  currentFolderId,
  creatingFileOrFolder,
}: NewNodeModalProps) => {
  const [newNodeName, setNewNodeName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validateName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(
        `${creatingFileOrFolder === "file" ? "File" : "Folder"} name cannot be empty.`,
      );
      return null;
    }
    if (trimmedName === "." || trimmedName === "..") {
      toast.error("This name is not allowed.");
      return null;
    }
    if (trimmedName.includes("/") || trimmedName.includes("\\")) {
      toast.error("Name cannot contain / or \\.");
      return null;
    }
    return trimmedName;
  };

  const handleCreateFile = async () => {
    if (isLoading) return;
    const name = validateName(newNodeName);
    if (!name) return;
    try {
      setIsLoading(true);

      const fileName = name.toLowerCase().endsWith(".txt")
        ? name
        : `${name}.txt`;
      await createFile(currentFolderId, fileName, "");
      toast.success("File created successfully.");
      onClose();
    } catch (error) {
      console.error("Failed to create file:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create file.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (isLoading) return;
    const name = validateName(newNodeName);
    if (!name) return;

    try {
      setIsLoading(true);
      await createFolder(currentFolderId, name);
      toast.success("Folder created successfully.");
      onClose();
    } catch (error) {
      console.error("Failed to create folder:", error);
      toast.error( 
        error instanceof Error ? error.message : "Failed to create folder.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (creatingFileOrFolder === "file") {
      await handleCreateFile();
    } else {
      await handleCreateFolder();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
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
            <p className="text-sm">
              New {creatingFileOrFolder === "file" ? "File" : "Folder"}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            title="Close"
            className="hover:bg-red-500 hover:text-white py-2 px-4 disabled:opacity-50">
            <IoMdClose size={14} />
          </button>
        </div>

        <div className="w-full h-0.5 bg-black/5" />

        <div className="py-2 space-y-2 px-3">
          <p>
            Enter {creatingFileOrFolder === "file" ? "file" : "folder"} name:
          </p>

          <input
            ref={inputRef}
            className="bg-black/8 w-full border-b-2 border-transparent focus:border-blue-500 outline-none px-1 py-0.5"
            type="text"
            value={newNodeName}
            disabled={isLoading}
            onChange={(e) => setNewNodeName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="flex justify-end px-4 py-3 gap-2 border-t border-black/10">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="bg-black/8 px-3 py-1.5 text-sm rounded-sm hover:bg-black/12 disabled:opacity-50 transition-colors">
            Cancel
          </button>

          <button
            onClick={() => void handleSubmit()}
            disabled={isLoading}
            className="bg-blue-500 px-3 py-1.5 text-sm rounded-sm hover:bg-blue-600 text-white disabled:opacity-50 transition-colors">
            {isLoading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewNodeModal;
