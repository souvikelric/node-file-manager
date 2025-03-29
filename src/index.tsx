import React, { useEffect, useState } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

console.clear();

const MAX_VISIBLE_ITEMS = 10; // Max items visible in the list at a time

const KeyBindings: React.FC = () => (
  <Box
    borderStyle="single"
    padding={1}
    flexDirection="row"
    justifyContent="space-around"
  >
    <Text>[↑/↓] Navigate</Text>
    <Text>[Enter] Open</Text>
    <Text>[Delete / Backspace] Go Back</Text>
    <Text>[Q] Quit</Text>
  </Box>
);

const StatusBar = ({ files, folders }: { files: number; folders: number }) => {
  return (
    <Box display="flex" flexDirection="row" gap={1}>
      <Text>Files : {files}</Text>
      <Text>Folders : {folders}</Text>
    </Box>
  );
};

const FileExplorer: React.FC = () => {
  const { exit } = useApp();
  const [currentPath, setCurrentPath] = useState<string>(process.cwd());
  const [files, setFiles] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [filesNum, setFilesNum] = useState<number>(0);
  const [foldersNum, setFoldersNum] = useState<number>(0);

  const countFilesAndFolders = (pspath: string | undefined = undefined) => {
    try {
      if (!currentPath) return;
      let allFiles = pspath
        ? fs.readdirSync(pspath)
        : fs.readdirSync(currentPath);
      let files = 0;
      let folders = 0;
      let nowPath = pspath ?? currentPath;
      allFiles.forEach((af) => {
        let filePath = path.join(nowPath, af);
        if (!fs.statSync(filePath)) return;
        if (fs.statSync(filePath).isDirectory()) {
          folders++;
        } else {
          files++;
        }
      });
      setFilesNum(files);
      setFoldersNum(folders);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    updateFileList();
    countFilesAndFolders();
  }, [currentPath]);

  const updateFileList = () => {
    try {
      const fileList = fs.readdirSync(currentPath);
      setFiles(fileList);
      setSelectedIndex(0);
      setScrollOffset(0);
    } catch (err) {
      console.error("Error reading directory", err);
    }
  };

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      if (selectedIndex - scrollOffset === 0 && scrollOffset > 0) {
        setScrollOffset((prev) => prev - 1);
      }
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(prev + 1, files.length - 1));
      if (
        selectedIndex - scrollOffset >= MAX_VISIBLE_ITEMS - 1 &&
        scrollOffset + MAX_VISIBLE_ITEMS < files.length
      ) {
        setScrollOffset((prev) => prev + 1);
      }
    } else if (key.return) {
      console.clear();
      const selectedFile = files[selectedIndex];
      if (!selectedFile) return;
      const fullPath = path.join(currentPath, selectedFile);
      if (!fs.statSync(fullPath).isDirectory()) {
        console.error("Error: File no longer exists");
        return;
      }
      if (fs.statSync(fullPath).isDirectory()) {
        setCurrentPath(fullPath);
        countFilesAndFolders(fullPath);
      }
    } else if (key.backspace || key.delete) {
      let parentpath = path.dirname(currentPath);
      setCurrentPath(parentpath);
    } else if (input === "q") {
      console.clear();
      exit();
    }
  });

  const visibleFiles = files.slice(
    scrollOffset,
    scrollOffset + MAX_VISIBLE_ITEMS
  );

  return (
    <Box padding={1} flexDirection="column">
      <Text color="cyan">📂 {currentPath}</Text>
      <Box borderStyle="single" flexDirection="column" padding={1}>
        {visibleFiles.map((file, index) => {
          const fullPath = path.join(currentPath, file);
          const isDirectory =
            fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
          return (
            <Text
              key={file}
              color={
                index + scrollOffset === selectedIndex
                  ? "green"
                  : isDirectory
                  ? "yellowBright"
                  : "white"
              }
            >
              {index + scrollOffset === selectedIndex ? "➤ " : "  "}
              {file} {index} {selectedIndex}
            </Text>
          );
        })}
      </Box>
      <StatusBar files={filesNum} folders={foldersNum} />
      <KeyBindings />
    </Box>
  );
};

render(<FileExplorer />);
