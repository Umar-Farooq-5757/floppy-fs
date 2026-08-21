import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  createFolder,
  createFile,
  deleteNode,
  renameNode,
  getFileContentByHash,
  updateFileContent,
} from "../db/fileOperations";
import { Folder, FileText, ArrowLeft, Trash2, Edit3, Plus } from "lucide-react";
import { db } from "../db/db";

export const FileExplorer: React.FC = () => {

  return (
    <div>FileExplorer</div>
  );
};
