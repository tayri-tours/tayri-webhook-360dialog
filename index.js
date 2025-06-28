const express = require("express");
const app = express();

// מאפשר לקבל POST כ-JSON
app.use(express.json());

// טוקן האימות
const VERIFY_TOKEN = "tayri_secret_token"; // שנה לערך שבחרת

// שלב 1: אימות webhook
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

  console.log("New webhook event:", JSON.stringify(body, null, 2));
  
  res.sendStatus(200);
});

// הפעלת השרת
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`שרת פועל על פורט ${PORT}`);
});
