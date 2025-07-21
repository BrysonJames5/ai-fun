export const runtime = "nodejs"
import { type NextRequest, NextResponse } from "next/server"
import { OpenAI } from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { location, budget, attendees, sectionType, currentContent, existingPlan } = await request.json()

    if (!location || !sectionType || !currentContent) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const budgetPrompt = budget
      ? `The couple has a maximum budget of $${budget.toLocaleString()}. Please ensure the new recommendation fits within this budget.`
      : "Please provide cost estimates for the new recommendation."

    const attendeesPrompt = attendees
      ? `The wedding will have approximately ${attendees.toLocaleString()} guests. Please ensure the venue can accommodate this number of people.`
      : "Please consider typical wedding guest counts when recommending venues."

    const sectionNames = {
      receptionDinner: "Reception Dinner Venue",
      welcomeParty: "Welcome Party Venue",
      catering: "Catering Services",
      weddingLocations: "Wedding Ceremony Venues",
      receptionLocation: "Reception Venue",
      afterPartyLocation: "After Party Venue",
    }

    const sectionName = sectionNames[sectionType as keyof typeof sectionNames] || sectionType

    // Generate new recommendation using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a wedding venue booking specialist. Provide ONLY venue names, addresses, estimated booking prices, and contact information. DO NOT include descriptions or summaries. The user wants a different ${sectionName} option.`,
        },
        {
          role: "user",
          content: `I'm planning a wedding near ${location}. ${budgetPrompt} ${attendeesPrompt}

Current ${sectionName}: ${JSON.stringify(currentContent)}

Please provide a DIFFERENT ${sectionName} option. Make sure it's:
1. A completely different venue from the current one
2. Bookable and real venue near ${location}
3. ${budget ? `Within the budget of $${budget.toLocaleString()}` : "Cost-effective"}
4. ${attendees ? `Can accommodate ${attendees.toLocaleString()} guests` : "Suitable for wedding guest counts"}
5. Include actual venue name, address, pricing, and website/phone

${
  sectionType === "catering"
    ? 'Return in JSON format: {"company": "name", "address": "address", "price": "price", "website": "url" OR "phone": "number"}'
    : sectionType === "weddingLocations"
      ? 'Return as an array of 3 different venue options: [{"name": "venue name", "address": "address", "price": "price", "website": "url" OR "phone": "number"}, ...]'
      : 'Return in JSON format: {"name": "venue name", "address": "address", "price": "price", "website": "url" OR "phone": "number"}'
}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 800,
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "No content received from OpenAI" }, { status: 500 })
    }

    // Parse the response based on section type
    let newContent
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
      if (jsonMatch) {
        newContent = JSON.parse(jsonMatch[0])
      } else {
        newContent = JSON.parse(content)
      }
    } catch (parseError) {
      console.error("Failed to parse ChatGPT response:", content)
      return NextResponse.json({ error: "Failed to parse new recommendation" }, { status: 500 })
    }

    console.log(`Refreshed ${sectionType} for:`, location, attendees ? `for ${attendees.toLocaleString()} guests` : "")
    return NextResponse.json({ newContent }, { status: 200 })
  } catch (error) {
    console.error("Section refresh error:", error)
    return NextResponse.json({ error: "Failed to refresh section" }, { status: 500 })
  }
}
