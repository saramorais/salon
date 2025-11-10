// app/api/whatsapp-sim/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// helper to fetch services from your own API
async function fetchServices() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/services`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

// helper to fetch availability from your own API
async function fetchAvailability(serviceId: string, date?: string) {
  const params = new URLSearchParams();
  params.set("serviceId", serviceId);
  if (date) params.set("date", date);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/availability?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    // 1. Ask OpenAI what the user wants
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a scheduler bot. You read the user's message and decide the intent. You speak Portuguese. You are a friendly and bubbly customer service rep. Valid intents: check_availability, create_booking, small_talk. Always return JSON."
        },
        {
          role: "user",
          content: `User said: "${message}". Return JSON only.`,
        },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = { intent: "small_talk" };
    }

    // 2. Get services from your API
    const services = await fetchServices();

    // Try to match a service by name if the model returned one
    let chosenService: any = null;
    if (parsed.service && Array.isArray(services)) {
      const lower = parsed.service.toLowerCase();
      chosenService =
        services.find((s: any) => s.name?.toLowerCase() === lower) ||
        services.find((s: any) => s.name?.toLowerCase().includes(lower));
    }

    // If intent is check_availability
    if (parsed.intent === "check_availability") {
      if (!chosenService && Array.isArray(services) && services.length === 1) {
        chosenService = services[0];
      }

      if (!chosenService) {
        const list = services.map((s: any) => `• ${s.name}`).join("\n");
        return NextResponse.json({
          ok: true,
          modelOutput: parsed,
          reply: `Which service do you want?\n${list}`,
        });
      }

      // 3. Fetch availability for that service
      const availability = await fetchAvailability(chosenService.id, parsed.date);

      if (!availability || availability.length === 0) {
        return NextResponse.json({
          ok: true,
          modelOutput: parsed,
          reply: `I did not find availability for ${chosenService.name} on that date. Try another day.`,
        });
      }

      const firstSlots = availability.slice(0, 4).map((slot: any) => {
        const start = slot.start || slot.time || slot;
        return `• ${start}`;
      });

      return NextResponse.json({
        ok: true,
        modelOutput: parsed,
        reply:
          `Here are the next times for ${chosenService.name}:\n` +
          firstSlots.join("\n") +
          `\nReply with a time to book.`,
      });
    }

    // If intent is create_booking
    if (parsed.intent === "create_booking") {
      // Later you will call your /api/bookings here.
      return NextResponse.json({
        ok: true,
        modelOutput: parsed,
        reply: `Ok. I will create a booking for ${parsed.date || "the next available time"}. (Booking call not wired yet.)`,
      });
    }

    // fallback
    return NextResponse.json({
      ok: true,
      modelOutput: parsed,
      reply: "Hi. I can show services, show availability and book. Try: Do you have availability for haircut tomorrow?",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
    