import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { availabilityQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = availabilityQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Anfrage.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(parsed.data.type, new Date(parsed.data.from), new Date(parsed.data.to));
    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verfügbarkeit konnte nicht geladen werden." }, { status: 500 });
  }
}
