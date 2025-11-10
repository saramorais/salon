"use client";

import { useEffect, useState } from "react";

export default function AvailabilityPage() {
  const [businessId, setBusinessId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("2025-11-10");
  const [slots, setSlots] = useState<string[]>([]);

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [bRes, sRes] = await Promise.all([
        fetch("/api/businesses"),
        fetch("/api/services")
      ]);

      const bData = await bRes.json();
      const sData = await sRes.json();

      setBusinesses(bData);
      setServices(sData);

      if (bData.length > 0) setBusinessId(bData[0].id);
      if (sData.length > 0) setServiceId(sData[0].id);
    }
    load();
  }, []);

  async function fetchSlots() {
    if (!businessId || !serviceId || !date) return;
    const res = await fetch(
      `/api/availability?business_id=${businessId}&service_id=${serviceId}&date=${date}`
    );
    const data = await res.json();
    setSlots(data);
  }

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>Availability test</h1>

      <div style={{ display: "grid", gap: "0.75rem", maxWidth: 400, marginTop: "1rem" }}>
        <label>
          Business
          <select value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
            <option value="">Select</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Service
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">Select</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <button onClick={fetchSlots} style={{ padding: "0.5rem 1rem" }}>
          Get slots
        </button>
      </div>

      <ul style={{ marginTop: "1.5rem" }}>
        {slots.map((slot) => (
          <li key={slot}>{slot}</li>
        ))}
      </ul>
    </main>
  );
}
