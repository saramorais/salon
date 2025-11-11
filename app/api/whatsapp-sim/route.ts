// app/api/whatsapp-sim/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type Business = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  business_id: string;
};

type AvailabilitySlot = {
  start?: string;
  time?: string;
} | string;

type ModelIntent = "check_availability" | "create_booking" | "small_talk";

type ModelResponse = {
  intent: ModelIntent;
  service?: string;
  date?: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function resolveApiUrl(path: string, base: string) {
  return new URL(path, base).toString();
}

async function fetchBusinesses(baseUrl: string): Promise<Business[]> {
  try {
    const res = await fetch(resolveApiUrl("/api/businesses", baseUrl), {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch businesses", error);
    return [];
  }
}

async function fetchServices(baseUrl: string, businessId?: string): Promise<Service[]> {
  try {
    const url = new URL(resolveApiUrl("/api/services", baseUrl));
    if (businessId) url.searchParams.set("business_id", businessId);
    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch services", error);
    return [];
  }
}

async function fetchAvailability(
  baseUrl: string,
  businessId: string,
  serviceId: string,
  date: string
): Promise<AvailabilitySlot[]> {
  try {
    const url = new URL(resolveApiUrl("/api/availability", baseUrl));
    url.searchParams.set("business_id", businessId);
    url.searchParams.set("service_id", serviceId);
    url.searchParams.set("date", date);
    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch availability", error);
    return [];
  }
}

function isModelIntent(value: unknown): value is ModelIntent {
  return (
    value === "check_availability" ||
    value === "create_booking" ||
    value === "small_talk"
  );
}

// Helper: make a natural reply
async function generateFriendlyReply(context: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `
Você é *Luna*, atendente do salão Joylua.
Seu estilo é simpático e natural — como uma conversa no WhatsApp.
Seja breve e agradável, em português. Evite linguagem robótica.
`,
        },
        {
          role: "user",
          content: `Escreva uma mensagem amigável com base neste contexto:\n${context}`,
        },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() || context;
  } catch (err) {
    console.error("Erro ao gerar resposta amigável:", err);
    return context;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    const baseUrl = req.nextUrl?.origin ?? req.url;
    const businesses = await fetchBusinesses(baseUrl);
    const business = businesses[0] ?? null;

    const services = await fetchServices(baseUrl, business?.id);
    const serviceNames = services.map(s => s.name).join(", ");
    const today = new Date();
    const defaultDate = today.toISOString().slice(0, 10);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        ok: false,
        reply: "A chave da OpenAI não está configurada.",
      });
    }

    // -------- First call: interpret user -------------
    const interpretation = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
Você é uma atendente de salão de beleza chamada Luna.
Seu trabalho é entender o que o cliente quer.
Responda SOMENTE com JSON válido. Nada além disso.

Campos:
{
  "intent": "check_availability" | "create_booking" | "small_talk",
  "service": "nome do serviço se mencionado" (opcional),
  "date": "YYYY-MM-DD" (opcional)
}

Serviços disponíveis: ${serviceNames || "nenhum serviço cadastrado"}.
Hoje é ${defaultDate}.
Se o cliente não disser data, use o próximo dia útil como "date".
`,
        },
        { role: "user", content: message },
      ],
    });

    const raw = interpretation.choices[0]?.message?.content ?? "{}";

    let parsed: ModelResponse = { intent: "small_talk" };
    try {
      const match = raw.match(/{[\s\S]*}/);
      const json = match ? match[0] : raw;
      const obj = JSON.parse(json);
      if (isModelIntent(obj.intent)) parsed.intent = obj.intent;
      if (typeof obj.service === "string") parsed.service = obj.service;
      if (typeof obj.date === "string") parsed.date = obj.date;
    } catch (err) {
      console.warn("Erro ao interpretar JSON:", raw);
    }

    // -------- Handle logic -------------
    if (!Array.isArray(services) || services.length === 0) {
      const friendly = await generateFriendlyReply(
        "Ainda não há serviços cadastrados. Peça para o dono do salão adicionar um serviço para começar os agendamentos."
      );
      return NextResponse.json({ ok: true, reply: friendly });
    }

    let chosenService: Service | null = null;
    if (parsed.service) {
      const lower = parsed.service.toLowerCase();
      chosenService =
        services.find(s => s.name?.toLowerCase() === lower) ||
        services.find(s => s.name?.toLowerCase().includes(lower)) ||
        null;
    }

    // ---- Check Availability ----
    if (parsed.intent === "check_availability") {
      if (!chosenService && services.length === 1) {
        chosenService = services[0];
      }

      if (!chosenService) {
        const list = services.map(s => `• ${s.name}`).join("\n");
        const friendly = await generateFriendlyReply(
          `O cliente quer ver horários, mas ainda não escolheu o serviço. Liste as opções:\n${list}`
        );
        return NextResponse.json({ ok: true, reply: friendly });
      }

      if (!business) {
        const friendly = await generateFriendlyReply(
          "Não consegui identificar o salão no sistema."
        );
        return NextResponse.json({ ok: false, reply: friendly });
      }

      const date = parsed.date || defaultDate;
      const availability = await fetchAvailability(
        baseUrl,
        business.id,
        chosenService.id,
        date
      );

      if (!availability || availability.length === 0) {
        const friendly = await generateFriendlyReply(
          `Não encontrei horários disponíveis para ${chosenService.name} em ${date}.`
        );
        return NextResponse.json({ ok: true, reply: friendly });
      }

      const formatter = new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const firstSlots = availability
        .slice(0, 4)
        .map(slot => {
          const start =
            typeof slot === "string" ? slot : slot.start || slot.time;
          const d = start ? new Date(start) : null;
          return d ? formatter.format(d) : "";
        })
        .filter(Boolean)
        .join(", ");

      const baseMessage = `Horários disponíveis para ${chosenService.name} em ${date}: ${firstSlots}.`;
      const friendly = await generateFriendlyReply(baseMessage);

      return NextResponse.json({ ok: true, reply: friendly });
    }

    // ---- Create Booking ----
    if (parsed.intent === "create_booking") {
      const baseMessage = `Perfeito! Vamos confirmar o agendamento para ${parsed.service || "o serviço desejado"} em ${parsed.date || "um dos próximos horários disponíveis"}. (Integração em breve)`;
      const friendly = await generateFriendlyReply(baseMessage);
      return NextResponse.json({ ok: true, reply: friendly });
    }

    // ---- Small Talk or Unknown ----
    const fallback = await generateFriendlyReply(
      "Oi! Posso te ajudar com horários, serviços e reservas. Pergunte algo como: 'Vocês têm horário pra corte amanhã?'"
    );
    return NextResponse.json({ ok: true, reply: fallback });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "server error" },
      { status: 500 }
    );
  }
}