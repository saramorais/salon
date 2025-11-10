import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/availability?business_id=...&service_id=...&date=2025-11-10
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("business_id");
  const serviceId = searchParams.get("service_id");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!businessId || !serviceId || !date) {
    return NextResponse.json(
      { error: "business_id, service_id and date are required" },
      { status: 400 }
    );
  }

  // 1. get service to know duration
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();

  if (serviceError || !service) {
    return NextResponse.json(
      { error: "Service not found" },
      { status: 404 }
    );
  }

  const duration = service.duration_minutes || 60;

  // 2. get business hours for that weekday
  const weekday = new Date(date).getDay(); // 0 sunday ... 6 saturday

  const { data: hours, error: hoursError } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", businessId)
    .eq("weekday", weekday);

  if (hoursError) {
    return NextResponse.json(
      { error: hoursError.message },
      { status: 500 }
    );
  }

  if (!hours || hours.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  // For now assume one block per day
  const bh = hours[0];

  // 3. get existing bookings for that date
  // we will fetch all bookings for this business on that day
  const startOfDay = new Date(date + "T00:00:00Z").toISOString();
  const endOfDay = new Date(date + "T23:59:59Z").toISOString();

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("start_at, end_at")
    .eq("business_id", businessId)
    .gte("start_at", startOfDay)
    .lte("start_at", endOfDay);

  if (bookingsError) {
    return NextResponse.json(
      { error: bookingsError.message },
      { status: 500 }
    );
  }

  // 4. generate slots
  const slots = generateSlots(date, bh.start_time, bh.end_time, duration);

  // 5. filter out slots that collide with bookings
  const available = slots.filter((slot) => {
    const slotStart = new Date(slot);
    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

    const overlaps = bookings?.some((b) => {
      const bStart = new Date(b.start_at);
      const bEnd = new Date(b.end_at);
      return slotStart < bEnd && slotEnd > bStart;
    });

    return !overlaps;
  });

  return NextResponse.json(available, { status: 200 });
}

function generateSlots(
  date: string,
  startTime: string,
  endTime: string,
  duration: number
): string[] {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const start = new Date(date);
  start.setUTCHours(startHour, startMinute, 0, 0);

  const end = new Date(date);
  end.setUTCHours(endHour, endMinute, 0, 0);

  const slots: string[] = [];

  let current = new Date(start);
  while (current < end) {
    slots.push(new Date(current).toISOString());
    current = new Date(current.getTime() + duration * 60 * 1000);
  }

  return slots;
}
