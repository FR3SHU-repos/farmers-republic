// app/api/v1/orders/voice/farmerOrders/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, farmerId, deliveryFee } = body ?? {};

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { success: false, message: "No transcript provided" },
        { status: 400 }
      );
    }

    // farmerId is optional for parsing stage
    const safeFarmerId = typeof farmerId === "string" ? farmerId : "";

    // ---------- 1) Prompt ----------
    const schema = {
      customer: {
        name: "string",
        phone: "string",
        email: "string",
        address: "string",
        city: "string",
      },
      items: [
        {
          productName: "string",
          quantity: "number",
          unit: "string",
        },
      ],
      notes: "string",
    };

    const prompt = `
You are an assistant that converts natural speech into a structured grocery order. You also understand telugu
very well and try to convert any telugu words into english product names.

User spoke:

"""${transcript}"""

Return ONLY valid JSON matching exactly this structure:

${JSON.stringify(schema, null, 2)}

Important rules:
- "items" must be an array (possibly empty).
- "quantity" should be a number (e.g. 2, 1.5). If unclear, guess a reasonable number.
- productName should be short and match usual product names (like "Mango", "Brown Rice").
- If any field is missing, set it to "" (or [] for items).
- Do NOT add any extra keys.
- Output ONLY JSON, no explanation, no backticks.
`;

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    // ---------- 2) Extract JSON text safely ----------
    // For plain text responses, output_text is the easiest:
    const jsonText =
      (completion as any).output_text ??
      (completion as any).output?.[0]?.content?.[0]?.text ??
      "";

    if (!jsonText) {
      throw new Error("Model returned empty output");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("JSON parse error. Raw text:", jsonText);
      throw new Error("Failed to parse model JSON");
    }

    const customer = parsed.customer || {};
    const itemsFromAI: any[] = Array.isArray(parsed.items) ? parsed.items : [];
    const notes: string = parsed.notes || "";

    // ---------- 3) Map into "CreatedOrderItem[]" shape ----------
    const orderItems = itemsFromAI
      .map((item: any, idx: number) => {
        const name: string = String(item.productName || "").trim();
        const quantity: number = Number(item.quantity || 0);
        const unit: string = item.unit ? String(item.unit).trim() : "kg";

        if (!name || !quantity || Number.isNaN(quantity)) return null;

        return {
          productId: `voice-${idx}`,
          productName: name,
          unit,
          quantity,
          // For now we set price to 0; farmer can edit later
          pricePerUnit: 0,
          lineTotal: 0,
        };
      })
      .filter(Boolean);

    const subtotal = orderItems.reduce((sum: number, i: any) => sum + i.lineTotal, 0);
    const delivery = typeof deliveryFee === "number" ? deliveryFee : 0;
    const total = subtotal + delivery;

    const cleanOrder = {
      id: "", // not saved yet
      farmerId: safeFarmerId,

      customerName: customer.name || "",
      customerPhone: customer.phone || "",
      customerEmail: customer.email || "",
      customerAddress: customer.address || "",
      customerCity: customer.city || "",

      items: orderItems,
      subtotal,
      deliveryFee: delivery,
      total,

      status: "draft",
      paymentStatus: "unpaid",
      paymentMode: "cod",
      source: "voice",

      notes,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          order: cleanOrder,
          rawParsed: parsed,
        },
        message: "Voice order parsed",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("voice farmerOrders error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to parse order from voice",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
