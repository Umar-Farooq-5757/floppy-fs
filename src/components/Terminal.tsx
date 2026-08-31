import { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import {
  createFile,
  createFolder,
  deleteNode,
  getFileContentByHash,
} from "../db/fileOperations";

interface TerminalOutputs {
  path: string[];
  command: string;
  result: React.ReactNode;
}

const parseCommandArgs = (str: string): string[] => {
  const args: string[] = [];
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  let match;
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
  const [command, setCommand] = useState<string>("");
  const [terminalOutputs, setTerminalOutputs] = useState<TerminalOutputs[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const handleBlur = () => {
      if (activeFile) return;
      setTimeout(() => {
        input.focus();
      }, 0);
    };
    input.addEventListener("blur", handleBlur);
    return () => {
      input.removeEventListener("blur", handleBlur);
    };
  }, [activeFile]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      processCommand();
    }
  };

  const updateTerminalOutputs = (
    trimmedCommand: string,
    result: React.ReactNode,
  ) => {
    setTerminalOutputs((prev) => [
      ...prev,
      {
        path: breadCrumb.map((i) => i.folderName),
        command: trimmedCommand,
        result,
      },
    ]);
  };

  const processCommand = () => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    const args = parseCommandArgs(trimmedCommand);
    const cmd = args[0];
    const targetName = args[1];
    if (trimmedCommand === "--help") {
      updateTerminalOutputs(
        trimmedCommand,
        <div>
          <p className="text-yellow-300">Available commands:</p>
          <div className="flex gap-44">
            <p>ls</p>
            <p>List all the files/folders in current directory</p>
          </div>
          <div className="flex gap-17">
            <p>cat &lt;filename&gt;</p>
            <p>View the content stored in file</p>
          </div>
          <div className="flex gap-14.5">
            <p>cd &lt;foldername&gt;</p>
            <p>Change directory</p>
          </div>
          <div className="flex gap-8">
            <p>mkdir &lt;foldername&gt;</p>
            <p>Create new folder</p>
          </div>
          <div className="flex gap-12.5">
            <p>touch &lt;filename&gt;</p>
            <p>Create new file</p>
          </div>
          <div className="flex gap-24">
            <p>rm &lt;target&gt;</p>
            <p>Delete file or folder</p>
          </div>
          <div className="flex gap-24">
            <p>edit &lt;filename&gt;</p>
            <p>Open file in the editor</p>
          </div>
          <div className="flex gap-37.5">
            <p>clear</p>
            <p>Clear terminal</p>
          </div>
        </div>,
      );
    } else if (trimmedCommand === "clear") {
      setTerminalOutputs([]);
    } else if (cmd === "mkdir") {
      if (!targetName) {
        updateTerminalOutputs(
          trimmedCommand,
          <div>mkdir: missing operand</div>,
        );
        setCommand("");
        return;
      }
      (async () => {
        await createFolder(currentFolder?.id ?? null, targetName);
        updateTerminalOutputs(trimmedCommand, <div />);
      })();
    } else if (cmd === "touch") {
      if (!targetName) {
        updateTerminalOutputs(
          trimmedCommand,
          <div>touch: missing file name</div>,
        );
        setCommand("");
        return;
      }
      (async () => {
        await createFile(currentFolderId, targetName, "");
        updateTerminalOutputs(trimmedCommand, <div>Created {targetName}</div>);
      })();
    } else if (cmd === "edit") {
      if (!targetName) {
        updateTerminalOutputs(
          trimmedCommand,
          <div>edit: missing file name</div>,
        );
        setCommand("");
        return;
      }
      const matchingFile = currentItems?.find(
        (item) => item.type === "file" && targetName === item.title,
      );
      if (!matchingFile) {
        updateTerminalOutputs(
          trimmedCommand,
          <div>Cannot find file named "{targetName}"</div>,
        );
      } else {
        handleOpenFile(matchingFile);
        updateTerminalOutputs(
          trimmedCommand,
          <div>Opened {targetName} in editor.</div>,
        );
      }
    } else if (cmd === "rm") {
      if (!targetName) {
        updateTerminalOutputs(
          trimmedCommand,
          <div>rm: missing target name</div>,
        );
        setCommand("");
        return;
      }
      (async () => {
        const matchingTarget = currentItems?.filter(
          (item) => targetName === item.title,
        )[0];
        if (!matchingTarget?.id) {
          updateTerminalOutputs(
            trimmedCommand,
            <div>Cannot find file/folder named "{targetName}"</div>,
          );
        } else {
          await deleteNode(matchingTarget.id);
          updateTerminalOutputs(
            trimmedCommand,
            <div>Successfully deleted {matchingTarget.title}</div>,
          );
        }
      })();
    } else if (trimmedCommand === "ls") {
      updateTerminalOutputs(
        trimmedCommand,
        <div className="flex flex-col">
          {currentItems?.map((item, idx) => (
            <span
              key={idx}
              className={`${item.type === "folder" && "underline font-semibold text-emerald-400"}`}>
              {item.title}
            </span>
          ))}
        </div>,
      );
    } else if (cmd === "cd") {
      if (!targetName) {
        updateTerminalOutputs(
          trimmedCommand,
          <div>cd: missing directory name</div>,
        );
        setCommand("");
        return;
      }
      if (targetName === "..") {
        setCurrentFolderId(currentFolder?.parentId ?? null);
        updateTerminalOutputs(trimmedCommand, <div />);
      } else {
        const matchingFolder = currentItems?.filter(
          (item) => item.type === "folder" && targetName === item.title,
        )[0];
        if (!matchingFolder?.id) {
          updateTerminalOutputs(
            trimmedCommand,
            <div>Cannot find folder named "{targetName}"</div>,
          );
        } else {
          setCurrentFolderId(matchingFolder.id);
          updateTerminalOutputs(trimmedCommand, <div />);
        }
      }
    } else if (cmd === "cat") {
      if (!targetName) {
        updateTerminalOutputs(
          trimmedCommand,
          <div>cat: missing file name</div>,
        );
        setCommand("");
        return;
      }
      const matchingFile = currentItems?.filter(
        (item) => item.type === "file" && targetName === item.title,
      )[0];
      if (!matchingFile) {
        updateTerminalOutputs(
          trimmedCommand,
          <div>Cannot find file named "{targetName}"</div>,
        );
      } else if (matchingFile.mimeType === "text/plain") {
        (async () => {
          if (!matchingFile.hash) return;
          const rawContent = await getFileContentByHash(matchingFile.hash);
          let textContent = "";
          if (typeof rawContent === "string") {
            textContent = rawContent;
          }
          updateTerminalOutputs(trimmedCommand, <div>{textContent}</div>);
        })();
      } else if (
        matchingFile.mimeType?.startsWith("image/") ||
        matchingFile.mimeType?.startsWith("video/")
      ) {
        (async () => {
          if (!matchingFile.hash) return;
          const rawContent = await getFileContentByHash(matchingFile.hash);
          if (rawContent instanceof Blob) {
            const objectUrl = URL.createObjectURL(rawContent);
            updateTerminalOutputs(
              trimmedCommand,
              <div className="my-2">
                {matchingFile.mimeType?.startsWith("image/") ? (
                  <img
                    src={objectUrl}
                    alt={matchingFile.title}
                    className="w-200 rounded border border-emerald-500/30 object-contain"
                  />
                ) : (
                  <video src={objectUrl} controls className="max-h-[60vh]" />
                )}
              </div>,
            );
          } else {
            updateTerminalOutputs(
              trimmedCommand,
              <div>Error: Could not load file content.</div>,
            );
          }
        })();
      }
    } else {
      updateTerminalOutputs(
        trimmedCommand,
        `this is result for ${trimmedCommand}`,
      );
    }
    setCommand("");
  };

  return (
    <div className="font-mono p-2 terminal">
      <p className="font-semibold text-emerald-400 mb-3">
        Type --help to see available commands
      </p>
      <div>
        {terminalOutputs.map((output, index) => (
          <div key={index} className="mb-5">
            <div className="flex items-center gap-2">
              <p className="font-bold text-emerald-400">
                {output.path.map((p, idx) => (
                  <span key={idx}>{p}\</span>
                ))}
                &gt;
              </p>
              <p>{output.command}</p>
            </div>
            <div className="whitespace-pre-wrap">{output.result}</div>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <p className="font-bold text-emerald-400">
            {breadCrumb.map((item, idx) => (
              <span key={idx}>{item.folderName}\</span>
            ))}
            &gt;
          </p>
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            ref={inputRef}
            type="text"
            className="caret-emerald-500 [caret-shape:block] [caret-animation:manual] outline-none grow"
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            style={{ fontVariantLigatures: "none" }}
          />
        </div>
      </div>
      <div></div>
    </div>
  );
};

export default Terminal;

/**
 * Commands to be added in future:
 * ls -la (Detailed List): Enhances existing ls command by displaying file sizes, MIME types, creation dates, and hashes in a tabular format.
 * tree: Generates an ASCII tree view of the current folder and all of its nested subdirectories and files, leveraging your browser-based file structure.
 * du: display disk usage
 * export <filename>
 */
