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

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Failed to fetch businesses", error);
    return [];
  }
}

async function fetchServices(baseUrl: string, businessId?: string): Promise<Service[]> {
  try {
    const url = new URL(resolveApiUrl("/api/services", baseUrl));
    if (businessId) {
      url.searchParams.set("business_id", businessId);
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

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

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Failed to fetch availability", error);
    return [];
  }
}

function isModelIntent(value: unknown): value is ModelIntent {
  return value === "check_availability" || value === "create_booking" || value === "small_talk";
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
    const serviceNames = services.map(service => service.name).join(", ");

    const today = new Date();
    const defaultDate = today.toISOString().slice(0, 10);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        ok: false,
        reply: "A chave da OpenAI não está configurada. Configure OPENAI_API_KEY e tente novamente.",
      }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Você é uma atendente de salão de beleza muito simpática. Entenda a intenção do cliente e responda apenas com JSON." +
            " Intenções válidas: check_availability, create_booking, small_talk." +
            " Serviços disponíveis: " + (serviceNames || "nenhum serviço cadastrado") +
            ". Para check_availability, inclua {\"intent\":\"check_availability\", \"service\":\"nome do serviço\", \"date\":\"YYYY-MM-DD\"}." +
            " Se o cliente não informar data, escolha o próximo dia útil nesse formato.",
        },
        {
          role: "user",
          content: `Mensagem do cliente: "${message}". Responda apenas com JSON válido.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    const defaultParsed: ModelResponse = { intent: "small_talk" };
    let parsed: ModelResponse = defaultParsed;
    let modelOutput: Record<string, unknown> | null = null;

    try {
      const candidate = JSON.parse(raw) as Record<string, unknown>;
      modelOutput = candidate;
      parsed = {
        intent: isModelIntent(candidate.intent) ? candidate.intent : "small_talk",
        service: typeof candidate.service === "string" ? candidate.service : undefined,
        date: typeof candidate.date === "string" ? candidate.date : undefined,
      };
    } catch (error) {
      console.warn("Failed to parse model response", raw, error);
    }

    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json({
        ok: true,
        modelOutput: modelOutput ?? parsed,
        reply: "Ainda não temos serviços cadastrados. Cadastre um serviço para começar a atender seus clientes!",
      });
    }

    let chosenService: Service | null = null;
    if (parsed.service) {
      const lower = String(parsed.service).toLowerCase();
      chosenService =
        services.find(service => service.name?.toLowerCase() === lower) ||
        services.find(service => service.name?.toLowerCase().includes(lower)) ||
        null;
    }

    if (parsed.intent === "check_availability") {
      if (!chosenService && services.length === 1) {
        chosenService = services[0];
      }

      if (!chosenService) {
        const list = services.map(service => `• ${service.name}`).join("\n");
        return NextResponse.json({
          ok: true,
          modelOutput: modelOutput ?? parsed,
          reply: `Qual serviço você quer?\n${list}`,
        });
      }

      if (!business) {
        return NextResponse.json({
          ok: false,
          modelOutput: modelOutput ?? parsed,
          reply: "Não consegui identificar o salão. Tente novamente mais tarde.",
        });
      }

      const date = typeof parsed.date === "string" && parsed.date ? parsed.date : defaultDate;

      const availability = await fetchAvailability(baseUrl, business.id, chosenService.id, date);

      if (!availability || availability.length === 0) {
        return NextResponse.json({
          ok: true,
          modelOutput: modelOutput ?? parsed,
          reply: `Não encontrei horários disponíveis para ${chosenService.name} em ${date}. Vamos tentar outro dia?`,
        });
      }

      const formatter = new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const firstSlots = availability.slice(0, 4).map(slot => {
        const start = typeof slot === "string" ? slot : slot.start || slot.time;
        const slotDate = start ? new Date(start) : null;
        return slotDate ? `• ${formatter.format(slotDate)}` : "";
      }).filter(Boolean);

      return NextResponse.json({
        ok: true,
        modelOutput: modelOutput ?? parsed,
        reply:
          `Aqui estão os próximos horários para ${chosenService.name} em ${date}:\n` +
          firstSlots.join("\n") +
          `\nResponda com o horário desejado para agendar.`,
      });
    }

    if (parsed.intent === "create_booking") {
      return NextResponse.json({
        ok: true,
        modelOutput: modelOutput ?? parsed,
        reply: `Perfeito! Vou preparar o agendamento para ${parsed.date || "o próximo horário disponível"}. (Integração de agendamento em breve.)`,
      });
    }

    return NextResponse.json({
      ok: true,
      modelOutput: modelOutput ?? parsed,
      reply:
        "Oi! Posso te mostrar nossos serviços, horários disponíveis e fazer reservas. Pergunte algo como: \"Vocês têm horário para corte amanhã?\"",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}

