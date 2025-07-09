const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const algorithm = "aes-256-cbc";
const notes = [];

function encrypt(text, passphrase) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(passphrase, "salt", 32);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}


function decrypt(encryptedText, passphrase) {
  const [ivHex, dataHex] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(dataHex, "hex");
  const key = crypto.scryptSync(passphrase, "salt", 32);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

app.delete("/note/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 0 || id >= notes.length) {
    return res.status(404).json({ error: "Invalid note ID" });
  }
  notes.splice(id, 1); // Delete the note
  res.json({ success: true });
});

app.post("/note", (req, res) => {
  const { title, note, passphrase } = req.body;
  if (typeof title !== "string" || typeof note !== "string" || typeof passphrase !== "string") {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const encrypted = encrypt(note, passphrase);
  notes.push({ title, encrypted }); // Store title and encrypted note
  res.json({ success: true });
});

app.get("/notes", (req, res) => {
  res.json({ notes });
});

app.post("/decrypt/:id", (req, res) => {
  const { passphrase } = req.body;
  const note = notes[req.params.id];
  if (!note) return res.status(404).json({ error: "Note not found" });

  try {
    const decrypted = decrypt(note.encrypted, passphrase);
    res.json({ decrypted });
  } catch {
    res.json({ decrypted: null });
  }
});

app.listen(5000, () => console.log("Server running on port 5000. Reachable from outside with port 5001"));

