#!/usr/bin/env node
/**
 * Synchronises TypeScript example files from test/docs/examples/ into the
 * documentation markdown files, eliminating code duplication.
 *
 * Each file in test/docs/examples/ is the single source of truth for its
 * example code.  Documentation files mark where the code should appear with:
 *
 *   <!-- example: STEM -->
 *   ```typescript
 *   … (managed by sync-doc-examples — do not edit manually) …
 *   ```
 *   <!-- /example -->
 *
 * where STEM is the filename without the .ts extension
 * (e.g. "term-wrapper" for test/docs/examples/term-wrapper.ts).
 *
 * Usage:
 *   node scripts/sync-doc-examples.mjs           # update docs in place
 *   node scripts/sync-doc-examples.mjs --check   # exit 1 if any doc is outdated
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs"
import { resolve, join, basename } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(fileURLToPath(import.meta.url), "../..")
const CHECK_MODE = process.argv.includes("--check")

const EXAMPLES_DIR = join(ROOT, "test", "docs", "examples")
const DOCS_DIRS = [
    join(ROOT, "docs"),
    join(ROOT, "docs", "guides"),
    join(ROOT, "docs", "api"),
]

// ─── 1. Load all example files ──────────────────────────────────────────────

const examples = new Map()
for (const file of readdirSync(EXAMPLES_DIR)) {
    if (!file.endsWith(".ts")) continue
    const stem = basename(file, ".ts")
    const content = readFileSync(join(EXAMPLES_DIR, file), "utf8").trimEnd()
    examples.set(stem, content)
}

if (examples.size === 0) {
    console.error("No example files found in", EXAMPLES_DIR)
    process.exit(1)
}

// ─── 2. Scan doc files and replace marked slots ──────────────────────────────

// Matches the full slot:
//   <!-- example: STEM -->\n```typescript\n<content>\n```\n<!-- /example -->
const SLOT_RE = /<!-- example: ([\w-]+) -->\n```typescript\n([\s\S]*?)```\n<!-- \/example -->/g

let anyOutdated = false

for (const dir of DOCS_DIRS) {
    let files
    try {
        files = readdirSync(dir)
    } catch {
        continue
    }

    for (const file of files) {
        if (!file.endsWith(".md")) continue
        const filePath = join(dir, file)
        const original = readFileSync(filePath, "utf8")

        const updated = original.replace(SLOT_RE, (_match, stem, _oldContent) => {
            if (!examples.has(stem)) {
                console.warn(`  WARN: No example file found for stem "${stem}" referenced in ${filePath}`)
                return _match
            }
            return `<!-- example: ${stem} -->\n\`\`\`typescript\n${examples.get(stem)}\n\`\`\`\n<!-- /example -->`
        })

        if (updated !== original) {
            anyOutdated = true
            if (CHECK_MODE) {
                console.error(`OUTDATED: ${filePath}`)
            } else {
                writeFileSync(filePath, updated, "utf8")
                console.log(`UPDATED:  ${filePath}`)
            }
        }
    }
}

if (CHECK_MODE) {
    if (anyOutdated) {
        console.error("\nDocs are out of sync with example files.")
        console.error("Run:  npm run sync-doc-examples")
        process.exit(1)
    } else {
        console.log("All doc examples are up to date.")
    }
} else if (!anyOutdated) {
    console.log("All doc examples are already up to date.")
}
