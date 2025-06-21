const express = require("express");
const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("Received webhook:", req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Webhook is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
