// app/api/professionals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("business_id");
  const serviceId = searchParams.get("service_id");

  // base query
  let query = supabase.from("professionals").select("*").eq("active", true);

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  // if filtering by service, join via service_professionals
  if (serviceId) {
    const { data: links, error: linksError } = await supabase
      .from("service_professionals")
      .select("professional_id")
      .eq("service_id", serviceId);

    if (linksError) {
      return NextResponse.json({ error: linksError.message }, { status: 500 });
    }

    const ids = (links || []).map(l => l.professional_id);
    query = query.in("id", ids);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
