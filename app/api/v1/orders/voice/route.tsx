// app/api/v1/orders/voice/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    // 👉 Ask the model to fill a fixed JSON schema (request plain JSON text)
    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a form-filling assistant. Extract the user's details and return ONLY a JSON object with the following keys: name, phone, email, address, city. Do not include any explanatory text.",
        },
        {
          role: "user",
          content: `
User spoke the following sentence(s):

"""${transcript}"""

Please output ONLY a single valid JSON object with keys: name, phone, email, address, city.
        `,
        },
      ],
    });

    // Responses API shape: try to get assistant plain text output and parse as JSON
    const assistantText =
      (completion as any).output?.[0]?.content?.find((c: any) => c.type === "output_text")?.text ??
      (completion as any).output?.[0]?.content?.[0]?.text ??
      (completion as any).output_text ??
      null;

    let data: any = null;
    if (assistantText) {
      try {
        data = JSON.parse(assistantText);
      } catch (e) {
        // Fallback: extract the first JSON object found in the text
        const match = assistantText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            data = JSON.parse(match[0]);
          } catch {
            data = null;
          }
        }
      }
    }
    // If assistantText parsing didn't yield data, fall back to the Responses API JSON part
    if (!data) {
      data = (completion as any).output?.[0]?.content?.[0]?.json ?? null;
    }

    if (!data || typeof data !== "object") {
      console.error("Voice order: empty or invalid JSON from model", completion);
      return NextResponse.json(
        { error: "Model returned invalid data" },
        { status: 500 }
      );
    }

    // Clean up phone → digits only
    if (data.phone && typeof data.phone === "string") {
      data.phone = data.phone.replace(/\D/g, "");
    }

    // Ensure all fields exist as strings
    const safeData = {
      name: data.name ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
    };

    return NextResponse.json({ data: safeData });
  } catch (err: any) {
    console.error("voice order error:", err);
    return NextResponse.json(
      { error: "Failed to parse transcript" },
      { status: 500 }
    );
  }
}
