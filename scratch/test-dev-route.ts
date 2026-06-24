import { prisma } from "../src/database";

const PORT = 3000;

async function runTest() {
  console.log("Starting test on running dev server at port " + PORT + "...");
  
  // 1. Create a temporary user
  const user = await prisma.user.create({
    data: {
      name: "Dev Test User",
      email: "dev-test-" + Date.now() + "@example.com",
    }
  });
  console.log("Created temp user: " + user.id);

  // 2. Create a temporary document
  const document = await prisma.document.create({
    data: {
      title: "Networking 101 Dev",
      fileName: "networking.pdf",
      fileType: "application/pdf",
      uploadedBy: user.id
    }
  });
  console.log("Created temp document: " + document.id);

  // 3. Create dummy chunk
  const dummyEmbedding = Array.from({ length: 768 }, () => Math.random() * 0.01);
  const embeddingString = "[" + dummyEmbedding.join(",") + "]";

  await prisma.$executeRawUnsafe(
    `INSERT INTO chunks (id, "documentId", "chunkIndex", content, embedding, "createdAt") ` +
    `VALUES (gen_random_uuid()::text, '${document.id}', 1, ` +
    `'The TCP three-way handshake is a process used in a TCP/IP network to make a connection between server and client. It is a three-step method: 1. SYN (Synchronize): The client sends a segment with SYN. 2. SYN-ACK: The server responds with SYN and ACK. 3. ACK: The client responds with ACK. This establishes a reliable duplex connection.', ` +
    `'${embeddingString}'::vector, now())`
  );
  console.log("Created temp chunk with TCP connection info");

  try {
    const url = `http://localhost:${PORT}/api/workflow/simulation`;
    console.log("Sending POST request to running dev server: " + url);
    
    const response = await fetch(url, {
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
      console.log("✅ DEV ROUTE TEST PASSED: Running dev server successfully processed the request and returned the simulation.");
      if (result.simulation.steps && result.simulation.entities) {
        console.log("✅ Output validation passed successfully!");
      } else {
        console.log("❌ Output validation failed: missing steps or entities.");
      }
    } else {
      console.log("❌ DEV ROUTE TEST FAILED: Running dev server returned an error.");
    }
  } catch (error) {
    console.error("Error making request to running dev server:", error);
  } finally {
    // Cleanup temp data
    await prisma.chunk.deleteMany({ where: { documentId: document.id } });
    await prisma.document.delete({ where: { id: document.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
    console.log("Cleanup complete");
    process.exit(0);
  }
}

runTest().catch(console.error);
