#!/usr/bin/env node
"use strict";

/**
 * Generates a subset of the @bookklik/senangstart-icons icon CSS containing
 * only the icon classes actually used by this library (src/) and its
 * examples (examples/), so the whiteboard bundle does not ship all ~250
 * inline data-URI mask rules.
 *
 * Usage: node scripts/generate-icon-subset.js  (alias: npm run icons:build)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_CSS = path.join(
  ROOT,
  "node_modules",
  "@bookklik/senangstart-icons",
  "dist",
  "senangstart.min.css"
);
const OUTPUT_CSS = path.join(ROOT, "src", "css", "icons.css");

const SCAN_FILES = ["examples/sww.html", "examples/sww-tailwind.html"];
const SCAN_DIRS = ["src/js", "src/css"];

// Icons referenced only through dynamic expressions that a literal scan
// cannot resolve (e.g. `ss ss-${element.hidden ? "eye-slash" : "eye"}` and
// the fallback names returned by the icon-map helper functions in the
// examples). Keep in sync when adding dynamically chosen icons.
const EXTRA_ICONS = ["shapes", "eye", "eye-slash"];

// Used by src/js/modules/ui/LayersPanel.js but absent from the icon pack
// (verified: no parallelogram/skew/slug variant exists in the pack's
// icons.json). Warned, not fatal, so generation still succeeds; the layer
// entry renders as a plain square, same as with the full pack.
const KNOWN_MISSING = ["parallelogram"];

// Icon class names appear as `ss ss-pencil` etc. The leading \b keeps us
// from matching inside words, and the name pattern excludes a trailing dash
// so `ss-arrow` is never confused with `ss-arrowhead`.
const ICON_NAME_RE = /\bss-([a-z0-9]+(?:-[a-z0-9]+)*)/gi;

// Icon rules in the pack look like `.ss-NAME{-webkit-mask-image:...;...}`.
// The lookahead stops at the first non-name char so `.ss-arrow` does not
// match a longer name such as `.ss-arrowhead`.
const ICON_SELECTOR_RE = /^\.ss-([a-z0-9]+(?:-[a-z0-9]+)*)(?![\w-])/i;

function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function collectUsedIcons() {
  const used = new Set(EXTRA_ICONS);

  const files = [...SCAN_FILES.map((f) => path.join(ROOT, f))];
  for (const dir of SCAN_DIRS) {
    for (const file of walk(path.join(ROOT, dir), [".js", ".css"])) {
      if (path.resolve(file) === path.resolve(OUTPUT_CSS)) continue;
      files.push(file);
    }
  }

  for (const file of files) {
    // Strip the <ss-icon> web-component tag (examples use it, but it
    // self-renders via senangstart-icon.min.js and needs no CSS classes).
    const text = fs
      .readFileSync(file, "utf8")
      .replace(/<\/?ss-icon\b/g, "");
    for (const match of text.matchAll(ICON_NAME_RE)) used.add(match[1]);
  }

  return { used: [...used].sort(), files };
}

/**
 * Parses top-level rules of a (minified) stylesheet. Handles @-blocks by
 * keeping them intact as non-icon (base) rules.
 */
function parseRules(css) {
  const rules = [];
  let i = 0;

  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open === -1) break;

    let selector = css.slice(i, open);
    const commentEnd = selector.lastIndexOf("*/");
    if (commentEnd !== -1) selector = selector.slice(commentEnd + 2);
    selector = selector.replace(/\s+/g, " ").trim();

    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      const ch = css[j];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      j++;
    }
    if (depth !== 0) throw new Error("Unbalanced braces in source CSS");

    rules.push({ selector, body: css.slice(open, j) });
    i = j;
  }

  return rules;
}

function main() {
  if (!fs.existsSync(SOURCE_CSS)) {
    console.error(
      `generate-icon-subset: icon pack not found at:\n  ${SOURCE_CSS}\n` +
        "Install it with: npm install --save-dev @bookklik/senangstart-icons"
    );
    process.exit(1);
  }

  const css = fs.readFileSync(SOURCE_CSS, "utf8");
  const rules = parseRules(css);

  const { used, files } = collectUsedIcons();

  const iconRules = new Map(); // icon name -> [{selector, body}]
  const classified = rules.map((rule) => {
    const match = rule.selector.trim().match(ICON_SELECTOR_RE);
    if (match) {
      const name = match[1];
      if (!iconRules.has(name)) iconRules.set(name, []);
      iconRules.get(name).push(rule);
      return { rule, icon: name };
    }
    return { rule, icon: null }; // base rule (.ss, .ss svg, @-blocks, ...)
  });

  const missing = used.filter(
    (name) => !iconRules.has(name) && !KNOWN_MISSING.includes(name)
  );
  if (missing.length > 0) {
    console.error(
      "generate-icon-subset: the following icon classes are used in the " +
        "library/examples but have NO matching rule in the icon pack CSS:\n" +
        missing.map((n) => `  - ss-${n}`).join("\n") +
        "\nFix the class names (or update EXTRA_ICONS in this script), " +
        "then regenerate."
    );
    process.exit(1);
  }

  const usedSet = new Set(used);
  const knownMissing = used.filter(
    (name) => !iconRules.has(name) && KNOWN_MISSING.includes(name)
  );
  if (knownMissing.length > 0) {
    console.warn(
      "generate-icon-subset: warning — used icons with no rule in the pack " +
        "(listed in KNOWN_MISSING, keeping source names):\n" +
        knownMissing.map((n) => `  - ss-${n}`).join("\n")
    );
  }

  const parts = [
    "/* AUTO-GENERATED by scripts/generate-icon-subset.js — do not edit manually.",
    "   Regenerate: npm run icons:build",
    `   Contains ${used.length} icon rules (subset of @bookklik/senangstart-icons). */`,
    "",
  ];

  for (const { rule, icon } of classified) {
    if (icon === null || usedSet.has(icon)) parts.push(`${rule.selector}${rule.body}`);
  }

  const output = parts.join("\n") + "\n";
  fs.writeFileSync(OUTPUT_CSS, output);

  const fmt = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log(
    `generate-icon-subset: wrote ${OUTPUT_CSS}\n` +
      `  used icons: ${used.length} of ${iconRules.size}\n` +
      `  original: ${fmt(Buffer.byteLength(css))} -> subset: ${fmt(
        Buffer.byteLength(output)
      )}`
  );
}

main();
