const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

async function fetchFromApi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(`Request to ${path} failed with status ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`Request to ${path} failed`, error);
    return null;
  }
}

export type Business = {
  id: string;
  name: string;
  description?: string | null;
  whatsapp_number?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
};

export type Service = {
  id: string;
  name: string;
  price?: number | null;
  duration_minutes?: number | null;
  business_id: string;
};

export type Professional = {
  id: string;
  name: string;
  role?: string | null;
  bio?: string | null;
  business_id: string;
  active?: boolean | null;
};

export type AvailabilitySlot = {
  start: string;
};

export async function fetchBusinesses(): Promise<Business[]> {
  const data = await fetchFromApi<Business[]>("/api/businesses");
  return data ?? [];
}

export async function fetchBusinessById(
  businessId: string,
): Promise<Business | null> {
  const businesses = await fetchBusinesses();
  return businesses.find((business) => business.id === businessId) ?? null;
}

export async function fetchServicesForBusiness(
  businessId: string,
): Promise<Service[]> {
  const data = await fetchFromApi<Service[]>(
    `/api/services?business_id=${encodeURIComponent(businessId)}`,
  );

  return data ?? [];
}

export async function fetchProfessionalsForBusiness(
  businessId: string,
): Promise<Professional[]> {
  const data = await fetchFromApi<Professional[]>(
    `/api/professionals?business_id=${encodeURIComponent(businessId)}`,
  );

  return data ?? [];
}

export async function fetchAvailabilityForDay(params: {
  businessId: string;
  serviceId: string;
  professionalId: string;
  date: string; // YYYY-MM-DD
}): Promise<AvailabilitySlot[]> {
  const search = new URLSearchParams({
    business_id: params.businessId,
    service_id: params.serviceId,
    professional_id: params.professionalId,
    date: params.date,
  });

  const data = await fetchFromApi<AvailabilitySlot[]>(
    `/api/availability?${search.toString()}`,
  );

  return data ?? [];
}
