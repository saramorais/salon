// app/dashboard/[businessId]/calendar/page.tsx
import Link from "next/link";
import {
  fetchAvailabilityForDay,
  fetchProfessionalsForBusiness,
  fetchServicesForBusiness,
  Professional,
  Service,
} from "@/lib/dashboardApi";

type CalendarPageProps = {
  params: { businessId: string };
  searchParams?: {
    date?: string;
    serviceId?: string;
    professionalId?: string;
  };
};

function getDateOrToday(date?: string) {
  if (!date) {
    return new Date().toISOString().split("T")[0];
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split("T")[0];
  }

  return date;
}

function addDays(date: string, diff: number) {
  const current = new Date(`${date}T00:00:00`);
  current.setDate(current.getDate() + diff);
  return current.toISOString().split("T")[0];
}

function formatSlot(slot: string) {
  return new Date(slot).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function findSelected<T extends { id: string }>(
  items: T[],
  requestedId?: string,
) {
  if (!requestedId) return items[0];
  return items.find((item) => item.id === requestedId) ?? items[0];
}

export default async function CalendarPage({
  params,
  searchParams,
}: CalendarPageProps) {
  const [services, professionals] = await Promise.all([
    fetchServicesForBusiness(params.businessId),
    fetchProfessionalsForBusiness(params.businessId),
  ]);

  const selectedDate = getDateOrToday(searchParams?.date);
  const selectedService = findSelected<Service>(
    services,
    searchParams?.serviceId,
  );
  const selectedProfessional = findSelected<Professional>(
    professionals,
    searchParams?.professionalId,
  );

  const slots =
    selectedService && selectedProfessional
      ? await fetchAvailabilityForDay({
          businessId: params.businessId,
          serviceId: selectedService.id,
          professionalId: selectedProfessional.id,
          date: selectedDate,
        })
      : [];

  const prevDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Agenda diária</h2>
          <p className="text-sm text-slate-500">
            Visualize horários disponíveis e agendamentos por profissional.
          </p>
        </div>
        <Link
          href={`/dashboard/${params.businessId}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Voltar
        </Link>
      </div>

      <form
        action={`/dashboard/${params.businessId}/calendar`}
        className="flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4 shadow-sm"
      >
        <div className="flex flex-1 min-w-[220px] flex-col">
          <label className="text-xs font-semibold uppercase text-slate-500">
            Data
          </label>
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        <div className="flex flex-1 min-w-[220px] flex-col">
          <label className="text-xs font-semibold uppercase text-slate-500">
            Serviço
          </label>
          <select
            name="serviceId"
            defaultValue={selectedService?.id}
            className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 min-w-[220px] flex-col">
          <label className="text-xs font-semibold uppercase text-slate-500">
            Profissional
          </label>
          <select
            name="professionalId"
            defaultValue={selectedProfessional?.id}
            className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-10 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
        >
          Filtrar
        </button>
      </form>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/dashboard/${params.businessId}/calendar?date=${prevDate}&serviceId=${selectedService?.id ?? ""}&professionalId=${selectedProfessional?.id ?? ""}`}
            className="rounded-md border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-100"
          >
            Dia anterior
          </Link>
          <Link
            href={`/dashboard/${params.businessId}/calendar?date=${nextDate}&serviceId=${selectedService?.id ?? ""}&professionalId=${selectedProfessional?.id ?? ""}`}
            className="rounded-md border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-100"
          >
            Próximo dia
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800">
            Horários disponíveis
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-3">
            {slots.map((slot) => (
              <div
                key={slot.start}
                className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-center font-medium text-emerald-700"
              >
                {formatSlot(slot.start)}
              </div>
            ))}
            {slots.length === 0 && (
              <p className="col-span-full text-center text-slate-500">
                Nenhuma disponibilidade encontrada para os filtros selecionados.
              </p>
            )}
          </div>
        </div>

        <aside className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800">Resumo</h3>
          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                Serviço
              </dt>
              <dd className="mt-1 text-base text-slate-900">
                {selectedService ? selectedService.name : "--"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                Profissional
              </dt>
              <dd className="mt-1 text-base text-slate-900">
                {selectedProfessional ? selectedProfessional.name : "--"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                Total de horários livres
              </dt>
              <dd className="mt-1 text-base text-slate-900">{slots.length}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
