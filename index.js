const express = require("express");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = "tayri_secret_token"; // תחליף למה שתרצה

// שלב 1: אימות webhook (שלב חד פעמי מול 360dialog)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// שלב 2: קבלת הודעות
app.post("/webhook", (req, res) => {
  const body = req.body;
  console.log("💬 Incoming message:", JSON.stringify(body, null, 2));
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
