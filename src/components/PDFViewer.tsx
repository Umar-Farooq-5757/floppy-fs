import { useState } from "react";

import { FiMinimize } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import { VscChromeMaximize } from "react-icons/vsc";

import { useAppContext } from "../context/AppContext";

const PdfViewer = () => {
  const { activeFile, setActiveFile } = useAppContext();

  const [viewerSize, setViewerSize] = useState({
    height: "h-[80vh] sm:h-[75vh]",
    width: "w-[95vw] sm:w-[75vw] lg:w-[65vw]",
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
        className={`flex flex-col overflow-hidden rounded-sm bg-white font-mono text-black shadow-xl transition-all ${viewerSize.height} ${viewerSize.width}`}>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2 pl-2">
            <img
              className="size-5 shrink-0 object-contain"
              src="/img/pdf.png"
              alt="PDF Viewer"
            />

            <p className="truncate text-sm">
              {activeFile?.file.title} - Floppy PDF Viewer
            </p>
          </div>

          <div className="flex">
            <button
              onClick={() =>
                setViewerSize({
                  height: "h-3/5",
                  width: "w-11/12 sm:w-3/5",
                })
              }
              title="Minimize"
              className="px-4 py-2 hover:bg-black/7">
              <FiMinimize size={14} />
            </button>

            <button
              onClick={() =>
                setViewerSize({
                  height: "h-[95vh]",
                  width: "w-[98vw]",
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

        <div className="flex-1 overflow-hidden bg-black/5">
          {activeFile?.objectUrl && (
            <iframe
              src={activeFile.objectUrl}
              title={activeFile.file.title}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
