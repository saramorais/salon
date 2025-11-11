// app/dashboard/[businessId]/layout.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { fetchBusinessById } from "@/lib/dashboardApi";

type BusinessLayoutProps = {
  children: ReactNode;
  params: { businessId: string };
};

const navigation = [
  { label: "Visão geral", segment: "" },
  { label: "Serviços", segment: "services" },
  { label: "Profissionais", segment: "professionals" },
  { label: "Agenda", segment: "calendar" },
];

export default async function BusinessLayout({
  children,
  params,
}: BusinessLayoutProps) {
  const business = await fetchBusinessById(params.businessId);

  if (!business) {
    notFound();
  }

  const basePath = `/dashboard/${params.businessId}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-4">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Administração
          </span>
          <h1 className="text-xl font-semibold text-slate-800">
            {business.name}
          </h1>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl gap-6 px-6 py-6">
        <aside className="w-56 shrink-0">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const href = item.segment
                ? `${basePath}/${item.segment}`
                : basePath;

              return (
                <Link
                  key={item.segment || "overview"}
                  href={href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 pb-12">{children}</main>
      </div>
    </div>
  );
}
