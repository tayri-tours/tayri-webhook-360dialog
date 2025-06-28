import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

// טוקן אימות webhook
const VERIFY_TOKEN = "tayri_secret_token";

// מפתח OpenAI מהסביבה
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// אימות webhook (GET)
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

// קבלת הודעות (POST)
app.post("/webhook", async (req, res) => {
  const body = req.body;

  console.log("New webhook event:", JSON.stringify(body, null, 2));

  try {
    const message = body.messages?.[0]?.text?.body || "";
    const from = body.messages?.[0]?.from || "";

    if (message) {
      // אפשר לשמור היסטוריה בהמשך (redis למשל), כרגע נשלח רק ההודעה האחרונה
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o",  // אפשר לשנות
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.3,
      });

      const gptReply = gptResponse.choices[0].message.content;
      console.log(`GPT reply to ${from}: ${gptReply}`);

      // שלב הבא: שליחה חזרה ללקוח - כרגע רק מדפיסים
      // נוכל לחבר בהמשך ל-360dialog sendMessage
    }
  } catch (error) {
    console.error("Error calling GPT:", error);
  }

  res.sendStatus(200); // תמיד מחזירים 200OK ל-360dialog
});

// האזנה
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});

