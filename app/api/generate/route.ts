import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const { prompt } = (await req.json()) as { prompt: string };
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const output = await response.text();

  return NextResponse.json({ output });
}
