import { useState } from "react";
import { FiMinimize } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import { VscChromeMaximize } from "react-icons/vsc";
import { useAppContext } from "../context/AppContext";

interface ImageViewerProps {
  title: string;
}

const ImageViewer = ({ title }: ImageViewerProps) => {
  const { activeFile, setActiveFile } = useAppContext();
  const [imageViewerSize, setImageViewerSize] = useState({
    height: "h-full sm:h-3/5",
    width: "w-full sm:w-3/5",
  });
  return (
    <div
      //   onClick={() => setActiveFile(null)}
      className="bg-black/30 fixed inset-0 flex items-center justify-center z-50">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white font-mono rounded-sm overflow-hidden shadow-sm transition-all flex flex-col ${imageViewerSize.height} ${imageViewerSize.width}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 pl-2">
            <img
              className="size-4.5"
              src="/img/imageviewer.png"
              alt="Notepad Icon"
            />
            <p className="text-sm">{title} - Floppy Image Viewer</p>
          </div>
          <div className="flex">
            <button
              onClick={() =>
                setImageViewerSize({
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
                setImageViewerSize({
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
        <div className="p-2">
          <img
            src={activeFile?.objectUrl}
            alt="preview"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
};
export default ImageViewer;
