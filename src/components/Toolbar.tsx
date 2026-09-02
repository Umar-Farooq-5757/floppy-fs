import { useAppContext } from "../context/AppContext";

import { MdOutlineFileUpload } from "react-icons/md";

import { IoArrowBackOutline } from "react-icons/io5";

import { FaAngleRight } from "react-icons/fa";

import { IoIosSearch } from "react-icons/io";

import { VscNewFile, VscNewFolder } from "react-icons/vsc";

type SortBy = "name" | "date" | "size";

interface ToolbarProps {
  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;

  currentFolderId: string | null;
  setCurrentFolderId: React.Dispatch<React.SetStateAction<string | null>>;

  setIsNewNodeModalOpen: (isOpen: boolean) => void;

  setCreatingFileOrFolder: React.Dispatch<
    React.SetStateAction<"file" | "folder">
  >;

  viewType: "grid" | "list";

  sortBy: SortBy;
  setSortBy: React.Dispatch<React.SetStateAction<SortBy>>;

  handleImportFile: (file: File) => Promise<void>;

  showFileExtensions: boolean;
  setShowFileExtensions: React.Dispatch<React.SetStateAction<boolean>>;
}

const Toolbar: React.FC<ToolbarProps> = ({
  searchValue,
  setSearchValue,

  currentFolderId,
  setCurrentFolderId,

  setIsNewNodeModalOpen,
  setCreatingFileOrFolder,

  viewType,

  sortBy,
  setSortBy,

  handleImportFile,

  showFileExtensions,
  setShowFileExtensions,
}) => {
  const { breadCrumb, currentFolder } = useAppContext();

  return (
    <>
      <section className="flex flex-wrap items-center gap-2 border border-black/4 bg-black/4 px-3 py-2">
        <button
          type="button"
          onClick={() => {
            setCreatingFileOrFolder("file");
            setIsNewNodeModalOpen(true);
          }}
          className="flex w-fit cursor-default items-center gap-2 rounded-xs px-2 py-1 hover:bg-black/5 active:bg-black/8">
          <VscNewFile />

          <p className="text-sm">New File</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setCreatingFileOrFolder("folder");
            setIsNewNodeModalOpen(true);
          }}
          className="flex w-fit cursor-default items-center gap-2 rounded-xs px-2 py-1 hover:bg-black/5 active:bg-black/8">
          <VscNewFolder />

          <p className="text-sm">New Folder</p>
        </button>

        <label className="flex w-fit cursor-default items-center gap-2 rounded-xs px-2 py-1 hover:bg-black/5 active:bg-black/8">
          <MdOutlineFileUpload />

          <p className="text-sm">
            Import File{" "}
            <span className="hidden sm:inline">(media, text, documents)</span>
          </p>

          <input
            type="file"
            className="hidden"
            accept={[
              "image/*",
              "video/*",
              "audio/*",

              "text/*",

              "application/json",

              "application/pdf",
              ".pdf",

              "application/msword",
              ".doc",

              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              ".docx",
            ].join(",")}
            onChange={async (e) => {
              const file = e.target.files?.[0];

              if (!file) {
                return;
              }

              try {
                await handleImportFile(file);
              } catch (error) {
                console.error(`Failed to import ${file.name}:`, error);
              } finally {
                e.target.value = "";
              }
            }}
          />
        </label>
      </section>

      <section className="flex w-full flex-wrap items-center gap-3 px-3 py-2">
        <button
          type="button"
          onClick={() => setCurrentFolderId(currentFolder?.parentId ?? null)}
          disabled={currentFolderId === null}
          className="shrink-0 rounded-xs p-2 hover:bg-black/10 active:bg-black/15 disabled:opacity-40">
          <IoArrowBackOutline />
        </button>

        <div className="flex min-w-0 grow cursor-default items-center overflow-x-auto whitespace-nowrap border border-black/25 px-2 py-1">
          {breadCrumb.map((item, idx) => (
            <button
              type="button"
              onClick={() => setCurrentFolderId(item.folderId)}
              key={`${item.folderId ?? "root"}-${idx}`}
              className="mx-0.5 flex min-w-0 shrink-0 items-center px-0.5 hover:bg-black/7">
              <span className="truncate">{item.folderName}</span>

              {idx !== breadCrumb.length - 1 && (
                <FaAngleRight className="shrink-0 opacity-70" />
              )}
            </button>
          ))}
        </div>

        {viewType === "list" && (
          <div className="hidden h-8 shrink-0 items-center border border-black/25 px-2 lg:flex">
            <p className="mr-2 whitespace-nowrap text-sm">Sort by:</p>

            <select
              className="bg-transparent text-sm outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}>
              <option value="name">Name</option>

              <option value="date">Date created</option>

              <option value="size">Size</option>
            </select>
          </div>
        )}

        <label
          className="hidden h-8 shrink-0 select-none items-center gap-2 border border-black/25 px-2 hover:bg-black/4 md:flex"
          title="Show or hide file extensions">
          <span className="whitespace-nowrap text-sm">File extensions</span>

          <input
            type="checkbox"
            checked={showFileExtensions}
            onChange={(e) => setShowFileExtensions(e.target.checked)}
            className="size-4 shrink-0 accent-blue-500"
          />
        </label>

        <div className="hidden h-8 w-64 shrink-0 items-center gap-2 border border-black/25 px-2 sm:flex">
          <IoIosSearch className="shrink-0" />

          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="min-w-0 w-full bg-transparent outline-none"
            type="text"
            placeholder="Search..."
          />
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2 px-3 pb-2">
        {viewType === "list" && (
          <div className="flex h-8 items-center border border-black/25 px-2 lg:hidden">
            <p className="mr-2 whitespace-nowrap text-sm">Sort by:</p>

            <select
              className="bg-transparent text-sm outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}>
              <option value="name">Name</option>

              <option value="date">Date created</option>

              <option value="size">Size</option>
            </select>
          </div>
        )}

        <label
          className="flex h-8 select-none items-center gap-2 border border-black/25 px-2 hover:bg-black/4 md:hidden"
          title="Show or hide file extensions">
          <span className="whitespace-nowrap text-sm">File extensions</span>

          <input
            type="checkbox"
            checked={showFileExtensions}
            onChange={(e) => setShowFileExtensions(e.target.checked)}
            className="size-4 shrink-0 accent-blue-500"
          />
        </label>
      </section>

      <section className="flex items-center px-3 pb-2 sm:hidden">
        <div className="flex h-8 w-full items-center gap-2 border border-black/25 px-2">
          <IoIosSearch className="shrink-0" />

          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="min-w-0 w-full bg-transparent outline-none"
            type="text"
            placeholder="Search..."
          />
        </div>
      </section>
    </>
  );
};

export default Toolbar;
