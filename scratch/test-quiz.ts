import { prisma } from "../src/database";
import { app } from "../src/app";
import http from "http";

const PORT = 3007;

async function runTest() {
  console.log("Starting test setup...");
  
  const user = await prisma.user.create({
    data: {
      name: "Test User Quiz",
      email: "test-quiz-" + Date.now() + "@example.com",
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
      title: "Operating Systems Intro",
      fileName: "os-intro.pdf",
      fileType: "application/pdf",
      uploadedBy: user.id
    }
  });
  console.log("Created document: " + document.id);

  const dummyEmbedding = Array.from({ length: 768 }, () => Math.random() * 0.01);
  const embeddingString = "[" + dummyEmbedding.join(",") + "]";

  await prisma.$executeRawUnsafe(
    `INSERT INTO chunks (id, "documentId", "chunkIndex", content, embedding, "createdAt") ` +
    `VALUES (gen_random_uuid()::text, '${document.id}', 1, ` +
    `'An Operating System (OS) is software that manages computer hardware and software resources. The scheduler is a key component that determines which process runs when.', ` +
    `'${embeddingString}'::vector, now())`
  );
  console.log("Created chunk with vector embedding");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log("Server listening on port " + PORT);

  try {
    console.log("Calling POST /api/workflow/quiz...");
    const response = await fetch("http://localhost:" + PORT + "/api/workflow/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": user.id
      },
      body: JSON.stringify({
        documentId: document.id,
        highlightedText: "What is process scheduling?"
      })
    });

    const result = await response.json();

    console.log("Service Response:", JSON.stringify(result, null, 2));

    if (result.success && result.quiz?.mcqs?.length && result.quiz?.trueFalse?.length && result.quiz?.shortAnswer?.length) {
      console.log("✅ TEST PASSED: Service successfully returned the quiz in JSON format with all three sections.");
    } else {
      console.log("❌ TEST FAILED: Service returned an error or missing quiz sections.");
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
