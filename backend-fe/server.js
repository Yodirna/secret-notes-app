// server.js
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Postgres using env variables (see docker-compose yaml file)
const pool = new Pool({
  host: process.env.PGHOST || "db",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  database: process.env.PGDATABASE || "notesdb",
  port: process.env.PGPORT || 5432,
});

// Initialize table
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      encrypted TEXT NOT NULL
    )
  `);
})();

function encrypt(text, passphrase) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(passphrase).digest();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encrypted, passphrase) {
  const [ivHex, encryptedText] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.createHash("sha256").update(passphrase).digest();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Save a new note
app.post("/note", async (req, res) => {
  const { title, note, passphrase } = req.body;
  const encrypted = encrypt(note, passphrase);
  await pool.query(
    "INSERT INTO notes (title, encrypted) VALUES ($1, $2)",
    [title, encrypted]
  );
  res.json({ success: true });
});

// Get all notes
app.get("/notes", async (req, res) => {
  const result = await pool.query("SELECT id, title, encrypted FROM notes ORDER BY id");
  res.json({ notes: result.rows });
});

// Decrypt a note
app.post("/decrypt/:id", async (req, res) => {
  const { id } = req.params;
  const { passphrase } = req.body;
  try {
    const result = await pool.query("SELECT encrypted FROM notes WHERE id = $1", [id]);
    if (!result.rows.length) return res.json({ decrypted: null });
    const decrypted = decrypt(result.rows[0].encrypted, passphrase);
    res.json({ decrypted });
  } catch (e) {
    res.json({ decrypted: null });
  }
});

// Delete a note
app.delete("/note/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM notes WHERE id = $1", [id]);
  res.json({ success: true });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
