import express from "express";

const app = express();

app.all("/api/auth/{*any}", (req, res) => {
  res.json({ matched: "curly-braces", url: req.url });
});

// Let's also register a regex route under a different prefix to see how it works
app.all(/\/api\/test-auth\/(.*)/, (req, res) => {
  res.json({ matched: "regex", url: req.url });
});

const server = app.listen(0, async () => {
  const address = server.address() as any;
  const port = address.port;
  console.log(`Test server running on port ${port}`);

  try {
    // Test 1: curly braces wildcard
    const res1 = await fetch(`http://localhost:${port}/api/auth/callback/google`);
    const text1 = await res1.text();
    console.log("Response for /api/auth/callback/google:", text1);

    const res2 = await fetch(`http://localhost:${port}/api/auth/sign-in/email`);
    const text2 = await res2.text();
    console.log("Response for /api/auth/sign-in/email:", text2);

    // Test 2: regex wildcard
    const res3 = await fetch(`http://localhost:${port}/api/test-auth/callback/google`);
    const text3 = await res3.text();
    console.log("Response for /api/test-auth/callback/google:", text3);
  } catch (err: any) {
    console.error("Fetch error:", err.message);
  } finally {
    server.close();
  }
});
