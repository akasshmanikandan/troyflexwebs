const fetch = require('node-fetch');

const FEATURE_PRICES = {
  booking: 10000,
  payments: 15000,
  cms: 15000,
  seo: 10000,
  dashboard: 40000,
  multilingual: 12000,
  maintenance: 8000
};

const FEATURE_LABELS = {
  forms: 'lead forms',
  booking: 'booking flow',
  payments: 'payment setup',
  cms: 'CMS/blog',
  seo: 'SEO setup',
  dashboard: 'dashboard',
  multilingual: 'multilingual pages',
  maintenance: 'maintenance'
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const answers = req.body && req.body.answers;
  if (!answers || typeof answers !== 'object') {
    res.status(400).json({ error: 'Invalid payload: answers object is required' });
    return;
  }

  const quote = calculateQuote(answers);
  const polished = await polishQuote(answers, quote);

  res.status(200).json({
    quote: {
      ...quote,
      summary: polished || quote.summary
    }
  });
};

function calculateQuote(answers) {
  const pageCount = Number(answers.pages || 1);
  const features = Array.isArray(answers.features) ? answers.features : [];
  let base = 15000;
  let packageName = 'Launchpack';

  if (answers.projectType === 'app' || features.includes('dashboard')) {
    base = 120000;
    packageName = 'Elite';
  } else if (pageCount >= 6 || features.includes('cms') || features.includes('payments')) {
    base = 65000;
    packageName = 'Growth';
  } else if (pageCount > 1 || answers.projectType === 'redesign') {
    base = 35000;
    packageName = 'Growth Lite';
  }

  const addOnTotal = features.reduce((sum, feature) => sum + (FEATURE_PRICES[feature] || 0), 0);
  const urgencyMultiplier = answers.timeline === 'urgent' ? 1.18 : 1;
  const low = roundToThousand((base + addOnTotal) * urgencyMultiplier);
  const high = roundToThousand(low * 1.28);
  const featureText = features.length
    ? features.map(feature => FEATURE_LABELS[feature] || feature).join(', ')
    : 'core website essentials';

  return {
    packageName,
    range: `₹${low.toLocaleString('en-IN')} - ₹${high.toLocaleString('en-IN')}`,
    timeline: getTimeline(answers.timeline),
    confidence: 'Initial estimate',
    summary: `For a ${answers.businessType || 'business'} project, this looks like a ${packageName} build with ${featureText}. Final pricing can tighten after a 15-minute scope call.`
  };
}

function roundToThousand(value) {
  return Math.round(value / 1000) * 1000;
}

function getTimeline(timeline) {
  if (timeline === 'urgent') return '7-10 days';
  if (timeline === 'relaxed') return '3-5 weeks';
  return '2-3 weeks';
}

async function polishQuote(answers, quote) {
  const provider = process.env.GROQ_API_KEY ? 'groq' : process.env.OPENROUTER_API_KEY ? 'openrouter' : null;
  if (!provider) return null;

  const language = answers.language || 'en';
  const prompt = `Rewrite this website quote in a short, friendly Troyflex voice.
Language code: ${language}
Keep the INR range exactly as: ${quote.range}
Keep it under 55 words.
Do not invent discounts or exact guarantees.

Business: ${answers.businessType}
Package: ${quote.packageName}
Timeline: ${quote.timeline}
Features: ${(answers.features || []).join(', ') || 'core website essentials'}`;

  try {
    if (provider === 'groq') {
      return await callGroq(prompt);
    }
    return await callOpenRouter(prompt);
  } catch (error) {
    console.error('Quote polish failed:', error);
    return null;
  }
}

async function callGroq(prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are Tej, Troyflex quote assistant. Be concise, warm, and practical.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 120,
      temperature: 0.5
    })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
}

async function callOpenRouter(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://troyflex.dev',
      'X-Title': 'Troyflex Quote Assistant'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [
        { role: 'system', content: 'You are Tej, Troyflex quote assistant. Be concise, warm, and practical.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 120,
      temperature: 0.5
    })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
}
