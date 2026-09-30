// Local preview + "save to book". Only runs on your computer; Vercel serves
// /public as plain static files and never sees this script.
import http from "node:http";
import { readFile, writeFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const PORT = Number(process.env.PORT) || 5173;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif",
};

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "POST" && url.pathname === "/api/layout") {
      let body = "";
      for await (const chunk of req) { body += chunk; if (body.length > 2_000_000) throw new Error("too big"); }
      const data = JSON.parse(body);
      if (!Array.isArray(data.stickers)) throw new Error("bad layout");
      await writeFile(join(ROOT, "layout.json"), JSON.stringify({ stickers: data.stickers }, null, 1) + "\n");
      console.log(`saved ${data.stickers.length} stickers to public/layout.json`);
      res.writeHead(200, { "Content-Type": "application/json" }).end('{"ok":true}');
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/content") {
      let body = "";
      for await (const chunk of req) { body += chunk; if (body.length > 2_000_000) throw new Error("too big"); }
      const book = JSON.parse(body);
      if (!book || !Array.isArray(book.pages)) throw new Error("bad content");
      const header =
        "// Everything in the book lives here. Edit this file by hand, or run `npm run dev`,\n" +
        "// click any words in the book to change them, and press \"save changes\".\n" +
        "// Page types: letter, polaroid, duo, collage, list, blank.\n" +
        "// Photos: { src: \"photos/your-file.jpg\", caption: \"...\" }. A missing file shows a soft placeholder.\n";
      await writeFile(join(ROOT, "content.js"), header + "window.BOOK = " + JSON.stringify(book, null, 2) + ";\n");
      console.log("saved text to public/content.js");
      res.writeHead(200, { "Content-Type": "application/json" }).end('{"ok":true}');
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/photo") {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 25_000_000) throw new Error("photo too big"); chunks.push(chunk); }
      const original = url.searchParams.get("name") || "photo.jpg";
      const ext = (extname(original).toLowerCase().match(/^\.(jpe?g|png|webp|gif)$/) || [".jpg"])[0];
      const stem = original.slice(0, original.length - extname(original).length).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "photo";
      const file = `${stem}-${Date.now().toString(36)}${ext}`;
      await writeFile(join(ROOT, "photos", file), Buffer.concat(chunks));
      console.log(`added photos/${file}`);
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ src: "photos/" + file }));
      return;
    }
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^([\\/])+/, "");
    if (!path || path.endsWith("/") || path.endsWith("\\")) path = join(path, "index.html");
    const file = join(ROOT, path);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    await stat(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(await readFile(file));
  } catch (e) {
    res.writeHead(e.code === "ENOENT" ? 404 : 400).end(String(e.message || e));
  }
}).listen(PORT, "127.0.0.1", () => console.log(`book running at http://localhost:${PORT}`));
