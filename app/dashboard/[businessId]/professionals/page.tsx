// app/dashboard/[businessId]/professionals/page.tsx
import Link from "next/link";
import { fetchProfessionalsForBusiness } from "@/lib/dashboardApi";

type ProfessionalsPageProps = {
  params: { businessId: string };
};

export default async function ProfessionalsPage({
  params,
}: ProfessionalsPageProps) {
  const professionals = await fetchProfessionalsForBusiness(params.businessId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Profissionais</h2>
          <p className="text-sm text-slate-500">
            Equipe responsável pelos atendimentos.
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
            Novo profissional
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {professionals.map((professional) => (
          <div
            key={professional.id}
            className="rounded-lg border bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {professional.name}
                </h3>
                {professional.role && (
                  <p className="text-sm text-slate-500">{professional.role}</p>
                )}
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  professional.active === false
                    ? "bg-slate-200 text-slate-600"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {professional.active === false ? "Inativo" : "Ativo"}
              </span>
            </div>

            {professional.bio && (
              <p className="mt-3 text-sm text-slate-600">
                {professional.bio}
              </p>
            )}

            <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
              <button type="button" className="hover:text-slate-600">
                Editar
              </button>
              <span>•</span>
              <button type="button" className="hover:text-rose-600">
                Desativar
              </button>
            </div>
          </div>
        ))}
        {professionals.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-12 text-center text-slate-500">
            Nenhum profissional cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}
