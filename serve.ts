import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(fileURLToPath(new URL("./app/", import.meta.url)));
const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
  [".otf", "font/otf"],
]);

function reply(response, code, message) {
  response.writeHead(code, { "content-type": "text/plain; charset=utf-8", "content-length": Buffer.byteLength(message) });
  response.end(message);
}

function resolvePage(rawUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent((rawUrl ?? "/").split("?", 1)[0]);
  } catch {
    return { error: 400 };
  }
  if (!pathname.startsWith("/")) return { error: 400 };
  let target = resolve(appRoot, `.${pathname}`);
  const relativePath = relative(appRoot, target);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    return { error: 403 };
  }
  try {
    if (statSync(target).isDirectory()) target = join(target, "index.html");
    if (!statSync(target).isFile()) return { error: 404 };
  } catch {
    return { error: 404 };
  }
  return { target };
}

const argumentsList = process.argv.slice(2);
const portIndex = argumentsList.indexOf("--port");
const port = portIndex >= 0 ? Number(argumentsList[portIndex + 1]) : 8080;
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("--port must be a valid TCP port.");

const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" });
    response.end();
    return;
  }
  const result = resolvePage(request.url);
  if (result.error) {
    reply(response, result.error, result.error === 403 ? "Forbidden\n" : result.error === 400 ? "Bad request\n" : "Not found\n");
    return;
  }
  const size = statSync(result.target).size;
  response.writeHead(200, {
    "content-type": contentTypes.get(extname(result.target).toLowerCase()) ?? "application/octet-stream",
    "content-length": size,
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(result.target).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  const address = server.address();
  console.log(`Neon Hours is available at http://127.0.0.1:${address.port}/`);
});
