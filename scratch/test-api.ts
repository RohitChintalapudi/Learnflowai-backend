import { prisma } from "../src/database";
import { app } from "../src/app";
import { auth } from "../src/auth/auth";
import http from "http";

const PORT = 3005;

async function runTest() {
  console.log("Starting test setup...");
  
  // 1. Create a dummy user
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
    }
  });
  console.log(`Created user: ${user.id}`);

  // 2. Create a session for better-auth
  const sessionToken = `test-token-${Date.now()}`;
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
      ipAddress: "127.0.0.1",
      userAgent: "TestAgent/1.0"
    }
  });
  console.log(`Created session: ${sessionToken}`);

  // 3. Create a document
  const document = await prisma.document.create({
    data: {
      title: "Operating Systems Intro",
      fileName: "os-intro.pdf",
      fileType: "application/pdf",
      uploadedBy: user.id
    }
  });
  console.log(`Created document: ${document.id}`);

  // 4. Create chunks with embeddings
  // The embedding service returns 768 random numbers between 0 and 0.01
  const dummyEmbedding = Array.from({ length: 768 }, () => Math.random() * 0.01);
  const embeddingString = `[${dummyEmbedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO chunks (id, "documentId", "chunkIndex", content, embedding, "createdAt")
    VALUES (
      gen_random_uuid()::text,
      ${document.id},
      1,
      'An Operating System (OS) is software that manages computer hardware and software resources.',
      ${embeddingString}::vector,
      now()
    )
  `;
  console.log(`Created chunk with vector embedding`);

  // 5. Start the server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`Server listening on port ${PORT}`);

  try {
    // 6. Call the service directly
    const { ExplanationService } = await import("../src/modules/workflow/explanation/explanation.service");
    const explanationService = new ExplanationService();
    
    console.log("Calling ExplanationService...");
    const result = await explanationService.generateExplanation(
      document.id,
      "What is an Operating System?",
      user.id
    );

    console.log("Service Response:", JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("✅ TEST PASSED: Service successfully returned an explanation.");
    } else {
      console.log("❌ TEST FAILED: Service returned an error.");
    }
  } catch (error) {
    console.error("Error making request:", error);
  } finally {
    // Cleanup
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
