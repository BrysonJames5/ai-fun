export const runtime = "nodejs"
import { type NextRequest, NextResponse } from "next/server"
import { OpenAI } from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { location, budget, attendees } = await request.json()

    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 })
    }

    const budgetPrompt = budget
      ? `The couple has a maximum budget of $${budget.toLocaleString()}. Please ensure all recommendations fit within this budget and provide specific booking prices.`
      : "Please provide estimated booking costs for each venue."

    const attendeesPrompt = attendees
      ? `The wedding will have approximately ${attendees.toLocaleString()} guests. Please ensure all venue recommendations can accommodate this number of people.`
      : "Please consider typical wedding guest counts when recommending venues."

    // Generate wedding plan using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a wedding venue booking specialist. Provide ONLY venue names, addresses, estimated booking prices, and contact information. DO NOT include descriptions or summaries. Focus on bookable venues with real contact details. ${budgetPrompt} ${attendeesPrompt}`,
        },
        {
          role: "system",
          content:
            "You will provide wedding venue booking information in a structured JSON format. Include only essential booking details: venue name, address, price, website URL (if available), or phone number.",
        },
        {
          role: "user",
          content: `Find bookable wedding venues near ${location}. ${budgetPrompt} ${attendeesPrompt} Provide recommendations in this exact JSON format:

{
  "receptionDinner": {
    "name": "Venue Name",
    "address": "Full address",
    "price": "$X,XXX - $X,XXX",
    "website": "https://website.com" OR "phone": "phone number"
  },
  "welcomeParty": {
    "name": "Venue Name", 
    "address": "Full address",
    "price": "$X,XXX - $X,XXX",
    "website": "https://website.com" OR "phone": "phone number"
  },
  "catering": {
    "company": "Catering Company Name",
    "address": "Full address", 
    "price": "$XX per person",
    "website": "https://website.com" OR "phone": "phone number"
  },
  "weddingLocations": [
    {
      "name": "Ceremony Venue 1",
      "address": "Full address",
      "price": "$X,XXX - $X,XXX", 
      "website": "https://website.com" OR "phone": "phone number"
    },
    {
      "name": "Ceremony Venue 2",
      "address": "Full address",
      "price": "$X,XXX - $X,XXX",
      "website": "https://website.com" OR "phone": "phone number"
    },
    {
      "name": "Ceremony Venue 3", 
      "address": "Full address",
      "price": "$X,XXX - $X,XXX",
      "website": "https://website.com" OR "phone": "phone number"
    }
  ],
  "receptionLocation": {
    "name": "Reception Venue Name",
    "address": "Full address", 
    "price": "$X,XXX - $X,XXX",
    "website": "https://website.com" OR "phone": "phone number"
  },
  "afterPartyLocation": {
    "name": "After Party Venue Name",
    "address": "Full address",
    "price": "$XXX - $X,XXX", 
    "website": "https://website.com" OR "phone": "phone number"
  },
  "estimatedBudget": {
    "total": "Total estimated cost range",
    "breakdown": {
      "ceremony": "Estimated ceremony costs",
      "reception": "Estimated reception costs", 
      "catering": "Estimated catering costs",
      "welcomeParty": "Estimated welcome party costs",
      "afterParty": "Estimated after party costs"
    }
  }
}

IMPORTANT: 
- Include ONLY real, bookable venues near ${location}
- Provide actual venue names, not generic descriptions
- Include website URLs when available, phone numbers when websites aren't available
- Focus on venues that can actually be booked for weddings
- Provide realistic pricing estimates
- ${budgetPrompt}
- ${attendeesPrompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "No content received from OpenAI" }, { status: 500 })
    }

    // Parse the JSON response from ChatGPT
    let weddingPlan
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        weddingPlan = JSON.parse(jsonMatch[0])
      } else {
        weddingPlan = JSON.parse(content)
      }
    } catch (parseError) {
      console.error("Failed to parse ChatGPT response:", content)
      return NextResponse.json({ error: "Failed to parse wedding plan from AI response" }, { status: 500 })
    }

    console.log(
      "Generated wedding plan for:",
      location,
      budget ? `with budget $${budget.toLocaleString()}` : "",
      attendees ? `for ${attendees.toLocaleString()} guests` : "",
    )
    return NextResponse.json(weddingPlan, { status: 200 })
  } catch (error) {
    console.error("Wedding planning error:", error)
    return NextResponse.json({ error: "Failed to generate wedding plan" }, { status: 500 })
  }
}
