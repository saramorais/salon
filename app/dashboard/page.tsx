// app/dashboard/page.tsx
import Link from "next/link";
import { fetchBusinesses } from "@/lib/dashboardApi";

export default async function DashboardPage() {
  const businesses = await fetchBusinesses();

  if (businesses.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <p className="text-slate-600">
          Nenhum negócio cadastrado ainda. Crie um novo para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <span className="text-sm text-slate-500">
          {businesses.length} negócio{businesses.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {businesses.map((business) => (
          <Link
            key={business.id}
            href={`/dashboard/${business.id}`}
            className="border rounded-lg p-4 hover:border-slate-300 transition"
          >
            <h2 className="text-lg font-medium">{business.name}</h2>
            <p className="text-sm text-slate-500 mt-1">
              Ver detalhes do negócio
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
