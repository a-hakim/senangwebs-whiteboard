const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const packageJson = require(path.join(root, "package.json"));

const expectedArtifacts = {
  main: "dist/sww.js",
  module: "dist/sww.esm.mjs",
  style: "dist/sww.css",
};
const distributionArtifacts = [
  "dist/sww.js",
  "dist/sww.min.js",
  "dist/sww.esm.mjs",
  "dist/sww.css",
  "dist/sww.min.css",
];

for (const [field, expectedPath] of Object.entries(expectedArtifacts)) {
  assert.equal(
    packageJson[field],
    expectedPath,
    `package.json "${field}" must point to ${expectedPath}`,
  );

  assert.ok(
    fs.existsSync(path.join(root, expectedPath)),
    `Missing package artifact: ${expectedPath}. Run npm run build.`,
  );
}

for (const artifact of distributionArtifacts) {
  assert.ok(
    fs.existsSync(path.join(root, artifact)),
    `Missing distribution artifact: ${artifact}. Run npm run build.`,
  );
}

const bundle = fs.readFileSync(path.join(root, packageJson.main), "utf8");
assert.match(
  bundle,
  new RegExp(`version:\\s*["']${packageJson.version.replace(/\./g, "\\.")}["']`),
  `Built bundle does not expose package version ${packageJson.version}. Run npm run build.`,
);
for (const methodName of ["getScene", "loadScene", "destroy", "exportToSVG"]) {
  assert.match(
    bundle,
    new RegExp(`\\b${methodName}\\b`),
    `Built bundle is missing the public ${methodName} API.`,
  );
}

console.log(
  `Package entry points and version ${packageJson.version} are valid.`,
);
