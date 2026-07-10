import { startMcpServer, startMcpHttpServer } from "./server";

const transport = process.env.MCP_TRANSPORT?.trim().toLowerCase();
const port = parseInt(process.env.MCP_PORT ?? "8080", 10);

if (transport === "http") {
  startMcpHttpServer(port).catch((error) => {
    console.error("Failed to start MCP HTTP server:", error);
    process.exit(1);
  });
} else {
  startMcpServer().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  });
}
