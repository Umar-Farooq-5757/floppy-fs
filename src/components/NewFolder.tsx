import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { createFolder } from "../db/fileOperations";
import toast from "react-hot-toast";

interface NewFolderProps {
  onClose: () => void;
  currentFolderId: string | null;
}

const NewFolder = ({ onClose, currentFolderId }: NewFolderProps) => {
  const [newFoldername, setNewFoldername] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const handleCreateFolder = async () => {
    if (newFoldername) {
      await createFolder(currentFolderId, newFoldername);
      onClose();
    } else {
      toast.error("Folder name cannot be empty");
    }
  };
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <div
      onClick={onClose}
      className="bg-black/30 fixed inset-0 flex items-center justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-sm overflow-hidden shadow-sm flex flex-col w-9/10 sm:w-1/2 md:w-1/3 lg:w-1/4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 pl-2">
            <p className="text-sm">New Folder</p>
          </div>
          <div className="flex">
            <button
              onClick={onClose}
              title="close"
              className="hover:bg-red-500 hover:text-white py-2 px-4">
              <IoMdClose size={14} />
            </button>
          </div>
        </div>
        <div className="w-full h-0.5 bg-black/5"></div>
        <div className="py-2 space-y-2 px-3">
          <p>Enter folder name:</p>
          <input
            ref={inputRef}
            className="bg-black/8 w-full border-b-2 border-transparent focus:border-blue-500 outline-none px-1 py-0.5"
            type="text"
            value={newFoldername}
            onChange={(e) => setNewFoldername(e.target.value)}
          />
        </div>
        <div className="flex justify-end px-3 my-3 gap-2">
          <button
            onClick={onClose}
            className="bg-black/8 px-2 py-0.5 rounded-sm hover:opacity-85">
            Cancel
          </button>
          <button
            onClick={handleCreateFolder}
            className="bg-blue-500 px-2 py-0.5 rounded-sm hover:opacity-85 text-white">
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewFolder;
