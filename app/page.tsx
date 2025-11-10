import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", maxWidth: 600 }}>
      <h1>Agenda Fácil</h1>
      <p style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
        Quick links to your admin pages.
      </p>

      <ul style={{ display: "grid", gap: "1rem" }}>
        <li>
          <Link href="/businesses" style={{ textDecoration: "underline" }}>
            Businesses
          </Link>
          <p style={{ fontSize: "0.85rem", color: "#666" }}>
            Add salons and studios.
          </p>
        </li>

        <li>
          <Link href="/services" style={{ textDecoration: "underline" }}>
            Services
          </Link>
          <p style={{ fontSize: "0.85rem", color: "#666" }}>
            Add services for each business.
          </p>
        </li>

        <li>
          <Link href="/availability" style={{ textDecoration: "underline" }}>
            Availability test
          </Link>
          <p style={{ fontSize: "0.85rem", color: "#666" }}>
            See generated time slots.
          </p>
        </li>
      </ul>
    </main>
  );
}
