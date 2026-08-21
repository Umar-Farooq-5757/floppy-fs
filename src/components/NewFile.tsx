import { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { createFile } from "../db/fileOperations";
import toast from "react-hot-toast";

interface NewFileProps {
  onClose: () => void;
  currentFolderId: string | null;
}

const NewFile = ({ onClose, currentFolderId }: NewFileProps) => {
  const [newFilename, setNewFilename] = useState("");
  const handleCreateFile = async () => {
    if (newFilename) {
      await createFile(currentFolderId, newFilename, "");
      onClose();
    } else {
      toast.error("File name cannot be empty");
    }
  };
  return (
    <div
      onClick={onClose}
      className="bg-black/30 fixed inset-0 flex items-center justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-sm overflow-hidden shadow-sm flex flex-col w-1/4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 pl-2">
            <p className="text-sm">New File</p>
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
          <p>Enter file name:</p>
          <input
            className="bg-black/8 w-full border-b-2 border-transparent focus:border-blue-500 outline-none px-1 py-0.5"
            type="text"
            value={newFilename}
            onChange={(e) => setNewFilename(e.target.value)}
          />
        </div>
        <div className="flex justify-end px-3 my-3 gap-2">
          <button
            onClick={onClose}
            className="bg-black/8 px-2 py-0.5 rounded-sm hover:opacity-85">
            Cancel
          </button>
          <button
            onClick={handleCreateFile}
            className="bg-blue-500 px-2 py-0.5 rounded-sm hover:opacity-85 text-white">
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewFile;
