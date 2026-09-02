import { useEffect, useState } from "react";

import mammoth from "mammoth";

import { FiMinimize } from "react-icons/fi";

import { IoMdClose } from "react-icons/io";

import { VscChromeMaximize } from "react-icons/vsc";

import { useAppContext } from "../context/AppContext";

const WordViewer = () => {
  const { activeFile, setActiveFile } = useAppContext();

  const [viewerSize, setViewerSize] = useState({
    height: "h-[80vh] sm:h-[75vh]",
    width: "w-[95vw] sm:w-[75vw] lg:w-[65vw]",
  });

  const [htmlContent, setHtmlContent] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [warnings, setWarnings] = useState<string[]>([]);

  const fileName = activeFile?.file.title ?? "";

  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  const handleClose = () => {
    if (activeFile?.objectUrl) {
      URL.revokeObjectURL(activeFile.objectUrl);
    }

    setActiveFile(null);
  };

  useEffect(() => {
    let cancelled = false;

    const loadDocument = async () => {
      /*
       * Reset viewer state whenever a new document is opened.
       */
      setHtmlContent("");
      setError(null);
      setWarnings([]);

      if (!activeFile?.objectUrl) {
        setLoading(false);

        return;
      }

      /*
       * Mammoth only supports modern DOCX files.
       *
       * Legacy binary DOC files require a desktop application
       * or server-side conversion.
       */
      if (extension === "doc") {
        if (!cancelled) {
          setError(
            "This is a legacy .doc file. Legacy Word documents cannot be reliably rendered directly in the browser. Download the file and open it using Microsoft Word, LibreOffice, or another compatible application.",
          );

          setLoading(false);
        }

        return;
      }

      /*
       * The viewer is intended for DOCX files.
       */
      if (extension !== "docx") {
        if (!cancelled) {
          setError(
            "This file is not a supported Word document. Only .docx files can be rendered in Floppy Word Viewer.",
          );

          setLoading(false);
        }

        return;
      }

      try {
        if (!cancelled) {
          setLoading(true);
        }

        /*
         * Convert the object URL back into its original Blob.
         *
         * We explicitly verify the response before attempting
         * to read the document.
         */
        const response = await fetch(activeFile.objectUrl);

        if (!response.ok) {
          throw new Error(
            `Unable to read document data. HTTP status: ${response.status}`,
          );
        }

        const blob = await response.blob();

        if (blob.size === 0) {
          throw new Error("The document is empty.");
        }

        /*
         * Read the complete DOCX binary data.
         */
        const arrayBuffer = await blob.arrayBuffer();

        if (arrayBuffer.byteLength === 0) {
          throw new Error("The document contains no readable data.");
        }

        /*
         * Mammoth converts DOCX XML into browser-safe HTML.
         */
        const result = await mammoth.convertToHtml({
          arrayBuffer,
        });

        if (cancelled) {
          return;
        }

        /*
         * Mammoth may successfully render a document while
         * reporting unsupported elements as warnings.
         */
        const conversionWarnings = result.messages.map((message) => {
          return message.message;
        });

        setWarnings(conversionWarnings);

        /*
         * A valid document may technically convert to an empty
         * HTML string, for example when it only contains elements
         * Mammoth does not render.
         */
        if (!result.value.trim()) {
          setError(
            "The document was opened successfully, but no displayable content could be extracted from it.",
          );

          setLoading(false);

          return;
        }

        setHtmlContent(result.value);

        setLoading(false);
      } catch (err) {
        console.error("Failed to render Word document:", err);

        if (cancelled) {
          return;
        }

        let errorMessage =
          "Failed to render this Word document. The document may use Word features that are not supported by the browser viewer.";

        if (err instanceof Error) {
          console.error("Word viewer error details:", err.message);

          /*
           * Provide more useful errors for common situations.
           */
          if (
            err.message.toLowerCase().includes("zip") ||
            err.message.toLowerCase().includes("central directory")
          ) {
            errorMessage =
              "This file does not appear to contain valid DOCX data. The file may be corrupted or may have been given a .docx extension without actually being a DOCX document.";
          } else if (err.message.toLowerCase().includes("empty")) {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);

        setLoading(false);
      }
    };

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [activeFile?.objectUrl, extension]);

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex flex-col overflow-hidden rounded-sm bg-white font-mono text-black shadow-xl transition-all ${viewerSize.height} ${viewerSize.width}`}>
        {/* TITLE BAR */}

        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2 pl-2">
            <img
              className="size-5 shrink-0 object-contain"
              src="/img/document.png"
              alt="Word Viewer"
            />

            <p className="truncate text-sm">{fileName} - Floppy Word Viewer</p>
          </div>

          <div className="flex">
            {/* MINIMIZE */}

            <button
              type="button"
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

            {/* MAXIMIZE */}

            <button
              type="button"
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

            {/* CLOSE */}

            <button
              type="button"
              onClick={handleClose}
              title="Close"
              className="px-4 py-2 hover:bg-red-500 hover:text-white">
              <IoMdClose size={14} />
            </button>
          </div>
        </div>

        <div className="h-0.5 w-full bg-black/5" />

        {/* DOCUMENT AREA */}

        <div className="flex-1 overflow-auto bg-neutral-100 p-3 sm:p-6">
          {/* LOADING */}

          {loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-black/60">
              <div className="size-8 animate-spin rounded-full border-2 border-black/15 border-t-black/60" />

              <p>Loading document...</p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center text-center">
              <img
                src="/img/document.png"
                alt="Document"
                className="mb-4 size-20 object-contain"
              />

              <h2 className="mb-2 text-base font-semibold">
                Unable to display document
              </h2>

              <p className="max-w-xl text-sm leading-6 text-black/70">
                {error}
              </p>

              {activeFile?.objectUrl && (
                <a
                  href={activeFile.objectUrl}
                  download={fileName}
                  className="mt-5 rounded-sm bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-black/80">
                  Download document
                </a>
              )}
            </div>
          )}

          {/* DOCUMENT */}

          {!loading && !error && htmlContent && (
            <div className="mx-auto max-w-4xl">
              {/* MAMMOTH WARNINGS */}

              {warnings.length > 0 && (
                <div className="mb-4 border border-amber-500/20 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  <p className="font-semibold">
                    Some document elements may not be displayed exactly as they
                    appear in Microsoft Word.
                  </p>

                  <details className="mt-2">
                    <summary className="cursor-pointer">
                      View conversion details ({warnings.length})
                    </summary>

                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {warnings.map((warning, index) => (
                        <li key={`${warning}-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}

              {/* RENDERED DOCUMENT */}

              <article
                className="prose prose-sm min-h-full max-w-none bg-white p-6 shadow-sm sm:p-10"
                dangerouslySetInnerHTML={{
                  __html: htmlContent,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordViewer;
