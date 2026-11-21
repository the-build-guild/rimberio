// n8n discovers nodes and credentials through the "n8n" key in package.json, which points
// straight at the compiled files in dist/. This entry point exists only because package.json
// declares "main"; it deliberately exports nothing.
module.exports = {};
