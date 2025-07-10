import React, { useState } from "react";

function App() {
  const [title, setTitle] = useState("");        
  const [note, setNote] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [decryptedNote, setDecryptedNote] = useState("");
  const [notes, setNotes] = useState([]);
  const API = "http://localhost:5001";

  const handleSave = async () => {
    await fetch(`${API}/note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, note, passphrase }), // Send title too
    });
    setNote("");
    setTitle("");                                       // Clear title after save
    fetchNotes();
  };

  const fetchNotes = async () => {
    const res = await fetch(`${API}/notes`);
    const data = await res.json();
    setNotes(data.notes);
  };

  const handleDecrypt = async (id) => {
    const res = await fetch(`${API}/decrypt/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase }),
    });
    const data = await res.json();
    setDecryptedNote(data.decrypted || "❌ Wrong passphrase.");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-2xl p-8 space-y-6">
        <h1 className="text-3xl font-semibold text-center">📝 Secure Notes</h1>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          placeholder="Write your note here..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full h-32 p-4 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <input
          type="password"
          placeholder="Enter passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Save Note
          </button>
          <button
            onClick={fetchNotes}
            className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Load Notes
          </button>
        </div>

        <div className="space-y-4">
        {notes.map((n, i) => (
          <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
            <div className="text-xs text-gray-400">Title:</div>
            <div className="text-base font-semibold mb-1">{n.title}</div>
            <div className="text-xs text-gray-400">Encrypted:</div>
            <div className="text-sm break-all mb-2">{n.encrypted}</div>
            <button
              onClick={() => handleDecrypt(n.id)}
              className="text-blue-500 hover:underline"
            >
              Decrypt with passphrase
            </button>
            <button
              onClick={async () => {
                await fetch(`${API}/note/${n.id}`, { method: "DELETE" });
                fetchNotes(); // Refresh after delete
              }}
              className="text-red-500 hover:underline ml-4"
            >
              Delete Note
            </button>
          </div>
        ))}
        </div>

        {decryptedNote && (
          <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg shadow-inner">
            <strong>Decrypted Note:</strong>
            <p>{decryptedNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
