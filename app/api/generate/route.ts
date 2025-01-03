import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = (await req.json()) as { prompt: string };

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: { maxOutputTokens: 200 },
  });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    return NextResponse.json({ output });
  } catch (err) {
    console.log("error", err);
    return NextResponse.json({
      text: "Unable to process the prompt. Please try again.",
    });
  }
}
