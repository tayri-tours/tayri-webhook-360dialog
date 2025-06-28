import express from "express";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// טוקן אימות webhook
const VERIFY_TOKEN = "tayri_secret_token";

// מפתח OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 360dialog
const WHATSAPP_API_URL = "https://waba.360dialog.io/v1/messages";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // שים בקובץ .env

// system prompt
const systemPrompt = `
אתה סוכן הזמנות חכם לשירותי נסיעות.
המטרה שלך היא לאסוף מהלקוח את כל פרטי ההזמנה, כולל:
- תאריך הנסיעה
- שעה
- כתובת איסוף
- כתובת יעד
- מספר נוסעים
- מספר מזוודות

אם חסר לך פרט, תשאל אותו בצורה נעימה ומקצועית, בעברית או בשפת הלקוח.
ענה בכל שאלה אחרת של הלקוח אם תוכל, אבל תמיד תחזור לבקש את הפרטים החסרים עד שיש לך את כולם.
כשכל הפרטים בידך, סכם אותם בנוסח ברור.
אל תמציא תשובות.
`

// אימות webhook
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

// POST - הודעות
app.post("/webhook", async (req, res) => {
  const body = req.body;
  console.log("New webhook event:", JSON.stringify(body, null, 2));

  try {
    const message = body.messages?.[0]?.text?.body || "";
    const from = body.messages?.[0]?.from || "";

    if (message && from) {
      // שולחים ל-GPT
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.3,
      });

      const gptReply = gptResponse.choices[0].message.content;
      console.log(`GPT reply to ${from}: ${gptReply}`);

      // שולחים חזרה ללקוח דרך 360dialog
      await sendReplyToCustomer(from, gptReply);
    }
  } catch (err) {
    console.error("Error:", err.response?.data || err);
  }

  res.sendStatus(200); // תמיד מחזירים 200OK
});

// פונקציה לשלוח תשובה ללקוח
async function sendReplyToCustomer(to, text) {
  try {
    const headers = {
      "D360-API-KEY": WHATSAPP_TOKEN,
      "Content-Type": "application/json",
    };

    const data = {
      to: to,
      type: "text",
      text: { body: text },
    };

    const response = await axios.post(WHATSAPP_API_URL, data, { headers });
    console.log("✅ Sent to customer:", response.data);
  } catch (err) {
    console.error("❌ Error sending to customer:", err.response?.data || err);
  }
}

// הפעלה
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});
