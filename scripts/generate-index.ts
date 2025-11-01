import fs from "fs";
import path from "path";

/**
 * Recursively generate index.ts files for all folders under `src/`
 */
function generateIndexesRecursively(dir: string, isRoot = false) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const files: string[] = [];
  const subdirs: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      subdirs.push(path.join(dir, entry.name));
    } else if (
      entry.isFile() &&
      entry.name.match(/\.(ts|tsx)$/) &&
      !entry.name.startsWith("index") &&
      !entry.name.endsWith(".d.ts") &&
      !entry.name.endsWith(".test.ts")
    ) {
      files.push(entry.name);
    }
  }

  // Generate export statements
  const exports = files.map(
    (f) => `export * from './${f.replace(/\.ts$/, "")}';`
  );

  // Write index.ts only if there’s something to export except root
  if (!isRoot && exports.length > 0) {
    const indexPath = path.join(dir, "index.ts");
    fs.writeFileSync(indexPath, exports.join("\n") + "\n");
    console.log(`✅ Generated ${indexPath}`);
  }

  // Recurse into subdirectories
  for (const subdir of subdirs) {
    generateIndexesRecursively(subdir, false);
  }
}

// ---- Run script ----
const srcDir = path.resolve("src");
generateIndexesRecursively(srcDir, true);
console.log("All index.ts files generated.");