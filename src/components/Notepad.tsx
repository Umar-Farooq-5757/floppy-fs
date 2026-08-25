import { IoMdClose } from "react-icons/io";
import { VscChromeMaximize } from "react-icons/vsc";
import { FiMinimize } from "react-icons/fi";
import React, { useState, useEffect } from "react";
import { updateFileContent } from "../db/fileOperations";
import toast from "react-hot-toast";
import type { ActiveFile } from "../context/AppContext";

interface NotepadProps {
  id: string;
  title: string;
  text?: string;
  setActiveFile: React.Dispatch<React.SetStateAction<ActiveFile | null>>;
}

const Notepad: React.FC<NotepadProps> = ({
  id,
  title,
  text = "",
  setActiveFile,
}) => {
  const [notepadSize, setNotepadSize] = useState({
    height: "h-full sm:h-3/5",
    width: "w-full sm:w-3/5",
  });
  const [notepadText, setNotepadText] = useState(text);

  useEffect(() => {
    setNotepadText(text);
  }, [text, id]);

  const handleSaveFile = async () => {
    await updateFileContent(id, notepadText);
    toast.success("File saved successfully!");
  };

  return (
    <div
      onClick={() => setActiveFile(null)}
      className="bg-black/30 fixed inset-0 flex items-center justify-center z-50">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white font-mono rounded-sm overflow-hidden shadow-sm transition-all flex flex-col ${notepadSize.height} ${notepadSize.width}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 pl-2">
            <img
              className="size-4.5"
              src="/img/notepad.png"
              alt="Notepad Icon"
            />
            <p className="text-sm">{title} - Floppy Notepad</p>
          </div>
          <div className="flex">
            <button
              onClick={() =>
                setNotepadSize({
                  height: "h-3/4 sm:h-3/5",
                  width: "w-11/12 sm:w-3/5",
                })
              }
              title="minimize"
              className="hover:bg-black/7 py-2 px-4">
              <FiMinimize size={14} />
            </button>
            <button
              onClick={() =>
                setNotepadSize({
                  height: "h-full sm:h-full",
                  width: "w-full sm:w-full",
                })
              }
              title="maximize"
              className="hover:bg-black/7 py-2 px-4">
              <VscChromeMaximize size={14} />
            </button>
            <button
              onClick={() => setActiveFile(null)}
              title="close"
              className="hover:bg-red-500 hover:text-white py-2 px-4">
              <IoMdClose size={14} />
            </button>
          </div>
        </div>
        <button
          onClick={handleSaveFile}
          className="w-fit font-sans text-sm hover:bg-black/7 px-2 py-1">
          Save
        </button>
        <div className="w-full h-0.5 bg-black/5"></div>
        <textarea
          className="outline-none px-2 py-1 w-full flex-1 resize-none"
          value={notepadText}
          onChange={(e) => setNotepadText(e.target.value)}
        />
      </div>
    </div>
  );
};

export default Notepad;
