/**
 * test-email.js
 * Run: node test-email.js
 * Interactive CLI to test the Nodemailer email service live.
 */

const readline = require("readline");

const BASE = "http://localhost:5001";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

function colorize(color, text) {
    const colors = { green: "\x1b[32m", red: "\x1b[31m", cyan: "\x1b[36m", yellow: "\x1b[33m", reset: "\x1b[0m" };
    return `${colors[color] || ""}${text}${colors.reset}`;
}

async function healthCheck() {
    console.log("\n" + colorize("cyan", "🔍  Checking service health..."));
    const res = await fetch(`${BASE}/api/health`);
    const body = await res.json();
    if (res.ok) {
        console.log(colorize("green", `✅  Health OK — ${JSON.stringify(body)}`));
        return true;
    }
    console.log(colorize("red", `❌  Health check failed: ${JSON.stringify(body)}`));
    return false;
}

async function sendTestEmail(payload) {
    console.log("\n" + colorize("cyan", "📤  Sending email..."));
    const res = await fetch(`${BASE}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (res.ok) {
        console.log(colorize("green", `\n✅  SUCCESS!\n   Message  : ${body.message}\n   MessageId: ${body.messageId}\n   Status   : ${body.status}`));
    } else {
        console.log(colorize("red", `\n❌  FAILED (${res.status})\n   Error : ${body.error}\n   Detail: ${body.detail || "-"}`));
    }
}

async function main() {
    console.log(colorize("yellow", "\n╔═══════════════════════════════════════╗"));
    console.log(colorize("yellow", "║   Resume Screener — Email Live Tester ║"));
    console.log(colorize("yellow", "╚═══════════════════════════════════════╝\n"));

    // 1. Health check
    const healthy = await healthCheck();
    if (!healthy) {
        console.log(colorize("red", "\nService is not running. Start it with: npm start\n"));
        rl.close();
        return;
    }

    // 2. Collect test details
    console.log(colorize("cyan", "\n📝  Enter test details (press Enter for defaults):\n"));

    const to = await ask("  Recipient email  : ");
    const name = (await ask("  Candidate name  [Jane Smith]  : ")) || "Jane Smith";
    const job = (await ask("  Job title        [Python Developer]  : ")) || "Python Developer";
    const score = parseFloat((await ask("  Match score %    [88] : ")) || "88");

    console.log("\n  Status options: 1 = selected  |  2 = rejected");
    const statusChoice = (await ask("  Choose (1/2)     [1] : ")) || "1";
    const status = statusChoice === "2" ? "rejected" : "selected";

    const customMsg = await ask("  Custom message   (blank = auto-generate) : ");

    rl.close();

    // 3. Send
    await sendTestEmail({
        candidate_email: to.trim(),
        candidate_name: name,
        job_title: job,
        match_score: score,
        status,
        message: customMsg,
    });

    console.log("\n" + colorize("cyan", "Done! Check your inbox (and spam folder if not received).\n"));
}

main().catch((err) => {
    console.error(colorize("red", `\nUnexpected error: ${err.message}\n`));
    rl.close();
    process.exit(1);
});
