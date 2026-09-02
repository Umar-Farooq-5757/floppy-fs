import { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import {
  createFile,
  createFolder,
  deleteNode,
  formatFileSize,
  getFileContentByHash,
  getNodeTree,
  renameNode,
  type TreeNode,
} from "../db/fileOperations";
import moment from "moment";
interface TerminalOutputs {
  path: string[];
  command: string;
  result: React.ReactNode;
}
/**
 * Parses command arguments while supporting:
 *
 * command file.txt
 * command "file with spaces.txt"
 * command 'file with spaces.txt'
 */
const parseCommandArgs = (str: string): string[] => {
  const args: string[] = [];
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(str)) !== null) {
    args.push(
      match[1] !== undefined
        ? match[1]
        : match[2] !== undefined
          ? match[2]
          : match[0],
    );
  }
  return args;
};
const Terminal = () => {
  const {
    currentItems,
    breadCrumb,
    currentFolder,
    currentFolderId,
    setCurrentFolderId,
    handleOpenFile,
    activeFile,
  } = useAppContext();
  const [command, setCommand] = useState("");
  const [terminalOutputs, setTerminalOutputs] = useState<TerminalOutputs[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  /*
   * Focus the terminal input only when the terminal becomes active.
   *
   * IMPORTANT:
   * We intentionally do NOT refocus the input when it loses focus.
   * This allows users to:
   *
   * - select terminal output
   * - copy text
   * - click elsewhere
   * - use Ctrl+C normally
   * - interact with other UI elements
   */
  useEffect(() => {
    if (!activeFile) {
      inputRef.current?.focus();
    }
  }, [activeFile]);
  /*
   * Automatically scroll to the newest terminal output.
   *
   * This runs whenever a new command/result is added.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [terminalOutputs]);
  const updateTerminalOutputs = (
    trimmedCommand: string,
    result: React.ReactNode,
  ) => {
    setTerminalOutputs((prev) => [
      ...prev,
      {
        path: breadCrumb.map((item) => item.folderName),
        command: trimmedCommand,
        result,
      },
    ]);
  };
  const renderHelp = () => {
    const commands = [
      ["ls", "List files and folders in the current directory."],
      ["ls -la", "Show detailed information including size and type."],
      ["cd <folder>", "Change to a folder."],
      ["cd ..", "Move to the parent folder."],
      ["mkdir <folder>", "Create a new folder."],
      ["touch <file>", "Create a new empty file."],
      ["rm <target>", "Delete a file or folder."],
      ["rename <old> <new>", "Rename a file or folder."],
      ["cat <file>", "Display the contents of a text file."],
      ["edit <file>", "Open a file in the editor."],
      ["tree", "Display the directory as a recursive tree."],
      ["export <file>", "Download a file from the browser filesystem."],
      ["clear", "Clear the terminal."],
      ["--help", "Show this help message."],
    ];
    return (
      <div className="space-y-1.5">
        <p className="mb-2 font-semibold text-yellow-300">
          Available commands:
        </p>
        {commands.map(([commandName, description]) => (
          <div
            key={commandName}
            className="grid grid-cols-[minmax(130px,180px)_1fr] gap-4">
            <span className="text-emerald-400">{commandName}</span>
            <span className="text-white/80">{description}</span>
          </div>
        ))}
      </div>
    );
  };
  const getItemSize = (item: any): string => {
    if (item.type === "folder") {
      return "—";
    }
    return formatFileSize(item.size ?? 0);
  };
  const renderList = () => {
    if (!currentItems || currentItems.length === 0) {
      return <div className="text-white/60">Directory is empty.</div>;
    }
    return (
      <div className="space-y-0.5">
        {currentItems.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[minmax(0,1fr)_90px] gap-4">
            <span
              className={
                item.type === "folder"
                  ? "font-semibold text-emerald-400 underline"
                  : "text-white"
              }>
              {item.title}
              {item.type === "folder" ? "/" : ""}
            </span>
            <span className="text-right text-white/60">
              {getItemSize(item)}
            </span>
          </div>
        ))}
      </div>
    );
  };
  const renderDetailedList = () => {
    if (!currentItems || currentItems.length === 0) {
      return <div className="text-white/60">Directory is empty.</div>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-175 border-collapse">
          <thead>
            <tr className="border-b border-white/20 text-white/60">
              <th className="p-2 text-left font-semibold">Name</th>
              <th className="p-2 text-right font-semibold">Size</th>
              <th className="p-2 text-left font-semibold">Type</th>
              <th className="p-2 text-left font-semibold">Created</th>
              <th className="p-2 text-left font-semibold">Hash</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <tr
                key={item.id}
                className="border-b border-white/10 last:border-b-0">
                <td
                  className={`p-2 ${
                    item.type === "folder"
                      ? "font-semibold text-emerald-400 underline"
                      : "text-white"
                  }`}>
                  {item.title}
                  {item.type === "folder" ? "/" : ""}
                </td>
                <td className="whitespace-nowrap p-2 text-right text-white/70">
                  {getItemSize(item)}
                </td>
                <td className="p-2 text-white/70">
                  {item.type === "folder"
                    ? "File folder"
                    : item.mimeType || "Unknown"}
                </td>
                <td className="whitespace-nowrap p-2 text-white/70">
                  {moment(item.createdAt).fromNow()}
                </td>
                <td className="max-w-45 truncate p-2 text-white/50">
                  {item.hash || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  /**
   * Recursively render the tree structure.
   */
  const renderTree = (nodes: TreeNode[], prefix = ""): React.ReactNode => {
    return nodes.map((node, index) => {
      const lastNode = index === nodes.length - 1;
      const connector = lastNode ? "└── " : "├── ";
      const childPrefix = prefix + (lastNode ? "    " : "│   ");
      return (
        <div key={node.id}>
          <div>
            <span
              className={
                node.type === "folder"
                  ? "font-semibold text-emerald-400"
                  : "text-white"
              }>
              {prefix}
              {connector}
              {node.title}
              {node.type === "folder" ? "/" : ""}
              {node.type === "file" ? (
                <span className="ml-2 text-white/50">
                  ({formatFileSize(node.size ?? 0)})
                </span>
              ) : null}
            </span>
          </div>
          {node.children && node.children.length > 0
            ? renderTree(node.children, childPrefix)
            : null}
        </div>
      );
    });
  };
  /**
   * Export a file from the browser filesystem.
   */
  const exportFile = async (file: any): Promise<void> => {
    if (file.type !== "file") {
      throw new Error(
        `"${file.title}" is a folder. Only files can be exported.`,
      );
    }
    if (!file.hash) {
      throw new Error(
        `File content for "${file.title}" is unavailable because it has no content hash.`,
      );
    }
    const rawContent = await getFileContentByHash(file.hash);
    if (rawContent === null || rawContent === undefined) {
      throw new Error(`Unable to read the contents of "${file.title}".`);
    }
    let blob: Blob;
    if (rawContent instanceof Blob) {
      blob = rawContent;
    } else if (typeof rawContent === "string") {
      blob = new Blob([rawContent], {
        type: file.mimeType || "text/plain",
      });
    } else {
      throw new Error(
        `Unable to export "${file.title}" because its content format is unsupported.`,
      );
    }
    const objectUrl = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.title;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } finally {
      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    }
  };
  const processCommand = async () => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) {
      return;
    }
    setCommand("");
    const args = parseCommandArgs(trimmedCommand);
    if (args.length === 0) {
      return;
    }
    const cmd = args[0].toLowerCase();
    try {
      /*
       * HELP
       */
      if (trimmedCommand === "--help" || cmd === "help") {
        updateTerminalOutputs(trimmedCommand, renderHelp());
        return;
      }
      /*
       * CLEAR
       */
      if (cmd === "clear") {
        setTerminalOutputs([]);
        return;
      }
      /*
       * LS
       */
      if (cmd === "ls") {
        if (args.length > 2) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              ls: too many arguments.
              <div className="mt-1 text-white/60">Usage: ls [options]</div>
            </div>,
          );
          return;
        }
        const option = args[1];
        if (option && option !== "-la" && option !== "-l") {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              ls: unknown option "{option}".
              <div className="mt-1 text-white/60">
                Try <span className="text-emerald-400">ls</span> or{" "}
                <span className="text-emerald-400">ls -la</span>.
              </div>
            </div>,
          );
          return;
        }
        updateTerminalOutputs(
          trimmedCommand,
          option ? renderDetailedList() : renderList(),
        );
        return;
      }
      /*
       * MKDIR
       */
      if (cmd === "mkdir") {
        if (!args[1]) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              mkdir: missing folder name.
              <div className="mt-1 text-white/60">
                Usage: mkdir &lt;foldername&gt;
              </div>
            </div>,
          );
          return;
        }
        if (args.length > 2) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              mkdir: too many arguments.
              <div className="mt-1 text-white/60">
                Use quotes for folder names containing spaces.
              </div>
            </div>,
          );
          return;
        }
        const folderName = args[1];
        await createFolder(currentFolderId, folderName);
        updateTerminalOutputs(
          trimmedCommand,
          <div className="text-emerald-400">
            Created folder "{folderName}".
          </div>,
        );
        return;
      }
      /*
       * TOUCH
       */
      /*
       * TOUCH
       */
      if (cmd === "touch") {
        if (!args[1]) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              touch: missing file name.
              <div className="mt-1 text-white/60">
                Usage: touch &lt;filename&gt;
              </div>
            </div>,
          );
          return;
        }
        if (args.length > 2) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              touch: too many arguments.
              <div className="mt-1 text-white/60">
                Use quotes for filenames containing spaces.
              </div>
            </div>,
          );
          return;
        }
        const requestedFileName = args[1].trim();
        /*
         * Reject empty names.
         */
        if (!requestedFileName) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              touch: file name cannot be empty.
            </div>,
          );
          return;
        }

        /*
         * A filename starting with "." but containing no actual
         * name should not be accepted.
         *
         * Examples:
         * ".txt" → invalid
         * "."    → invalid
         */
        if (requestedFileName === "." || requestedFileName === ".txt") {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              touch: invalid file name "{requestedFileName}".
              <div className="mt-1 text-white/60">
                A file name must contain characters before the extension.
              </div>
            </div>,
          );
          return;
        }

        /*
         * Check whether the filename already has an extension.
         *
         * We only allow .txt files for now.
         */
        const lastDotIndex = requestedFileName.lastIndexOf(".");
        const hasExtension =
          lastDotIndex > 0 && lastDotIndex < requestedFileName.length - 1;

        /*
         * Filename ends with a dot.
         *
         * Example:
         * notes.
         */
        if (requestedFileName.endsWith(".") && requestedFileName.length > 1) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              touch: "{requestedFileName}" has an invalid file extension.
              <div className="mt-1 text-white/60">
                Only .txt files are currently supported.
              </div>
            </div>,
          );
          return;
        }

        let fileName = requestedFileName;

        /*
         * No extension was provided.
         *
         * Automatically append ".txt".
         *
         * Example:
         * touch notes
         * → notes.txt
         */
        if (!hasExtension) {
          fileName = `${requestedFileName}.txt`;
        } else {
          /*
           * An extension was provided.
           * Only ".txt" is allowed.
           */
          const extension = requestedFileName
            .slice(lastDotIndex + 1)
            .toLowerCase();

          if (extension !== "txt") {
            updateTerminalOutputs(
              trimmedCommand,
              <div className="text-red-400">
                touch: unsupported file type "{requestedFileName}".
                <div className="mt-1 text-white/60">
                  Only .txt files are currently supported.
                </div>
              </div>,
            );
            return;
          }

          /*
           * Normalize the extension.
           *
           * Example:
           * NOTES.TXT → NOTES.txt
           */
          fileName = requestedFileName.slice(0, lastDotIndex) + ".txt";
        }

        await createFile(currentFolderId, fileName, "");

        updateTerminalOutputs(
          trimmedCommand,
          <div className="text-emerald-400">
            Created file "{fileName}".
            {fileName !== requestedFileName ? (
              <span className="ml-2 text-white/50">
                (.txt extension added automatically)
              </span>
            ) : null}
          </div>,
        );

        return;
      }
      /*
       * RENAME
       */
      if (cmd === "rename" || cmd === "ren") {
        if (!args[1] || !args[2]) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              {cmd}: missing file/folder name.
              <div className="mt-1 text-white/60">
                Usage: rename &lt;oldname&gt; &lt;newname&gt;
              </div>
            </div>,
          );
          return;
        }
        if (args.length > 3) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              {cmd}: too many arguments.
              <div className="mt-1 text-white/60">
                If a name contains spaces, wrap it in quotes.
              </div>
            </div>,
          );
          return;
        }
        const oldName = args[1];
        const newName = args[2];
        const matchingNode = currentItems?.find(
          (item) => item.title === oldName,
        );
        if (!matchingNode) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              {cmd}: cannot find file or folder "{oldName}".
            </div>,
          );
          return;
        }
        await renameNode(matchingNode.id, newName);
        updateTerminalOutputs(
          trimmedCommand,
          <div className="text-emerald-400">
            Renamed "{oldName}" to "{newName}".
          </div>,
        );
        return;
      }
      /*
       * RM
       */
      if (cmd === "rm") {
        if (!args[1]) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              rm: missing target.
              <div className="mt-1 text-white/60">
                Usage: rm &lt;filename-or-foldername&gt;
              </div>
            </div>,
          );
          return;
        }
        if (args.length > 2) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              rm: too many arguments.
              <div className="mt-1 text-white/60">
                Use quotes for names containing spaces.
              </div>
            </div>,
          );
          return;
        }
        const targetName = args[1];
        const matchingTarget = currentItems?.find(
          (item) => item.title === targetName,
        );
        if (!matchingTarget) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">rm: cannot find "{targetName}".</div>,
          );
          return;
        }
        await deleteNode(matchingTarget.id);
        updateTerminalOutputs(
          trimmedCommand,
          <div className="text-emerald-400">
            Deleted {matchingTarget.type === "folder" ? "folder" : "file"} "
            {matchingTarget.title}".
          </div>,
        );
        return;
      }
      /*
       * CD
       */
      if (cmd === "cd") {
        if (!args[1]) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              cd: missing directory.
              <div className="mt-1 text-white/60">
                Usage: cd &lt;foldername&gt;
              </div>
            </div>,
          );
          return;
        }
        if (args.length > 2) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">cd: too many arguments.</div>,
          );
          return;
        }
        const targetName = args[1];
        if (targetName === "..") {
          setCurrentFolderId(currentFolder?.parentId ?? null);
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-emerald-400">Moved to parent directory.</div>,
          );
          return;
        }
        if (targetName === ".") {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-white/60">
              Already in the current directory.
            </div>,
          );
          return;
        }
        const matchingFolder = currentItems?.find(
          (item) => item.type === "folder" && item.title === targetName,
        );
        if (!matchingFolder) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              cd: no such directory "{targetName}".
            </div>,
          );
          return;
        }
        setCurrentFolderId(matchingFolder.id);
        updateTerminalOutputs(
          trimmedCommand,
          <div className="text-emerald-400">
            Changed directory to "{matchingFolder.title}".
          </div>,
        );
        return;
      }
      /*
       * EDIT
       */
      if (cmd === "edit") {
        if (!args[1]) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              edit: missing file name.
              <div className="mt-1 text-white/60">
                Usage: edit &lt;filename&gt;
              </div>
            </div>,
          );
          return;
        }
        if (args.length > 2) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">edit: too many arguments.</div>,
          );
          return;
        }
        const targetName = args[1];
        const matchingFile = currentItems?.find(
          (item) => item.type === "file" && item.title === targetName,
        );
        if (!matchingFile) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              edit: cannot find file "{targetName}".
            </div>,
          );
          return;
        }
        await handleOpenFile(matchingFile);
        updateTerminalOutputs(
          trimmedCommand,
          <div className="text-emerald-400">
            Opened "{targetName}" in the editor.
          </div>,
        );
        return;
      }
      /*
       * CAT
       */
      if (cmd === "cat") {
        if (!args[1]) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              cat: missing file name.
              <div className="mt-1 text-white/60">
                Usage: cat &lt;filename&gt;
              </div>
            </div>,
          );
          return;
        }
        if (args.length > 2) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">cat: too many arguments.</div>,
          );
          return;
        }
        const targetName = args[1];
        const matchingFile = currentItems?.find(
          (item) => item.type === "file" && item.title === targetName,
        );
        if (!matchingFile) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              cat: cannot find file "{targetName}".
            </div>,
          );
          return;
        }
        if (matchingFile.mimeType === "text/plain") {
          if (!matchingFile.hash) {
            updateTerminalOutputs(
              trimmedCommand,
              <div className="text-red-400">
                cat: file content is unavailable because the file has no content
                hash.
              </div>,
            );
            return;
          }
          const rawContent = await getFileContentByHash(matchingFile.hash);
          if (typeof rawContent !== "string") {
            updateTerminalOutputs(
              trimmedCommand,
              <div className="text-red-400">
                cat: unable to read "{targetName}" as text.
              </div>,
            );
            return;
          }
          updateTerminalOutputs(
            trimmedCommand,
            <div className="whitespace-pre-wrap wrap-break-word text-white">
              {rawContent || (
                <span className="text-white/50">File is empty.</span>
              )}
            </div>,
          );
          return;
        }
        if (
          matchingFile.mimeType?.startsWith("image/") ||
          matchingFile.mimeType?.startsWith("video/")
        ) {
          if (!matchingFile.hash) {
            updateTerminalOutputs(
              trimmedCommand,
              <div className="text-red-400">
                cat: file content is unavailable because the file has no content
                hash.
              </div>,
            );
            return;
          }
          const rawContent = await getFileContentByHash(matchingFile.hash);
          if (!(rawContent instanceof Blob)) {
            updateTerminalOutputs(
              trimmedCommand,
              <div className="text-red-400">
                cat: unable to load "{targetName}".
              </div>,
            );
            return;
          }
          const objectUrl = URL.createObjectURL(rawContent);
          updateTerminalOutputs(
            trimmedCommand,
            <div className="my-2">
              {matchingFile.mimeType?.startsWith("image/") ? (
                <img
                  src={objectUrl}
                  alt={matchingFile.title}
                  className="max-h-[60vh] max-w-full rounded border border-emerald-500/30 object-contain"
                />
              ) : (
                <video
                  src={objectUrl}
                  controls
                  className="max-h-[60vh] max-w-full rounded"
                />
              )}
            </div>,
          );
          return;
        }
        updateTerminalOutputs(
          trimmedCommand,
          <div className="text-yellow-300">
            cat: "{targetName}" is not a text file.
            <div className="mt-1 text-white/60">
              MIME type: {matchingFile.mimeType || "Unknown"}
            </div>
            <div className="text-white/60">
              Use <span className="text-emerald-400">edit</span> to open the
              file in its associated editor.
            </div>
          </div>,
        );
        return;
      }
      /*
       * TREE
       */
      if (cmd === "tree") {
        if (args.length > 1) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              tree: too many arguments.
              <div className="mt-1 text-white/60">Usage: tree</div>
            </div>,
          );
          return;
        }
        const treeNodes = await getNodeTree(currentFolderId);
        if (treeNodes.length === 0) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-white/60">Directory is empty.</div>,
          );
          return;
        }
        updateTerminalOutputs(
          trimmedCommand,
          <div className="overflow-x-auto whitespace-pre">
            {renderTree(treeNodes)}
          </div>,
        );
        return;
      }
      /*
       * EXPORT
       */
      if (cmd === "export") {
        if (!args[1]) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              export: missing file name.
              <div className="mt-1 text-white/60">
                Usage: export &lt;filename&gt;
              </div>
            </div>,
          );
          return;
        }
        if (args.length > 2) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              export: too many arguments.
              <div className="mt-1 text-white/60">
                Use quotes for filenames containing spaces.
              </div>
            </div>,
          );
          return;
        }
        const targetName = args[1];
        const matchingFile = currentItems?.find(
          (item) => item.type === "file" && item.title === targetName,
        );
        if (!matchingFile) {
          updateTerminalOutputs(
            trimmedCommand,
            <div className="text-red-400">
              export: cannot find file "{targetName}".
            </div>,
          );
          return;
        }
        await exportFile(matchingFile);
        updateTerminalOutputs(
          trimmedCommand,
          <div className="text-emerald-400">
            Exported "{targetName}" successfully.
          </div>,
        );
        return;
      }
      /*
       * UNKNOWN COMMAND
       */
      updateTerminalOutputs(
        trimmedCommand,
        <div className="text-red-400">
          {cmd}: command not found.
          <div className="mt-1 text-white/60">
            Type <span className="text-emerald-400">--help</span> to see the
            available commands.
          </div>
        </div>,
      );
    } catch (error) {
      console.error(`Terminal command failed: ${trimmedCommand}`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      updateTerminalOutputs(
        trimmedCommand,
        <div className="text-red-400">
          {cmd}: {errorMessage}
        </div>,
      );
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void processCommand();
    }
  };
  return (
    <div className="terminal p-2 font-mono text-sm select-text">
      <p className="mb-3 font-semibold text-emerald-400">
        Type --help to see available commands
      </p>
      <div>
        {terminalOutputs.map((output, index) => (
          <div key={index} className="mb-5">
            <div className="flex min-w-0 items-start gap-2">
              <p className="shrink-0 font-bold text-emerald-400">
                {output.path.map((path, pathIndex) => (
                  <span key={pathIndex}>
                    {path}
                    {"\\"}
                  </span>
                ))}
                &gt;
              </p>
              <p className="min-w-0 break-all">{output.command}</p>
            </div>
            <div className="mt-1 whitespace-pre-wrap overflow-x-auto">
              {output.result}
            </div>
          </div>
        ))}
        <div className="flex items-start gap-2">
          <p className="shrink-0 font-bold text-emerald-400">
            {breadCrumb.map((item, index) => (
              <span key={index}>
                {item.folderName}
                {"\\"}
              </span>
            ))}
            &gt;
          </p>
          <input
            ref={inputRef}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            className="min-w-0 grow bg-transparent outline-none caret-emerald-500 [caret-animation:manual] [caret-shape:block]"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            style={{
              fontVariantLigatures: "none",
            }}
            aria-label="Terminal command input"
          />
        </div>
        {/* 
          Invisible anchor used as the automatic scroll target.
          Whenever terminalOutputs changes, this is brought into view.
        */}
        <div ref={bottomRef} aria-hidden="true" className="h-px" />
      </div>
    </div>
  );
};
export default Terminal;
