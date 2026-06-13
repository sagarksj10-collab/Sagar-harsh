// ══════════════════════════════════════════════════════
// AI Solving Math — Secure API Proxy (Cloudflare Worker)
// ══════════════════════════════════════════════════════
// Yeh worker NVIDIA, OpenRouter, aur Gemini API keys ko
// secret environment variables se leta hai — keys kabhi
// frontend code me dikhayi nahi degi.
//
// Setup: Settings → Variables and Secrets me add karo:
//   NVIDIA_KEY, OPENROUTER_KEY, GEMINI_KEY
// ══════════════════════════════════════════════════════

const ALLOWED_ORIGINS = ['*']; // production me apni site ka domain daal sakte ho

function corsHeaders(){
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST only' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname; // /nvidia, /openrouter, /gemini

    try {
      const body = await request.json();

      let upstream, headers, upstreamBody;

      if (path === '/nvidia') {
        upstream = 'https://integrate.api.nvidia.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.NVIDIA_KEY}`,
        };
        upstreamBody = JSON.stringify(body);

      } else if (path === '/openrouter') {
        upstream = 'https://openrouter.ai/api/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://ai-solving-math.app',
          'X-Title': 'AI Solving Math',
        };
        upstreamBody = JSON.stringify(body);

      } else if (path === '/gemini') {
        const model = body.model || 'gemini-2.0-flash-lite';
        upstream = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_KEY}`;
        headers = { 'Content-Type': 'application/json' };
        upstreamBody = JSON.stringify({ contents: body.contents });

      } else {
        return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }

      const res = await fetch(upstream, {
        method: 'POST',
        headers,
        body: upstreamBody,
      });

      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
  },
};
