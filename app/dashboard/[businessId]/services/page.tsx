// app/dashboard/[businessId]/services/page.tsx
import Link from "next/link";
import { fetchServicesForBusiness } from "@/lib/dashboardApi";

type ServicesPageProps = {
  params: { businessId: string };
};

function formatDuration(minutes?: number | null) {
  if (!minutes) return "--";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (!hours) {
    return `${mins} min`;
  }

  if (!mins) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const services = await fetchServicesForBusiness(params.businessId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Serviços</h2>
          <p className="text-sm text-slate-500">
            Lista de serviços oferecidos pelo negócio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${params.businessId}`}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Voltar
          </Link>
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
          >
            Novo serviço
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Duração</th>
              <th className="px-4 py-3">Preço</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {service.name}
                </td>
                <td className="px-4 py-3">{formatDuration(service.duration_minutes)}</td>
                <td className="px-4 py-3">
                  {service.price !== null && service.price !== undefined
                    ? `R$ ${Number(service.price).toFixed(2)}`
                    : "--"}
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  Nenhum serviço cadastrado por enquanto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
