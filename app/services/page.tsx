"use client";

import { useEffect, useState } from "react";

type Business = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number | null;
  business_id: string | null;
};

export default function ServicesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  // load businesses first
  useEffect(() => {
    async function loadBusinesses() {
      const res = await fetch("/api/businesses");
      const data = await res.json();
      setBusinesses(data);

      // auto-select first business
      if (data.length > 0) {
        setSelectedBusiness(data[0].id);
      }
    }
    loadBusinesses();
  }, []);

  // whenever selectedBusiness changes, fetch services for it
  useEffect(() => {
    if (!selectedBusiness) {
      setServices([]);
      return;
    }
    fetchServices(selectedBusiness);
  }, [selectedBusiness]);

  async function fetchServices(businessId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/services?business_id=${businessId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data);
      } else {
        setServices([]);
        console.error("Expected array, got:", data);
      }
    } catch (err) {
      console.error(err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBusiness) {
      alert("Select a business first");
      return;
    }

    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: price ? Number(price) : null,
        duration_minutes: duration ? Number(duration) : null,
        business_id: selectedBusiness
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Error creating service");
      return;
    }

    // clear
    setName("");
    setPrice("");
    setDuration("");

    // reload for this business
    fetchServices(selectedBusiness);
  }

  return (
    <main style={{ padding: "1.5rem", maxWidth: 700 }}>
      <h1>Services</h1>

      <div style={{ margin: "1rem 0" }}>
        <label>
          Business:
          <select
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.25rem" }}
          >
            {businesses.length === 0 && <option>No businesses</option>}
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Service name"
          required
          style={{ padding: "0.5rem" }}
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          type="number"
          step="0.01"
          style={{ padding: "0.5rem" }}
        />
        <input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Duration in minutes"
          type="number"
          style={{ padding: "0.5rem" }}
        />
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Add service
        </button>
      </form>

      {loading ? (
        <p>Loading services…</p>
      ) : services.length === 0 ? (
        <p>No services for this business yet.</p>
      ) : (
        <ul style={{ display: "grid", gap: "1rem" }}>
          {services.map((service) => (
            <li
              key={service.id}
              style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}
            >
              <h2>{service.name}</h2>
              {service.price ? <p>R$ {service.price}</p> : <p>Price not set</p>}
              {service.duration_minutes ? <p>{service.duration_minutes} min</p> : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
