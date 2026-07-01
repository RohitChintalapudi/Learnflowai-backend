import http from "node:http";
import { app } from "./src/app";

async function main() {
  const server = http.createServer(app);
  
  // Listen on a random free port
  server.listen(0, async () => {
    const address = server.address();
    if (!address || typeof address === "string") {
      console.error("Failed to get server address");
      server.close();
      return;
    }
    const port = address.port;
    const url = `http://localhost:${port}/api/learning-history`;
    
    console.log(`Server started on port ${port}. Fetching from: ${url}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          "x-test-user-id": "z2KRwqVzX0KK31LcCXNW0wquo67cZgfx"
        }
      });
      const data = await response.json();
      console.log("RESPONSE STATUS:", response.status);
      console.log("RESPONSE BODY:");
      console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      server.close();
    }
  });
}

main().catch(console.error);
