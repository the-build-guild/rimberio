const path = require("path");
const { task, src, dest } = require("gulp");

// n8n loads node icons from the compiled dist tree, but tsc only emits .js. The .svg
// referenced by `icon: "file:rimberio.svg"` has to be copied across separately or the
// node renders with a broken image in the editor.
task("build:icons", copyIcons);

function copyIcons() {
  const nodeSource = path.resolve("nodes", "**", "*.{png,svg}");
  const nodeDestination = path.resolve("dist", "nodes");
  src(nodeSource).pipe(dest(nodeDestination));

  const credSource = path.resolve("credentials", "**", "*.{png,svg}");
  const credDestination = path.resolve("dist", "credentials");
  return src(credSource, { allowEmpty: true }).pipe(dest(credDestination));
}
