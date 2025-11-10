"use client";

import { useEffect, useState } from "react";

type Business = {
  id: string;
  name: string;
  whatsapp_number: string | null;
};

type Service = {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number | null;
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  async function fetchBusinesses() {
    const res = await fetch("/api/businesses");
    const data = await res.json();
    setBusinesses(data);

    if (Array.isArray(data) && data.length > 0) {
      setSelectedBusinessId((current) => {
        const stillExists = data.some((b: Business) => b.id === current);
        return stillExists ? current : data[0].id;
      });
    } else {
      setSelectedBusinessId("");
    }
  }

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (!selectedBusinessId) {
      setServices([]);
      return;
    }

    let cancelled = false;
    async function loadServices() {
      setLoadingServices(true);
      try {
        const res = await fetch(`/api/services?business_id=${selectedBusinessId}`);
        const data = await res.json();
        if (!cancelled) {
          setServices(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setServices([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingServices(false);
        }
      }
    }

    loadServices();

    return () => {
      cancelled = true;
    };
  }, [selectedBusinessId]);

  useEffect(() => {
    if (!selectedBusinessId || services.length === 0) {
      setAvailability({});
      return;
    }

    let cancelled = false;
    async function loadAvailability() {
      setLoadingAvailability(true);
      try {
        const results = await Promise.all(
          services.map(async (service) => {
            try {
              const res = await fetch(
                `/api/availability?business_id=${selectedBusinessId}&service_id=${service.id}&date=${selectedDate}`
              );
              const data = await res.json();
              if (!res.ok || !Array.isArray(data)) {
                return { id: service.id, slots: [] as string[] };
              }
              return { id: service.id, slots: data as string[] };
            } catch (error) {
              console.error(error);
              return { id: service.id, slots: [] as string[] };
            }
          })
        );

        if (!cancelled) {
          const mapped = results.reduce<Record<string, string[]>>((acc, item) => {
            acc[item.id] = item.slots;
            return acc;
          }, {});
          setAvailability(mapped);
        }
      } finally {
        if (!cancelled) {
          setLoadingAvailability(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [selectedBusinessId, services, selectedDate]);

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
        {businesses.map((b) => {
          const isSelected = b.id === selectedBusinessId;
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setSelectedBusinessId(b.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: isSelected ? "2px solid #2563eb" : "1px solid #eee",
                  borderRadius: 8,
                  padding: "1rem",
                  background: isSelected ? "#eff6ff" : "#fff",
                  cursor: "pointer"
                }}
              >
                <h2 style={{ margin: 0 }}>{b.name}</h2>
                {b.whatsapp_number ? <p style={{ marginTop: "0.5rem" }}>WhatsApp: {b.whatsapp_number}</p> : null}
                {isSelected ? <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#2563eb" }}>Selected</p> : null}
              </button>
            </li>
          );
        })}
      </ul>

      {selectedBusinessId ? (
        <section style={{ marginTop: "2rem" }}>
          <header style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ margin: 0 }}>Services &amp; availability</h2>
            <label style={{ fontSize: "0.9rem" }}>
              Date
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ marginLeft: "0.5rem", padding: "0.25rem" }}
              />
            </label>
          </header>

          {loadingServices ? (
            <p>Loading services…</p>
          ) : services.length === 0 ? (
            <p>No services for this business yet.</p>
          ) : (
            <ul style={{ display: "grid", gap: "1rem" }}>
              {services.map((service) => {
                const slots = availability[service.id] ?? [];
                return (
                  <li
                    key={service.id}
                    style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem", background: "#fafafa" }}
                  >
                    <h3 style={{ marginTop: 0 }}>{service.name}</h3>
                    <div style={{ fontSize: "0.9rem", color: "#444", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      {service.price != null ? <span>R$ {service.price.toFixed(2)}</span> : <span>Price not set</span>}
                      {service.duration_minutes != null ? <span>{service.duration_minutes} min</span> : null}
                    </div>
                    {loadingAvailability ? (
                      <p style={{ marginTop: "0.75rem" }}>Checking availability…</p>
                    ) : slots.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginTop: "0.75rem",
                          flexWrap: "wrap"
                        }}
                      >
                        {slots.slice(0, 6).map((slot) => (
                          <span
                            key={slot}
                            style={{
                              padding: "0.35rem 0.75rem",
                              borderRadius: 999,
                              background: "#dbeafe",
                              color: "#1d4ed8",
                              fontSize: "0.85rem",
                              fontWeight: 600
                            }}
                          >
                            {formatTime(slot)}
                          </span>
                        ))}
                        {slots.length > 6 ? <span style={{ fontSize: "0.85rem", color: "#555" }}>+ more slots</span> : null}
                      </div>
                    ) : (
                      <p style={{ marginTop: "0.75rem" }}>No availability for this date.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <p style={{ marginTop: "2rem" }}>Select a business to see its services and availability.</p>
      )}
    </main>
  );
}

function formatTime(slot: string) {
  const date = new Date(slot);
  if (Number.isNaN(date.getTime())) {
    return slot;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}
