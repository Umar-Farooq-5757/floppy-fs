import { useState } from "react";

import { FiMinimize } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import { VscChromeMaximize } from "react-icons/vsc";

import { useAppContext } from "../context/AppContext";

const AudioPlayer = () => {
  const { activeFile, setActiveFile } = useAppContext();

  const [playerSize, setPlayerSize] = useState({
    height: "h-64",
    width: "w-[95vw] sm:w-[500px]",
  });

  const handleClose = () => {
    if (activeFile?.objectUrl) {
      URL.revokeObjectURL(activeFile.objectUrl);
    }

    setActiveFile(null);
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex flex-col overflow-hidden rounded-sm bg-white font-mono text-black shadow-xl transition-all ${playerSize.height} ${playerSize.width}`}>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2 pl-2">
            <img
              className="size-5 shrink-0 object-contain"
              src="/img/mp3.png"
              alt="Audio Player"
            />

            <p className="truncate text-sm">
              {activeFile?.file.title} - Floppy Audio Player
            </p>
          </div>

          <div className="flex">
            <button
              onClick={() =>
                setPlayerSize({
                  height: "h-56",
                  width: "w-[90vw] sm:w-[400px]",
                })
              }
              title="Minimize"
              className="px-4 py-2 hover:bg-black/7">
              <FiMinimize size={14} />
            </button>

            <button
              onClick={() =>
                setPlayerSize({
                  height: "h-80",
                  width: "w-[98vw] sm:w-[650px]",
                })
              }
              title="Maximize"
              className="px-4 py-2 hover:bg-black/7">
              <VscChromeMaximize size={14} />
            </button>

            <button
              onClick={handleClose}
              title="Close"
              className="px-4 py-2 hover:bg-red-500 hover:text-white">
              <IoMdClose size={14} />
            </button>
          </div>
        </div>

        <div className="h-0.5 w-full bg-black/5" />

        <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-neutral-100 p-6">
          <img
            src="/img/mp3.png"
            alt="Audio"
            className="size-24 object-contain"
          />

          <p className="max-w-full truncate text-center text-sm">
            {activeFile?.file.title}
          </p>

          <audio
            src={activeFile?.objectUrl}
            controls
            autoPlay
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
