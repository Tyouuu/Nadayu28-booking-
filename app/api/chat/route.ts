import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are the AI Concierge for Nadayu28, a residential complex in Malaysia.
Answer questions based on these community rules:
1. Visitor Parking: Must book 1 hour in advance. Max 24 hours. Unlimited bookings per unit. License plate required.
2. Amenities (Gym, BBQ, etc.): Unlimited usage. Bookings available 6 AM - 10 PM.
3. Fines: RM 50 for overstaying parking. RM 20 for late cancellation (less than 24h).
4. Damages: Any damage to amenities will be charged directly to the resident's account. No deposit required.
Keep answers concise, polite, and helpful.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API Key not configured.' }, { status: 500 });
  }

  const { userMsg, history } = (await request.json()) as { userMsg: string; history: ChatMessage[] };
  if (!userMsg || typeof userMsg !== 'string') {
    return NextResponse.json({ error: 'userMsg is required.' }, { status: 400 });
  }

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(history ?? []),
        { role: 'user', content: userMsg },
      ],
      max_tokens: 300,
    }),
  });

  if (!openaiResponse.ok) {
    return NextResponse.json({ error: `API error: ${openaiResponse.status}` }, { status: 502 });
  }

  const data = await openaiResponse.json();
  const text = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";
  return NextResponse.json({ text });
}
