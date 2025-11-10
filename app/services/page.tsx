"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number | null;
  business_id: string | null;
};

type Business = {
  id: string;
  name: string;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");

  async function fetchServices(businessId?: string) {
    // for now we fetch all and filter on client, later we make a query param
    const res = await fetch("/api/services");
    const data = await res.json();
    if (businessId) {
      setServices(data.filter((s: Service) => s.business_id === businessId));
    } else {
      setServices(data);
    }
    setLoading(false);
  }

  async function fetchBusinesses() {
    const res = await fetch("/api/businesses");
    const data = await res.json();
    setBusinesses(data);
    // if you want, select the first one automatically
    if (data.length > 0) {
      setSelectedBusiness(data[0].id);
      fetchServices(data[0].id);
      return;
    }
    fetchServices();
  }

  useEffect(() => {
    fetchBusinesses();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: price ? Number(price) : null,
        duration_minutes: duration ? Number(duration) : null,
        business_id: selectedBusiness || null
      })
    });

    const data = await res.json();

    if (res.ok) {
      setName("");
      setPrice("");
      setDuration("");
      fetchServices(selectedBusiness);
    } else {
      alert(data.error ?? "Error creating service");
    }
  }

  function handleBusinessChange(id: string) {
    setSelectedBusiness(id);
    fetchServices(id);
  }

  return (
    <main style={{ padding: "1.5rem", maxWidth: 700 }}>
      <h1>Services</h1>

      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <label>
          Business:
          <select
            value={selectedBusiness}
            onChange={(e) => handleBusinessChange(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.25rem" }}
          >
            {businesses.length === 0 ? <option value="">No businesses</option> : null}
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
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
        <p>Loading...</p>
      ) : services.length === 0 ? (
        <p>No services for this business.</p>
      ) : (
        <ul style={{ display: "grid", gap: "1rem" }}>
          {services.map((service) => (
            <li key={service.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
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
