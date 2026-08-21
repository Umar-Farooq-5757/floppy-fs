import { IoMdClose } from "react-icons/io";
import NotepadImg from "../../public/img/notepad.png";
import { VscChromeMaximize } from "react-icons/vsc";
import { FiMinimize } from "react-icons/fi";
import { useState } from "react";

const Notepad = ({ title, text, setActiveFile }) => {
  const [notepadSize, setNotepadSize] = useState({
    height: "60%",
    width: "60%",
  });
  const [notepadText,setNotepadText] = useState(text)
  return (
    <div
      onClick={() => setActiveFile(null)}
      className="bg-black/30 fixed inset-0 flex items-center justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ height: notepadSize.height, width: notepadSize.width }}
        className="bg-white font-mono rounded-sm overflow-hidden shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 pl-2">
            <img className="size-4.5" src={NotepadImg} alt="Notepad Icon" />
            <p className="text-sm">{title} - Notepad</p>
          </div>
          <div className="flex">
            <button onClick={() => setNotepadSize({ height: "60%", width: "60%" })} title="minimize" className="hover:bg-black/7 py-2 px-4">
              <FiMinimize size={14} />
            </button>
            <button
              onClick={() => setNotepadSize({ height: "100%", width: "100%" })}
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
        <div className="w-full h-0.5 bg-black/5"></div>
        <textarea 
        className="outline-none px-2 py-1 w-full h-full"
          value={notepadText} 
          onChange={(e)=>setNotepadText(e.target.value)}
        />
      </div>
    </div>
  );
};

export default Notepad;
