// app/api/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("business_id");
  const serviceId = searchParams.get("service_id");
  const professionalId = searchParams.get("professional_id");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!businessId || !serviceId || !professionalId || !date) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  // 1. service
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: "service not found" }, { status: 404 });
  }

  const durationMin = service.duration_min || 30;

  // weekday 1..7
  const weekday = new Date(date).getDay(); // 0..6
  const weekdayPg = weekday === 0 ? 7 : weekday; // Sunday = 7

  // 2. rules for professional
  const { data: rules } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("weekday", weekdayPg);

  // 3. exceptions
  const { data: exceptions } = await supabase
    .from("availability_exceptions")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("date", date);

  // 4. bookings for that day
  const startOfDay = date + "T00:00:00Z";
  const endOfDay = date + "T23:59:59Z";

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("professional_id", professionalId)
    .gte("start_at", startOfDay)
    .lte("start_at", endOfDay)
    .eq("status", "confirmed");

  // now build slots from rules
  const slots: { start: string }[] = [];

  for (const rule of rules || []) {
    const slotSize = rule.slot_size_min || 30;
    // check exceptions
    const isClosed = (exceptions || []).some(exc => exc.is_closed);
    if (isClosed) continue;

    const startTime = rule.start_time; // "09:00:00"
    const endTime = rule.end_time;     // "17:00:00"

    let current = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    while (current < end) {
      const slotStartIso = current.toISOString();
      const slotEnd = new Date(current.getTime() + durationMin * 60000);

      // check conflict with bookings
      const conflict = (bookings || []).some(b => {
        const bStart = new Date(b.start_at).getTime();
        const bEnd = new Date(b.end_at).getTime();
        return (
          (current.getTime() >= bStart && current.getTime() < bEnd) ||
          (slotEnd.getTime() > bStart && slotEnd.getTime() <= bEnd)
        );
      });

      if (!conflict) {
        slots.push({ start: slotStartIso });
      }

      current = new Date(current.getTime() + slotSize * 60000);
    }
  }

  return NextResponse.json(slots);
}
