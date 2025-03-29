import React, { useEffect, useState } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

console.clear();
console.log();

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

const FileExplorer: React.FC = () => {
  const { exit } = useApp();
  const [currentPath, setCurrentPath] = useState<string>(process.cwd());
  const [files, setFiles] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [scrollOffset, setScrollOffset] = useState<number>(0);

  useEffect(() => {
    updateFileList();
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
      const fullPath = path.join(currentPath, selectedFile);
      if (fs.statSync(fullPath).isDirectory()) {
        setCurrentPath(fullPath);
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
    <Box flexDirection="column">
      <Text color="cyan">📂 {currentPath}</Text>
      <Box borderStyle="single" flexDirection="column" padding={1}>
        {visibleFiles.map((file, index) => (
          <Text
            key={file}
            color={index + scrollOffset === selectedIndex ? "green" : "white"}
          >
            {index + scrollOffset === selectedIndex ? "➤ " : "  "}
            {file} {index} {selectedIndex}
          </Text>
        ))}
      </Box>
      <KeyBindings />
    </Box>
  );
};

render(<FileExplorer />);
