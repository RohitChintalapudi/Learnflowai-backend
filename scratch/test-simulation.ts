import { prisma } from "../src/database";
import { app } from "../src/app";
import http from "http";

const PORT = 3008;

async function runTest() {
  console.log("Starting simulation test setup...");
  
  const user = await prisma.user.create({
    data: {
      name: "Test User Sim",
      email: "test-sim-" + Date.now() + "@example.com",
    }
  });
  console.log("Created user: " + user.id);

  const sessionToken = "test-token-" + Date.now();
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      ipAddress: "127.0.0.1",
      userAgent: "TestAgent/1.0"
    }
  });
  console.log("Created session: " + sessionToken);

  const document = await prisma.document.create({
    data: {
      title: "Networking 101",
      fileName: "networking.pdf",
      fileType: "application/pdf",
      uploadedBy: user.id
    }
  });
  console.log("Created document: " + document.id);

  const dummyEmbedding = Array.from({ length: 768 }, () => Math.random() * 0.01);
  const embeddingString = "[" + dummyEmbedding.join(",") + "]";

  // Insert a chunk that describes the TCP Three-Way Handshake
  await prisma.$executeRawUnsafe(
    `INSERT INTO chunks (id, "documentId", "chunkIndex", content, embedding, "createdAt") ` +
    `VALUES (gen_random_uuid()::text, '${document.id}', 1, ` +
    `'The TCP three-way handshake is a process used in a TCP/IP network to make a connection between server and client. It is a three-step method: 1. SYN (Synchronize): The client sends a segment with SYN. 2. SYN-ACK: The server responds with SYN and ACK. 3. ACK: The client responds with ACK. This establishes a reliable duplex connection.', ` +
    `'${embeddingString}'::vector, now())`
  );
  console.log("Created chunk with TCP connection info");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log("Server listening on port " + PORT);

  try {
    console.log("Calling POST /api/workflow/simulation...");
    const response = await fetch("http://localhost:" + PORT + "/api/workflow/simulation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": user.id
      },
      body: JSON.stringify({
        documentId: document.id,
        highlightedText: "TCP Three Way Handshake",
        simulationType: "visual-flow",
        difficulty: "beginner"
      })
    });

    const result = await response.json();

    console.log("Service Response:", JSON.stringify(result, null, 2));

    if (result.success && result.simulation) {
      console.log("✅ TEST PASSED: Service successfully returned the simulation.");
      
      // Let's verify that the output contains steps and entities
      if (result.simulation.steps && result.simulation.entities) {
        console.log("✅ Struct validation passed!");
      } else {
        console.log("❌ Struct validation failed: missing steps or entities.");
      }
    } else {
      console.log("❌ TEST FAILED: Service returned an error.");
    }
  } catch (error) {
    console.error("Error making request:", error);
  } finally {
    server.close();
    await prisma.chunk.deleteMany({ where: { documentId: document.id } });
    await prisma.document.delete({ where: { id: document.id } });
    await prisma.session.delete({ where: { id: session.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
    console.log("Cleanup complete");
    process.exit(0);
  }
}

runTest().catch(console.error);
