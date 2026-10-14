// Cloudflare Worker — proxy do DEAO Processos.
// Mantém as chaves de API fora do navegador.
//
//   POST /claude  -> Anthropic Messages API (usa a variável CLAUDE-API-KEY)
//   POST /jev     -> TypeSafe Jev (usa a variável TYPESAFE_API_KEY)
//   POST /        -> TypeSafe Jev (compatível com a versão anterior do worker)
//
// Variáveis opcionais:
//   ALLOWED_ORIGINS  lista separada por vírgula (ex.: https://maxmox.github.io).
//                    Se vazia, qualquer origem é aceita.
//   APP_TOKEN        se definida, o site precisa enviar o cabeçalho x-app-token igual.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const JEV_URL = "https://api.typesafe.ai/v1/systemone";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "Content-Type, x-app-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Expose-Headers": "x-upstream",
    Vary: "Origin",
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowed.length && origin && !allowed.includes(origin)) {
      return json({ erro: "origem não autorizada" }, 403, corsHeaders("null"));
    }
    const cors = corsHeaders(allowed.length ? origin : "*");

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ erro: "use POST" }, 405, cors);
    if (env.APP_TOKEN && request.headers.get("x-app-token") !== env.APP_TOKEN) {
      return json({ erro: "token do app inválido" }, 401, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ erro: "JSON inválido" }, 400, cors);
    }

    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
    let upstream;

    if (path === "/claude") {
      const key = env["CLAUDE-API-KEY"] || env.CLAUDE_API_KEY;
      if (!key) return json({ erro: "CLAUDE-API-KEY não configurada no worker" }, 500, cors);
      const headers = {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      };
      // O site manda os betas no corpo; aqui viram cabeçalho.
      if (Array.isArray(body.betas) && body.betas.length) headers["anthropic-beta"] = body.betas.join(",");
      delete body.betas;
      upstream = await fetch(ANTHROPIC_URL, { method: "POST", headers, body: JSON.stringify(body) });
    } else if (path === "/jev" || path === "/") {
      if (!env.TYPESAFE_API_KEY) return json({ erro: "TYPESAFE_API_KEY não configurada no worker" }, 500, cors);
      if (!body.model) body.model = "jev-latest";
      upstream = await fetch(JEV_URL, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${env.TYPESAFE_API_KEY}` },
        body: JSON.stringify(body),
      });
    } else {
      return json({ erro: "rota desconhecida" }, 404, cors);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
        "x-upstream": path === "/claude" ? "anthropic" : "typesafe",
        ...cors,
      },
    });
  },
};
