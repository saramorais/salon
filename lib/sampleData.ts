import { supabase } from "@/lib/supabaseClient";

const SAMPLE_BUSINESS_NAME = "Radiant Hair Studio";
const SAMPLE_WHATSAPP = "+55 11 98888-7766";

type InsertResult = {
  id: string;
};

export async function ensureSampleData() {
  const existingBusinessId = await findSampleBusinessId();

  const businessId = existingBusinessId ?? (await createSampleBusiness());

  if (!businessId) {
    return;
  }

  await ensureSampleServices(businessId);
  await ensureSampleBusinessHours(businessId);
}

async function findSampleBusinessId() {
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("name", SAMPLE_BUSINESS_NAME)
    .limit(1);

  if (error) {
    console.error("Failed to check sample business", error);
    return null;
  }

  return data && data.length > 0 ? data[0].id : null;
}

async function createSampleBusiness() {
  const { data, error } = await supabase
    .from("businesses")
    .insert({
      name: SAMPLE_BUSINESS_NAME,
      whatsapp_number: SAMPLE_WHATSAPP
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create sample business", error);
    return null;
  }

  return (data as InsertResult | null)?.id ?? null;
}

async function ensureSampleServices(businessId: string) {
  const services = [
    {
      name: "Signature Haircut",
      price: 120,
      duration_minutes: 45
    },
    {
      name: "Color & Highlights",
      price: 320,
      duration_minutes: 120
    },
    {
      name: "Express Blowout",
      price: 90,
      duration_minutes: 30
    }
  ];

  for (const service of services) {
    const { data: existing, error: fetchError } = await supabase
      .from("services")
      .select("id")
      .eq("business_id", businessId)
      .eq("name", service.name)
      .limit(1);

    if (fetchError) {
      console.error(`Failed to check sample service ${service.name}`, fetchError);
      continue;
    }

    if (existing && existing.length > 0) {
      continue;
    }

    const { error: insertError } = await supabase.from("services").insert({
      ...service,
      business_id: businessId
    });

    if (insertError) {
      console.error(`Failed to insert sample service ${service.name}`, insertError);
    }
  }
}

async function ensureSampleBusinessHours(businessId: string) {
  const { data, error } = await supabase
    .from("business_hours")
    .select("id")
    .eq("business_id", businessId)
    .limit(1);

  if (error) {
    console.error("Failed to check business hours", error);
    return;
  }

  if (data && data.length > 0) {
    return;
  }

  const hoursPayload = Array.from({ length: 7 }, (_, weekday) => ({
    business_id: businessId,
    weekday,
    start_time: "09:00",
    end_time: "17:00"
  }));

  const { error: insertError } = await supabase.from("business_hours").insert(hoursPayload);

  if (insertError) {
    console.error("Failed to insert business hours", insertError);
  }
}
