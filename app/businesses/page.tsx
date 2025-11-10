"use client";

import { useEffect, useState } from "react";

type Business = {
  id: string;
  name: string;
  whatsapp_number: string | null;
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  async function fetchBusinesses() {
    const res = await fetch("/api/businesses");
    const data = await res.json();
    setBusinesses(data);
  }

  useEffect(() => {
    fetchBusinesses();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        whatsapp_number: whatsapp || null
      })
    });
    const data = await res.json();
    if (res.ok) {
      setName("");
      setWhatsapp("");
      fetchBusinesses();
    } else {
      alert(data.error ?? "Error creating business");
    }
  }

  return (
    <main style={{ padding: "1.5rem", maxWidth: 600 }}>
      <h1>Businesses</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", marginTop: "1rem", marginBottom: "2rem" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Business name"
          required
          style={{ padding: "0.5rem" }}
        />
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="WhatsApp number (optional)"
          style={{ padding: "0.5rem" }}
        />
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Add business
        </button>
      </form>

      <ul style={{ display: "grid", gap: "1rem" }}>
        {businesses.map((b) => (
          <li key={b.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
            <h2>{b.name}</h2>
            {b.whatsapp_number ? <p>WhatsApp: {b.whatsapp_number}</p> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
