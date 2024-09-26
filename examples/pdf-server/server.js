/**
 * This is a simple example of running a server using thart in cluster mode with 4 workers.
 * The server reads a PDF file and returns the text content of the first page.
 *
 * Example request:
 * curl -X POST -H "Content-Type: application/pdf" --data-binary @document.pdf http://localhost:3000/
 *
 * Example response: {"text":"This is the text content of the first page."}
 */
import http from "http";

import { Document } from "mupdf";
import { thart } from "thart";

const server = () =>
  http.createServer(async (req, res) => {
    console.log(`Process ${process.pid} handling request`);
    if (
      req.method === "POST" &&
      req.headers["content-type"] === "application/pdf"
    ) {
      // read file into a buffer
      const file = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
      const document = Document.openDocument(file, "application/pdf");
      const text = document.loadPage(0).toStructuredText().asText();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ text }));
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Only PDF uploads are supported." }));
    }
  });

await thart({
  worker: {
    count: 4,
    type: "cluster",
    start: (id) => {
      console.log(`Worker ${id} running with pid ${process.pid}`);
      new Promise((resolve) => server().listen(3000, resolve));
    },
  },
});
