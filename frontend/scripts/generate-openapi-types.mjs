import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import openapiTS from "openapi-typescript";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDirectory, "..");
const sourcePath = path.resolve(frontendRoot, process.argv[2] ?? "../build/openapi.yaml");
const outputPath = path.resolve(frontendRoot, process.argv[3] ?? "src/api/generated/schema.ts");

const generatedTypes = await openapiTS(sourcePath, {
  alphabetize: true,
  exportType: true,
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, generatedTypes, "utf8");
