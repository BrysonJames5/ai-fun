export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { OpenAI } from "openai"
import * as pdfParse from "pdf-parse/lib/pdf-parse"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    // Use the built-in FormData API instead of formidable
    const formData = await req.formData()
    const pdfFile = formData.get("pdf") as File

    if (!pdfFile) {
      return NextResponse.json({ error: "No PDF file uploaded" }, { status: 400 })
    }

    // Check if it's actually a PDF
    if (pdfFile.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse PDF
    const parsed = await pdfParse(buffer)
    const text = parsed.text

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "PDF contains no extractable text" }, { status: 400 })
    }

    // Generate tags using OpenAI
    const prompt = `Provide only a comma-separated list of relevant tags and key topics from this document. Do not include any explanations or extra text.\n\n${text.slice(0, 2000)}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert document tagger." },
        {
          role: "system",
          content:
            "You will be given a document and you will provide a list of tags to assist people who are searching for this document",
        },
        { role: "user", content: prompt },
      ],
    })

    const tags = completion.choices[0].message.content?.trim()

    if (!tags) {
      return NextResponse.json({ error: "No tags generated from the document" }, { status: 400 })
    }

    console.log(text)

    return NextResponse.json({ tags }, { status: 200 })
  } catch (error) {
    console.error("PDF/OpenAI error:", error)
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 })
  }
}
