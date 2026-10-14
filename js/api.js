// Chamadas às IAs (via worker) e contabilidade de tokens/custo.
(function () {
  const C = window.CONFIG;

  function preco(modelo) {
    if (C.PRECOS[modelo]) return C.PRECOS[modelo];
    // Respostas podem trazer um id com sufixo; casa pelo prefixo mais longo.
    const k = Object.keys(C.PRECOS)
      .filter((m) => modelo && modelo.startsWith(m))
      .sort((a, b) => b.length - a.length)[0];
    return C.PRECOS[k] || C.PRECOS["claude-opus-5-5"];
  }

  function custoUSD(modelo, u) {
    const p = preco(modelo);
    return (
      ((u.input || 0) * p.in + (u.output || 0) * p.out + (u.cacheWrite || 0) * p.cw + (u.cacheRead || 0) * p.cr) / 1e6
    );
  }

  // ---------- Registro de uso ----------
  const Uso = {
    chamadas: [],
    ouvintes: [],
    registrar(c) {
      c.custo = custoUSD(c.modelo, c);
      c.hora = new Date();
      this.chamadas.push(c);
      this.ouvintes.forEach((f) => f(c));
      return c;
    },
    limpar() {
      this.chamadas = [];
      this.ouvintes.forEach((f) => f(null));
    },
    totais(lista) {
      const t = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0, custo: 0, n: 0 };
      (lista || this.chamadas).forEach((c) => {
        t.input += c.input || 0;
        t.output += c.output || 0;
        t.cacheWrite += c.cacheWrite || 0;
        t.cacheRead += c.cacheRead || 0;
        t.custo += c.custo || 0;
        t.n++;
      });
      return t;
    },
  };

  // ---------- Histórico persistente (só no navegador) ----------
  const CHAVE_HIST = "deao_historico_v1";
  const Historico = {
    ler() {
      try {
        return JSON.parse(localStorage.getItem(CHAVE_HIST)) || [];
      } catch {
        return [];
      }
    },
    salvar(reg) {
      try {
        const h = this.ler().filter((x) => x.id !== reg.id);
        h.unshift(reg);
        localStorage.setItem(CHAVE_HIST, JSON.stringify(h.slice(0, 200)));
      } catch {}
    },
    limpar() {
      try {
        localStorage.removeItem(CHAVE_HIST);
      } catch {}
    },
  };

  class ErroRota extends Error {}

  function cabecalhos() {
    const h = { "content-type": "application/json" };
    const tok = Prefs.get("appToken");
    if (tok) h["x-app-token"] = tok;
    return h;
  }

  async function postar(rota, corpo) {
    const url = C.WORKER_URL.replace(/\/+$/, "") + rota;
    let r;
    try {
      r = await fetch(url, { method: "POST", headers: cabecalhos(), body: JSON.stringify(corpo) });
    } catch (e) {
      throw new Error("Falha de rede ao chamar o worker: " + e.message);
    }
    const texto = await r.text();
    let dados;
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = { bruto: texto };
    }
    return { status: r.status, dados, upstream: r.headers.get("x-upstream") };
  }

  function textoErro(d) {
    if (!d) return "";
    if (d.error && d.error.message) return d.error.message;
    if (d.erro) return d.erro;
    if (d.detail) return typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail);
    return JSON.stringify(d).slice(0, 300);
  }

  // Extrai o primeiro objeto JSON de um texto (tolerante a ```json ... ```).
  function extrairJSON(txt) {
    const limpo = txt.replace(/```(?:json)?/gi, "").trim();
    try {
      return JSON.parse(limpo);
    } catch {}
    const i = limpo.indexOf("{");
    const f = limpo.lastIndexOf("}");
    if (i >= 0 && f > i) return JSON.parse(limpo.slice(i, f + 1));
    throw new Error("A IA não retornou JSON válido.");
  }

  /**
   * Chamada pontual ao Claude que devolve JSON.
   * O prompt de sistema é marcado para cache: todas as chamadas do processo
   * compartilham o mesmo prefixo e pagam ~5-10% do preço nas leituras.
   */
  async function claudeJSON({ etapa, sistema, usuario, schema, maxTokens = 16000 }) {
    const modelo = Prefs.get("modelo") || C.CLAUDE_MODELS[0].id;
    const esforco = Prefs.get("esforco") || "low";

    const base = {
      model: modelo,
      max_tokens: maxTokens,
      system: [{ type: "text", text: sistema, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: usuario }],
      output_config: { effort: esforco },
    };
    if (schema) base.output_config.format = { type: "json_schema", schema };
    // Fallback no servidor em caso de recusa (Opus 5.5 / Sonnet 5.5).
    if (/^claude-(opus|sonnet)-5-5/.test(modelo)) {
      base.betas = ["server-side-fallback-2026-07-01"];
      base.fallbacks = "default";
    }

    // Se o servidor rejeitar algum recurso opcional, tenta de novo sem ele.
    const tentativas = [
      base,
      (() => {
        const b = structuredClone(base);
        delete b.betas;
        delete b.fallbacks;
        return b;
      })(),
      (() => {
        const b = structuredClone(base);
        delete b.betas;
        delete b.fallbacks;
        delete b.output_config.format;
        return b;
      })(),
    ];

    let ultimoErro;
    for (const corpo of tentativas) {
      const { status, dados, upstream } = await postar("/claude", corpo);

      if (status === 200 && dados && dados.type === "message") {
        const u = dados.usage || {};
        Uso.registrar({
          etapa,
          provedor: "Claude",
          modelo: dados.model || modelo,
          input: u.input_tokens || 0,
          output: u.output_tokens || 0,
          cacheWrite: u.cache_creation_input_tokens || 0,
          cacheRead: u.cache_read_input_tokens || 0,
        });
        if (dados.stop_reason === "refusal") throw new Error("A IA recusou esta etapa (" + etapa + ").");
        if (dados.stop_reason === "max_tokens") throw new Error("Resposta truncada na etapa " + etapa + ".");
        const txt = (dados.content || [])
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("");
        return extrairJSON(txt);
      }

      // Worker antigo: encaminha tudo para a Jev, que responde com "detail".
      if (upstream !== "anthropic" && (status === 404 || status === 422 || (dados && dados.detail))) {
        throw new ErroRota(
          "O worker ainda não tem a rota /claude. Atualize o worker (ver README) ou use o modo demonstração."
        );
      }
      ultimoErro = new Error(`Claude (${status}): ${textoErro(dados)}`);
      if (status !== 400) break; // só vale a pena simplificar a requisição em erro 400
    }
    throw ultimoErro;
  }

  /** Chamada à TypeSafe Jev (decisões: noul / choice / score). */
  async function jev({ etapa, estado, perguntas }) {
    const { status, dados } = await postar("/jev", { state: estado, questions: perguntas });
    if (status !== 200 || !dados.answers) throw new Error(`Jev (${status}): ${textoErro(dados)}`);
    const u = dados.usage || {};
    Uso.registrar({
      etapa,
      provedor: "Jev",
      modelo: "jev",
      modeloExibido: dados.model || "jev-latest",
      input: u.input_tokens || 0,
      output: u.output_tokens || 0,
    });
    return dados.answers;
  }

  // ---------- Preferências locais ----------
  const Prefs = {
    get(k) {
      try {
        return JSON.parse(localStorage.getItem("deao_pref_" + k));
      } catch {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("deao_pref_" + k, JSON.stringify(v));
      } catch {}
    },
  };

  window.API = { claudeJSON, jev, Uso, Historico, Prefs, custoUSD, ErroRota };
})();
