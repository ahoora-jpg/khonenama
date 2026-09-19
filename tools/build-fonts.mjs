import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const parts = ["00", "01", "02", "03"];
const base64Parts = await Promise.all(
  parts.map((part) =>
    readFile(
      path.join(process.cwd(), ".font-src", "hamishe", `${part}.b64`),
      "utf8"
    )
  )
);

const outputDir = path.join(process.cwd(), "public", "fonts");
await mkdir(outputDir, { recursive: true });
await writeFile(
  path.join(outputDir, "digi-hamishe.woff2"),
  Buffer.from(base64Parts.join(""), "base64")
);
