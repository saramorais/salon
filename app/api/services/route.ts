import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
//   try {
//     // quick check env
//     if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
//       return NextResponse.json(
//         { error: "Supabase env vars missing" },
//         { status: 500 }
//       );
//     }

    const { data, error } = await supabase.from("services").select("*");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
//   } catch (err: any) {
//     console.error("Route error:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
}

export async function POST(req: Request) {
const body = await req.json();

const {name, price, duration_minutes, business_id} = body;

if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("services")
    .insert({
      name,
      price,
      duration_minutes,
      business_id
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
