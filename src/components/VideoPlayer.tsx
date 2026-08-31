import { useState } from "react";
import { FiMinimize } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import { VscChromeMaximize } from "react-icons/vsc";
import { useAppContext } from "../context/AppContext";

const VideoPlayer = () => {
  const { activeFile, setActiveFile } = useAppContext();
  const [videoPlayerSize, setVideoPlayerSize] = useState({
    height: "h-[80vh] sm:h-[70vh]",
    width: "w-[95vw] sm:w-[70vw] lg:w-[60vw]",
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
      className="bg-black/30 fixed inset-0 flex items-center justify-center z-50">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white text-black font-mono rounded-sm overflow-hidden shadow-sm transition-all flex flex-col ${videoPlayerSize.height} ${videoPlayerSize.width}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 pl-2">
            <img
              className="size-4.5"
              src="/img/videoplayer.png"
              alt="Floppy Image Viewer"
            />
            <p className="text-sm">
              {activeFile?.file.title} - Floppy VideoPlayer
            </p>
          </div>
          <div className="flex">
            <button
              onClick={() =>
                setVideoPlayerSize({
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
                setVideoPlayerSize({
                  height: "h-full sm:h-full",
                  width: "w-full sm:w-full",
                })
              }
              title="maximize"
              className="hover:bg-black/7 py-2 px-4">
              <VscChromeMaximize size={14} />
            </button>
            <button
              onClick={() => {
                if (activeFile?.objectUrl) {
                  URL.revokeObjectURL(activeFile.objectUrl);
                }
                setActiveFile(null);
              }}
              title="close"
              className="hover:bg-red-500 hover:text-white py-2 px-4">
              <IoMdClose size={14} />
            </button>
          </div>
        </div>
        <div className="w-full h-0.5 bg-black/5"></div>
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden relative">
          <video
            src={activeFile?.objectUrl}
            controls
            autoPlay
            className="w-full h-full object-contain max-h-full"
          />
        </div>
      </div>
    </div>
  );
};
export default VideoPlayer;
