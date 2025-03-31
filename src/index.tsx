import React, { useEffect, useRef, useState } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import fs from "fs";
import path from "path";
import { calculateSize, formatSize } from "./utils.js";

// console.clear();

const MAX_VISIBLE_ITEMS = 10; // Max items visible in the list at a time

const KeyBindings: React.FC = () => (
  <Box
    borderStyle="single"
    height={3}
    display="flex"
    alignItems="center"
    flexDirection="row"
    justifyContent="space-around"
  >
    <Text>[↑/↓] Navigate</Text>
    <Text>[Enter] Open Folder</Text>
    <Text>[Delete / Backspace] Go Back</Text>
    <Text>[Q] Quit</Text>
  </Box>
);

const StatusBar = ({
  files,
  folders,
  size,
}: {
  files: number;
  folders: number;
  size: string;
}) => {
  return (
    <Box
      borderStyle="single"
      borderColor="magentaBright"
      display="flex"
      flexDirection="row"
      alignItems="center"
      gap={1}
      paddingLeft={1}
    >
      <Text color="yellowBright">Current Folder Stats : </Text>
      <Text>Files : {files}</Text>
      <Text>Folders : {folders}</Text>
      <Text>Total Size : {size}</Text>
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
  const [totalSize, setTotalSize] = useState<string>("");
  // const currentPathRef = useRef(currentPath);

  const countFilesAndFolders = () => {
    try {
      if (!fs.existsSync(currentPath)) return;
      let allFiles = fs.readdirSync(currentPath);
      let files = 0;
      let folders = 0;
      allFiles.forEach((af) => {
        let filePath = path.join(currentPath, af);
        if (!fs.existsSync(filePath)) return;
        let stats;
        try {
          stats = fs.lstatSync(filePath);
          if (stats.isSymbolicLink()) {
            return;
          }
        } catch (e) {
          // console.log(e);
          return;
        }
        if (stats && stats.isDirectory()) {
          folders++;
        } else {
          files++;
        }
      });
      setFilesNum(files);
      setFoldersNum(folders);
      let nowSize = calculateSize(currentPath);
      let nowString = formatSize(nowSize);
      setTotalSize(`${nowString}`);
    } catch (e) {
      return;
    }
  };

  useEffect(() => {
    process.stdout.write("\x1b[?1049h"); // Switch to alternate screen
    return () => {
      process.stdout.write("\x1b[?1049l"); // Restore original screen on exit
      console.clear();
    };
  }, []);

  useEffect(() => {
    clearScreen();
    updateFileList();
    countFilesAndFolders();
  }, [currentPath]);

  const clearScreen = () => {
    process.stdout.write("\x1B[2J\x1B[H"); // 🔹 ANSI escape sequence to clear screen
  };

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
      try {
        const selectedFile = files[selectedIndex];
        if (!selectedFile) return;
        const fullPath = path.join(currentPath, selectedFile);
        if (!fs.existsSync(fullPath) || fs.lstatSync(fullPath).isFile()) {
          return;
        }
        if (fs.lstatSync(fullPath).isDirectory()) {
          setCurrentPath(fullPath);
        }
      } catch (error) {
        // console.log("From here", error);
        return;
      }
    } else if (key.backspace || key.delete) {
      try {
        let parentpath = path.dirname(currentPath);
        if (currentPath !== parentpath && fs.existsSync(parentpath)) {
          setCurrentPath(parentpath);
        }
      } catch (err) {
        console.log("From backspace", err);
      }
    } else if (input === "q") {
      exit();
    }
  });

  const visibleFiles = files.slice(
    scrollOffset,
    scrollOffset + MAX_VISIBLE_ITEMS
  );

  return (
    <Box width="100%" height="100%" paddingTop={2} flexDirection="column">
      <Text color="cyan">📂 {currentPath}</Text>
      <Box
        borderStyle="single"
        flexDirection="column"
        padding={0.5}
        height={MAX_VISIBLE_ITEMS + 2}
      >
        {visibleFiles.map((file, index) => {
          const fullPath = path.join(currentPath, file);
          let isDirectory = false;
          try {
            isDirectory =
              fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory();
          } catch (e) {
            console.log(e);
          }
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
              {file}
            </Text>
          );
        })}
      </Box>
      <StatusBar files={filesNum} folders={foldersNum} size={totalSize} />
      <KeyBindings />
    </Box>
  );
};

render(<FileExplorer />);
