import * as fs from "node:fs";
import path from "node:path";

export const calculateSize = (folderPath: string, totalSize: number = 0) => {
  if (!fs.existsSync(folderPath)) return 0;
  const allFiles = fs.readdirSync(folderPath);
  allFiles.forEach((file) => {
    const filePath = path.join(folderPath, file);
    let stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink()) {
      try {
        fs.statSync(filePath);
      } catch (e) {
        console.error(e);
      }
    }
    if (fs.statSync(filePath).isDirectory()) {
      totalSize += calculateSize(filePath);
    } else {
      if (!fs.statSync(filePath)) return;
      totalSize += fs.statSync(filePath).size;
    }
  });
  return totalSize;
};

export const formatSize = (size: number): string => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;

  while (size > 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};
