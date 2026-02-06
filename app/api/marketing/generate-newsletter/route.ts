import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, context } = body;

    if (!tenantId || !context) {
      return NextResponse.json(
        { error: 'Missing tenantId or context' },
        { status: 400 }
      );
    }

    // Gate: Marketing Engine requires Pro tier or higher
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('tier')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check tier access (Pro or Elite)
    if (tenant.tier !== 'pro' && tenant.tier !== 'elite') {
      return NextResponse.json(
        { error: 'Marketing Engine requires Pro tier or higher. Upgrade to unlock AI newsletter generation.' },
        { status: 403 }
      );
    }

    // Build the prompt
    const prompt = `You are a professional email marketing writer creating a newsletter for ${context.businessName}.

**Recent Products:**
${context.products.map((p: any) => `- ${p.name}: ${p.description}`).join('\n') || 'None'}

**Recent Services:**
${context.services.map((s: any) => `- ${s.name}: ${s.description}`).join('\n') || 'None'}

**Subscriber Count:** ${context.subscriberCount}

Write a professional, engaging newsletter email that:
1. Has a friendly, personalized greeting
2. Highlights new products/services if available
3. Creates excitement and urgency
4. Includes a clear call-to-action
5. Feels authentic to the brand ${context.businessName}
6. Is concise (under 200 words)

Format it as plain text with line breaks. Do not include a subject line, just the email body.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    const newsletter = response.text;

    return NextResponse.json({ newsletter });
  } catch (error: any) {
    console.error('Newsletter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate newsletter', details: error.message },
      { status: 500 }
    );
  }
}

