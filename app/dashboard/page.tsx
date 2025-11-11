// app/dashboard/page.tsx
import Link from "next/link";

async function getBusinesses() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/businesses`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function DashboardPage() {
  const businesses = await getBusinesses();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {businesses.map((b: any) => (
          <Link
            key={b.id}
            href={`/dashboard/${b.id}`}
            className="border rounded-lg p-4 hover:bg-slate-50"
          >
            <h2 className="text-lg font-medium">{b.name}</h2>
            <p className="text-sm text-slate-500">ver detalhes</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
