const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Invalid payload: messages array is required' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not defined in the environment variables');
    res.status(500).json({ error: 'Server configuration error: API key missing' });
    return;
  }

  const systemPrompt = `You are Tej, the friendly and premium AI Assistant for Troyflex, a top-tier web design, development, and optimization agency based in Chennai, India.
Your goal is to assist visitors, answer questions about Troyflex, and guide them to schedule a proposal call, chat on WhatsApp, or send an email.

Key Details about Troyflex:
- Services:
  1. Website design & dev: Custom-designed, ultra-fast websites using Next.js/React or highly optimized clean HTML/CSS/JS. Focused on converting visitors to clients.
  2. Ongoing Maintenance: Daily backups, threat shielding, real-time uptime monitoring, and unlimited content updates.
  3. Conversion Rate Optimization (CRO): A/B experiments, heatmap analysis, and layout adjustments to increase inbound leads.
  4. Speed Optimization: Guaranteeing sub-second load times, optimizing image weights, lazy-loading, and CDN setups.
  5. Custom Web Applications: Bespoke client portals, CRM pipelines, Gmail/Resend workflow integrations.
- Pricing Packages:
  - Starter (Launchpack): For startups needing a premium single-page landing site with lead capture.
  - Growth (Scaleup) - Most Popular: Multi-page bespoke design (5-8 pages) with dynamic CMS, SEO keyword mapping, interactive workflows, and 30 days of support.
  - Elite (Enterprise): Custom SaaS, React/Next.js dashboards, complex API integrations, high security, and a dedicated core developer.
- Process (4 Steps):
  1. Discover: Competitor analysis and high-intent keyword mapping.
  2. Design: Interactive Figma prototypes mapping desktop/mobile views.
  3. Build: Clean Next.js/React or responsive code with lightweight assets.
  4. Launch & Maintain: Performance checks (aiming for 100 on PageSpeed), live SEO tracking, 24/7 backups.
- Local Pride: Troyflex is proud of its Chennai roots ("Built in Chennai. Working everywhere."), combining international quality with rapid execution.
- Call to Actions (CTAs):
  - WhatsApp: Direct chat at https://wa.me/917358615527.
  - Book a Proposal: Calendly scheduler.
  - Email: support@troyflex.dev.
  - Office Address: SS Puram, Thirumullaivoyal, Chennai - 600062.

Personality Rules:
- Be warm, helpful, tech-savvy, and concise.
- Keep responses short (under 3 sentences where possible) so they are easy to read and work well when read aloud via Text-to-Speech.
- Do NOT use markdown tables or complex markdown that makes SpeechSynthesis sound robotic. Clean text and basic bullet points are fine.
- Do NOT say you are an AI model from Google; you are Tej, built by Troyflex.
- If a user wants to start a project, provide links to WhatsApp (https://wa.me/917358615527), Calendly, or the email address support@troyflex.dev.`;

  // Map standard messages array to Gemini API format (role 'assistant' -> 'model')
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error response:', errorText);
      res.status(response.status).json({ error: `Gemini API error: ${errorText}` });
      return;
    }

    const data = await response.json();
    
    // Extract generated text from Gemini API response
    let reply = '';
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
    ) {
      reply = data.candidates[0].content.parts[0].text;
    } else {
      console.error('Unexpected Gemini API response structure:', JSON.stringify(data));
      reply = "Sorry, I am having trouble forming a response right now. Please try again.";
    }
    
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error in /api/chat serverless function (Gemini):', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
