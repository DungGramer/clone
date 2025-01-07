import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { prompt } = (await req.json()) as { prompt: string };

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { maxOutputTokens: 200 },
  });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    return NextResponse.json({ output });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.log('API: ', process.env.GEMINI_API_KEY!);
    console.error("Error during API call:", err?.message || err);
    return NextResponse.json(
      { text: "Unable to process the prompt. Please try again.", error: err?.message },
      { status: 500 }
    );
  }
}
