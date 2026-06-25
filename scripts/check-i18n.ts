import * as fs from "fs";
import * as path from "path";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

function flattenKeys(
  obj: Record<string, unknown>,
  prefix = ""
): Set<string> {
  const keys = new Set<string>();
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const nested = flattenKeys(value as Record<string, unknown>, fullKey);
      for (const k of nested) {
        keys.add(k);
      }
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

function readJson(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as Record<string, unknown>;
}

function setDifference(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((k) => !b.has(k)).sort();
}

const messagesDir = path.join(process.cwd(), "messages");
const enDir = path.join(messagesDir, "en");
const zhDir = path.join(messagesDir, "zh");

const enFiles = new Set(
  fs.existsSync(enDir)
    ? fs.readdirSync(enDir).filter((f) => f.endsWith(".json"))
    : []
);
const zhFiles = new Set(
  fs.existsSync(zhDir)
    ? fs.readdirSync(zhDir).filter((f) => f.endsWith(".json"))
    : []
);

const allFiles = new Set([...enFiles, ...zhFiles]);
const namespaces = [...allFiles].sort();

let totalMismatches = 0;

for (const file of namespaces) {
  const namespace = file.replace(".json", "");
  const enJson = readJson(path.join(enDir, file));
  const zhJson = readJson(path.join(zhDir, file));

  const enKeys = flattenKeys(enJson);
  const zhKeys = flattenKeys(zhJson);

  const enOnly = setDifference(enKeys, zhKeys);
  const zhOnly = setDifference(zhKeys, enKeys);

  const hasMismatch = enOnly.length > 0 || zhOnly.length > 0;

  if (hasMismatch) {
    totalMismatches++;
    console.log(`${RED}✗ ${namespace} — FAIL${RESET}`);
    if (enOnly.length > 0) {
      console.log(`  en → zh missing: ${enOnly.join(", ")}`);
    }
    if (zhOnly.length > 0) {
      console.log(`  zh → en missing: ${zhOnly.join(", ")}`);
    }
  } else {
    console.log(`${GREEN}✓ ${namespace} — PASS${RESET}`);
  }
}

console.log(
  `\nChecked ${namespaces.length} namespaces. ${totalMismatches} mismatches found.`
);

process.exit(totalMismatches > 0 ? 1 : 0);
