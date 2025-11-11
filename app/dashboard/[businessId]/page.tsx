// app/dashboard/[businessId]/page.tsx
import Link from "next/link";
import {
  fetchBusinessById,
  fetchProfessionalsForBusiness,
  fetchServicesForBusiness,
} from "@/lib/dashboardApi";

export default async function BusinessOverviewPage({
  params,
}: {
  params: { businessId: string };
}) {
  const [business, services, professionals] = await Promise.all([
    fetchBusinessById(params.businessId),
    fetchServicesForBusiness(params.businessId),
    fetchProfessionalsForBusiness(params.businessId),
  ]);

  if (!business) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-700">
        Não encontramos este negócio.
      </div>
    );
  }

  const primaryService = services[0];
  const primaryProfessional = professionals[0];

  return (
    <div className="space-y-10">
      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-800">Informações</h2>
        <dl className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Nome
            </dt>
            <dd className="mt-1 text-base text-slate-900">{business.name}</dd>
          </div>
          {business.whatsapp_number && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                WhatsApp
              </dt>
              <dd className="mt-1 text-base text-slate-900">
                {business.whatsapp_number}
              </dd>
            </div>
          )}
          {business.address && (
            <div className="md:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                Endereço
              </dt>
              <dd className="mt-1 text-base text-slate-900">
                {business.address}
                {business.city ? `, ${business.city}` : ""}
                {business.state ? ` - ${business.state}` : ""}
              </dd>
            </div>
          )}
          {business.description && (
            <div className="md:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                Descrição
              </dt>
              <dd className="mt-1 text-slate-700">{business.description}</dd>
            </div>
          )}
        </dl>
      </section>

      <section>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href={`/dashboard/${params.businessId}/services`}
            className="flex flex-col justify-between rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div>
              <p className="text-sm text-slate-500">Serviços</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {services.length}
              </p>
            </div>
            <span className="mt-4 text-sm font-medium text-emerald-600">
              Ver serviços
            </span>
          </Link>
          <Link
            href={`/dashboard/${params.businessId}/professionals`}
            className="flex flex-col justify-between rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div>
              <p className="text-sm text-slate-500">Profissionais</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {professionals.length}
              </p>
            </div>
            <span className="mt-4 text-sm font-medium text-emerald-600">
              Ver profissionais
            </span>
          </Link>
          <Link
            href={`/dashboard/${params.businessId}/calendar`}
            className="flex flex-col justify-between rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div>
              <p className="text-sm text-slate-500">Agenda</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {primaryService && primaryProfessional ? "Hoje" : "--"}
              </p>
            </div>
            <span className="mt-4 text-sm font-medium text-emerald-600">
              Abrir agenda
            </span>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-slate-800">
              Serviços populares
            </h3>
            <Link
              href={`/dashboard/${params.businessId}/services`}
              className="text-sm font-medium text-emerald-600"
            >
              Gerenciar
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {services.slice(0, 4).map((service) => (
              <li key={service.id} className="flex items-center justify-between">
                <span>{service.name}</span>
                {service.price !== null && service.price !== undefined && (
                  <span className="text-slate-500">
                    R$ {Number(service.price).toFixed(2)}
                  </span>
                )}
              </li>
            ))}
            {services.length === 0 && (
              <li className="text-slate-500">
                Cadastre um serviço para começar a vender.
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-slate-800">
              Profissionais ativos
            </h3>
            <Link
              href={`/dashboard/${params.businessId}/professionals`}
              className="text-sm font-medium text-emerald-600"
            >
              Gerenciar
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {professionals.slice(0, 4).map((professional) => (
              <li key={professional.id} className="flex items-center justify-between">
                <span>{professional.name}</span>
                {professional.role && (
                  <span className="text-slate-500">{professional.role}</span>
                )}
              </li>
            ))}
            {professionals.length === 0 && (
              <li className="text-slate-500">
                Cadastre profissionais para aceitar agendamentos.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
