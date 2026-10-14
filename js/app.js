// Interface do DEAO Processos.
(function () {
  const C = window.CONFIG;
  const { Uso, Historico, Prefs, ErroRota } = window.API;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const usd = (v) => "US$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  const usd2 = (v) => "US$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const int = (v) => Number(v || 0).toLocaleString("pt-BR");
  const dolar = () => Number(Prefs.get("dolar")) || C.COTACAO_DOLAR;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Cria elemento com segurança (sem innerHTML para conteúdo vindo da IA).
  function el(tag, attrs = {}, ...filhos) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (k === "value") e.value = v;
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? "" : v);
    }
    filhos.flat().forEach((f) => f != null && e.append(f instanceof Node ? f : document.createTextNode(String(f))));
    return e;
  }

  function msg(alvo, texto, tipo = "erro") {
    const m = typeof alvo === "string" ? $(alvo) : alvo;
    m.className = "msg" + (texto ? " " + tipo : "") + (m.classList.contains("inline") ? " inline" : "");
    m.textContent = texto || "";
  }

  // ---------------- Estado ----------------
  const estado = {
    id: null,
    textoPedido: "",
    dados: null,
    classe: null,
    textos: null,
    demo: false,
    arquivos: [],
  };

  // ---------------- Abas ----------------
  $$(".aba").forEach((b) =>
    b.addEventListener("click", () => {
      $$(".aba").forEach((x) => x.classList.toggle("ativa", x === b));
      $$(".painel").forEach((p) => p.classList.toggle("ativo", p.id === "aba-" + b.dataset.aba));
      if (b.dataset.aba === "custos") renderHistorico();
    })
  );

  // ---------------- Custos do processo atual ----------------
  function renderUso() {
    const tb = $("#tb-uso");
    tb.textContent = "";
    const lista = Uso.chamadas;
    if (!lista.length) {
      tb.append(el("tr", {}, el("td", { colspan: 5, class: "leve" }, "Nenhuma chamada ainda.")));
    }
    lista.forEach((c) => {
      const cache = (c.cacheRead || 0) + (c.cacheWrite || 0);
      tb.append(
        el(
          "tr",
          { class: c.simulado ? "simulado" : "", title: `${c.provedor} · ${c.modeloExibido || c.modelo}${c.simulado ? " · estimativa" : ""}` },
          el("td", {}, c.etapa),
          el("td", {}, int(c.input)),
          el("td", { title: `lidos ${int(c.cacheRead)} · gravados ${int(c.cacheWrite)}` }, cache ? int(cache) : "–"),
          el("td", {}, int(c.output)),
          el("td", {}, usd(c.custo))
        )
      );
    });
    const t = Uso.totais();
    if (lista.length) {
      tb.append(
        el("tr", { class: "total" },
          el("td", {}, "Total"),
          el("td", {}, int(t.input)),
          el("td", {}, int(t.cacheRead + t.cacheWrite)),
          el("td", {}, int(t.output)),
          el("td", {}, usd(t.custo)))
      );
    }
    const simulado = lista.some((c) => c.simulado);
    $("#k-usd").textContent = usd(t.custo) + (simulado ? "*" : "");
    $("#k-brl").textContent = brl(t.custo * dolar()) + (simulado ? " · *inclui estimativa" : "");
    $("#k-n").textContent = t.n;
    $("#k-tok").textContent = int(t.input + t.output + t.cacheRead + t.cacheWrite) + " tokens";
    $("#custo-topo").textContent = usd(t.custo);
  }
  Uso.ouvintes.push(() => {
    renderUso();
    salvarHistorico();
  });

  function salvarHistorico() {
    if (!estado.id || estado.demo || !Uso.chamadas.length) return;
    const t = Uso.totais();
    Historico.salvar({
      id: estado.id,
      data: new Date().toISOString(),
      objeto: (estado.dados && estado.dados.objeto_curto) || estado.textoPedido.slice(0, 60),
      modelo: Prefs.get("modelo") || C.CLAUDE_MODELS[0].id,
      n: t.n,
      tokens: t.input + t.output + t.cacheRead + t.cacheWrite,
      usd: t.custo,
    });
  }

  function renderHistorico() {
    const h = Historico.ler();
    const tb = $("#tb-hist");
    tb.textContent = "";
    if (!h.length) tb.append(el("tr", {}, el("td", { colspan: 7, class: "leve" }, "Nenhum processo gerado ainda.")));
    h.forEach((r) =>
      tb.append(
        el("tr", {},
          el("td", {}, new Date(r.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })),
          el("td", {}, r.objeto),
          el("td", {}, r.modelo),
          el("td", {}, r.n),
          el("td", {}, int(r.tokens)),
          el("td", {}, usd(r.usd)),
          el("td", {}, brl(r.usd * dolar())))
      )
    );
    const total = h.reduce((s, r) => s + r.usd, 0);
    const media = h.length ? total / h.length : 0;
    $("#h-n").textContent = h.length;
    $("#h-usd").textContent = usd2(total);
    $("#h-brl").textContent = brl(total * dolar());
    $("#h-media").textContent = usd2(media);
    $("#h-media-brl").textContent = brl(media * dolar());
    $("#h-tok").textContent = int(h.reduce((s, r) => s + r.tokens, 0));

    const tp = $("#tb-precos");
    tp.textContent = "";
    Object.entries(C.PRECOS).forEach(([m, p]) =>
      tp.append(el("tr", {}, el("td", {}, m), el("td", {}, "$" + p.in), el("td", {}, "$" + p.out), el("td", {}, "$" + p.cw), el("td", {}, "$" + p.cr)))
    );
  }
  $("#btn-limpar-hist").addEventListener("click", () => {
    if (confirm("Apagar o histórico de custos deste navegador?")) {
      Historico.limpar();
      renderHistorico();
    }
  });

  // ---------------- Configurações ----------------
  const selModelo = $("#cfg-modelo");
  C.CLAUDE_MODELS.forEach((m) => selModelo.append(el("option", { value: m.id }, m.nome)));
  selModelo.value = Prefs.get("modelo") || C.CLAUDE_MODELS[0].id;
  selModelo.addEventListener("change", () => Prefs.set("modelo", selModelo.value));
  $("#cfg-esforco").value = Prefs.get("esforco") || "low";
  $("#cfg-esforco").addEventListener("change", (e) => Prefs.set("esforco", e.target.value));
  $("#cfg-dolar").value = dolar();
  $("#cfg-dolar").addEventListener("change", (e) => {
    Prefs.set("dolar", Number(e.target.value));
    renderUso();
  });
  $("#cfg-token").value = Prefs.get("appToken") || "";
  $("#cfg-token").addEventListener("change", (e) => Prefs.set("appToken", e.target.value));
  $("#cfg-worker").textContent = C.WORKER_URL;
  $("#btn-testar").addEventListener("click", () => verificarConexao(true));

  // Sondagens gratuitas: corpos inválidos são rejeitados antes de qualquer cobrança.
  async function sondar(rota) {
    try {
      const h = { "content-type": "application/json" };
      if (Prefs.get("appToken")) h["x-app-token"] = Prefs.get("appToken");
      const r = await fetch(C.WORKER_URL.replace(/\/+$/, "") + rota, { method: "POST", headers: h, body: "{}" });
      const d = await r.json().catch(() => ({}));
      return { status: r.status, d, up: r.headers.get("x-upstream") };
    } catch (e) {
      return { status: 0, d: { erro: e.message } };
    }
  }
  async function verificarConexao(mostrar) {
    const [j, c] = await Promise.all([sondar("/jev"), sondar("/claude")]);
    const jevOk = j.status === 422 || j.status === 200;
    let claude = "erro";
    if (c.up === "anthropic" || (c.d && c.d.type === "error" && c.d.error)) {
      claude = c.status === 401 || (c.d.error && c.d.error.type === "authentication_error") ? "chave" : "ok";
    } else if (c.d && c.d.detail) claude = "rota";
    else if (c.status === 500 && c.d && c.d.erro) claude = "config";

    const sj = $("#st-jev");
    sj.textContent = "Jev: " + (jevOk ? "conectada" : "indisponível");
    sj.className = "pill " + (jevOk ? "ok" : "erro");
    const sc = $("#st-claude");
    const rot = { ok: "conectado", rota: "sem rota no worker", chave: "chave inválida", config: "chave não configurada", erro: "indisponível" };
    sc.textContent = "Claude: " + rot[claude];
    sc.className = "pill " + (claude === "ok" ? "ok" : "erro");
    estado.claudeOk = claude === "ok";
    if (!estado.claudeOk && !Prefs.get("demoEscolhido")) $("#chk-demo").checked = true;
    if (mostrar) {
      msg("#msg-teste", `Jev: ${sj.textContent.slice(5)} · Claude: ${rot[claude]}`, jevOk && claude === "ok" ? "ok" : "aviso");
    }
  }

  // ---------------- Perfil (requisitante e chefe) ----------------
  const perfil = Object.assign({ chefe: {} }, Prefs.get("perfil") || {});
  perfil.chefe = perfil.chefe || {};
  function preencherPerfil() {
    $$("[data-perfil]").forEach((i) => (i.value = perfil[i.dataset.perfil] || ""));
    $$("[data-chefe]").forEach((i) => (i.value = perfil.chefe[i.dataset.chefe] || ""));
    $("#perfil-resumo").textContent = [perfil.posto, perfil.nome].filter(Boolean).join(" ") ? `— ${[perfil.posto, perfil.nome].filter(Boolean).join(" ")}` : "";
  }
  $$("[data-perfil]").forEach((i) =>
    i.addEventListener("input", () => {
      perfil[i.dataset.perfil] = i.value.trim();
      Prefs.set("perfil", perfil);
    })
  );
  $$("[data-chefe]").forEach((i) =>
    i.addEventListener("input", () => {
      perfil.chefe[i.dataset.chefe] = i.value.trim();
      Prefs.set("perfil", perfil);
    })
  );
  preencherPerfil();

  // ---------------- Passo 1: analisar ----------------
  $("#btn-exemplo").addEventListener("click", () => ($("#pedido").value = window.Demo.PEDIDO_EXEMPLO));
  $("#chk-demo").addEventListener("change", () => Prefs.set("demoEscolhido", true));

  async function ocupado(botao, fn) {
    const txt = botao.textContent;
    botao.disabled = true;
    botao.textContent = "Processando…";
    try {
      return await fn();
    } finally {
      botao.disabled = false;
      botao.textContent = txt;
    }
  }

  function registrarSimulado(etapas) {
    const modelo = Prefs.get("modelo") || C.CLAUDE_MODELS[0].id;
    window.Demo.usoEstimado(window.Pipeline.SISTEMA.length)
      .filter((u) => etapas.some((e) => u.etapa.startsWith(e)))
      .forEach((u) => Uso.registrar({ ...u, provedor: "Claude", modelo, simulado: true }));
  }

  $("#btn-analisar").addEventListener("click", (ev) =>
    ocupado(ev.target, async () => {
      const texto = $("#pedido").value.trim();
      if (texto.length < 20) return msg("#msg1", "Descreva o pedido com um pouco mais de detalhe.");
      msg("#msg1", "");
      Uso.limpar();
      estado.id = "p" + Date.now();
      estado.textoPedido = texto;
      estado.demo = $("#chk-demo").checked;
      estado.textos = null;
      $("#passo3").classList.add("oculto");

      try {
        if (estado.demo) {
          estado.dados = clone(window.Demo.extracao);
          registrarSimulado(["1."]);
          if (texto !== window.Demo.PEDIDO_EXEMPLO)
            msg("#msg1", "Modo demonstração: os dados abaixo são do exemplo das tintas, não do seu texto. Desmarque a opção para usar a IA de verdade.", "aviso");
        } else {
          estado.dados = await window.Pipeline.extrair(texto);
        }
      } catch (e) {
        if (e instanceof ErroRota) {
          $("#chk-demo").checked = true;
          return msg("#msg1", e.message);
        }
        return msg("#msg1", "Erro na extração: " + e.message);
      }

      try {
        estado.classe = await window.Pipeline.classificar(texto, estado.dados);
      } catch (e) {
        estado.classe = { natureza: "consumo", modalidade: "pregao_srp", prioridade: "Média", indicaMarca: false, valorTotal: 0 };
        msg("#msg1", "A classificação pela Jev falhou (" + e.message + "). Revise a classificação manualmente.", "aviso");
      }

      // Completa o perfil com o que veio no texto, sem sobrescrever o que já foi salvo.
      const r = estado.dados.requisitante || {};
      if (!perfil.nome && r.nome) perfil.nome = r.nome;
      if (!perfil.posto && r.posto) perfil.posto = r.posto;
      if (!perfil.setor && r.setor) perfil.setor = r.setor;
      if (!perfil.sigla && r.sigla_setor) perfil.sigla = r.sigla_setor;
      Prefs.set("perfil", perfil);
      preencherPerfil();

      preencherPasso2();
      $("#passo2").classList.remove("oculto");
      $("#passo2").scrollIntoView({ behavior: "smooth", block: "start" });
    })
  );

  // ---------------- Passo 2: revisão ----------------
  function preencherPasso2() {
    const d = estado.dados;
    const c = estado.classe;
    $("#f-natureza").value = c.natureza;
    $("#f-modalidade").value = c.modalidade;
    $("#f-prioridade").value = c.prioridade;
    $("#f-marca").value = c.indicaMarca ? "sim" : "nao";
    $("#conf-natureza").textContent = c.naturezaConf != null ? `Jev: ${Math.round(c.naturezaConf * 100)}% de confiança` : "";
    $("#conf-modalidade").textContent = c.modalidadeConf != null ? `Jev: ${Math.round(c.modalidadeConf * 100)}% de confiança` : "";
    $("#f-objeto").value = d.objeto_curto || "";
    $("#f-exercicio").value = d.exercicio || "";
    $("#f-finalidade").value = d.finalidade || "";
    $("#f-local").value = d.local_entrega || "";
    $("#f-urgencia").value = d.urgencia || "";
    renderItens();
  }

  function renderItens() {
    const tb = $("#tb-itens");
    tb.textContent = "";
    estado.dados.itens.forEach((it, k) => {
      const total = el("td", {}, brl((it.quantidade || 0) * (it.valor_unitario_estimado || 0)));
      const atualizar = () => {
        total.textContent = brl((it.quantidade || 0) * (it.valor_unitario_estimado || 0));
        atualizarTotal();
      };
      const area = el("textarea", { rows: 3, oninput: (e) => (it.especificacao = e.target.value) });
      area.value = it.especificacao || "";
      tb.append(
        el("tr", {},
          el("td", {}, k + 1),
          el("td", {},
            el("input", { class: "item-desc", value: it.descricao || "", oninput: (e) => (it.descricao = e.target.value) }),
            area),
          el("td", {}, el("input", { value: it.unidade || "", oninput: (e) => (it.unidade = e.target.value) })),
          el("td", {}, el("input", { type: "number", min: 0, value: it.quantidade || 0, oninput: (e) => { it.quantidade = Number(e.target.value); atualizar(); } })),
          el("td", {}, el("input", { type: "number", min: 0, step: "0.01", value: it.valor_unitario_estimado || 0, oninput: (e) => { it.valor_unitario_estimado = Number(e.target.value); atualizar(); } })),
          total,
          el("td", {}, el("button", { class: "btn link", title: "Remover item", onclick: () => { estado.dados.itens.splice(k, 1); renderItens(); } }, "✕")))
      );
    });
    atualizarTotal();
  }

  function valorTotal() {
    return estado.dados.itens.reduce((s, i) => s + (i.quantidade || 0) * (i.valor_unitario_estimado || 0), 0);
  }

  function atualizarTotal() {
    const v = valorTotal();
    $("#total-itens").textContent = brl(v);
    const mod = $("#f-modalidade").value;
    let aviso = "";
    if (mod === "dispensa" && v > C.LIMITE_DISPENSA)
      aviso = `O valor estimado (${brl(v)}) supera o limite de dispensa por valor (${brl(C.LIMITE_DISPENSA)}). Considere pregão.`;
    if ($("#f-natureza").value === "servico")
      aviso += (aviso ? " " : "") + "Os modelos de serviço ainda não estão neste protótipo; os documentos sairão com a estrutura de aquisição de material.";
    msg("#aviso-modalidade", aviso, "aviso");
  }
  ["#f-modalidade", "#f-natureza"].forEach((s) => $(s).addEventListener("change", atualizarTotal));

  $("#btn-add-item").addEventListener("click", () => {
    estado.dados.itens.push({ descricao: "", especificacao: "", unidade: "Unidade", quantidade: 1, valor_unitario_estimado: 0, justificativa_quantidade: "" });
    renderItens();
  });

  function montarProcesso() {
    const d = estado.dados;
    return {
      ...d,
      textoPedido: estado.textoPedido,
      objeto_curto: $("#f-objeto").value.trim() || d.objeto_curto,
      exercicio: $("#f-exercicio").value.trim() || d.exercicio,
      finalidade: $("#f-finalidade").value.trim() || d.finalidade,
      local_entrega: $("#f-local").value.trim() || d.local_entrega,
      urgencia: $("#f-urgencia").value.trim(),
      itens: d.itens.filter((i) => i.descricao || i.especificacao),
      requisitante: d.requisitante || {},
      perfil: clone(perfil),
      data: new Date(),
      classe: {
        ...estado.classe,
        natureza: $("#f-natureza").value,
        modalidade: $("#f-modalidade").value,
        prioridade: $("#f-prioridade").value,
        indicaMarca: $("#f-marca").value === "sim",
        valorTotal: valorTotal(),
      },
    };
  }

  // ---------------- Passo 3: redação ----------------
  const ROTULOS = {
    dfd: { titulo: "DFD — Documento de Formalização da Demanda", campos: { descricao_sucinta: "Descrição sucinta do objeto", justificativa_prioridade: "Justificativa do grau de prioridade", justificativa_necessidade: "Justificativa da necessidade da contratação", vinculacao: "Vinculação com outro DFD" } },
    justificativa: { titulo: "Termo de Justificativa", campos: { objeto: "A) Objeto da aquisição", especificacoes_exclusivas: "Especificações exclusivas (marca)", motivacao: "Justificativa/motivação", beneficios_srp: "Benefícios do Registro de Preços", metodologia_quantitativos: "Metodologia dos quantitativos", conexao_planejamento: "Conexão com o planejamento" } },
    etp1: { titulo: "ETP — necessidade e requisitos", campos: { objeto: "Objeto da aquisição", descricao_necessidade: "Descrição da necessidade", quadro_objeto: "Quadro: Objeto", quadro_motivo: "Quadro: Motivo", quadro_finalidade: "Quadro: Finalidade", quadro_vigencia: "Quadro: Prazo inicial da vigência", requisitos: "Requisitos da contratação" } },
    etp2: { titulo: "ETP — mercado, solução e viabilidade", campos: { levantamento_mercado: "Levantamento de mercado", parametros_pesquisa_precos: "Parâmetros da pesquisa de preços", descricao_solucao: "Descrição da solução como um todo", estimativa_quantidades: "Estimativa das quantidades", parcelamento: "Parcelamento", contratacoes_correlatas: "Contratações correlatas", alinhamento_planejamento: "Alinhamento com o planejamento", beneficios: "Benefícios", declaracao_viabilidade: "Declaração de viabilidade" } },
  };

  function linhasPara(txt) {
    const n = String(txt || "").length;
    return Math.min(16, Math.max(2, Math.ceil(n / 95) + (String(txt).match(/\n/g) || []).length));
  }

  function campoTexto(obj, chave, rotulo) {
    const t = el("textarea", { rows: linhasPara(obj[chave]), oninput: (e) => (obj[chave] = e.target.value) });
    t.value = obj[chave] || "";
    return el("label", {}, rotulo, t);
  }

  function renderBloco(k, aberto) {
    const proc = estado.processo;
    const r = ROTULOS[k];
    const t = estado.textos[k];
    const cont = el("div", { class: "conteudo" });
    Object.entries(r.campos).forEach(([ch, rot]) => {
      if (ch === "especificacoes_exclusivas" && !proc.classe.indicaMarca) return;
      if (ch === "beneficios_srp" && proc.classe.modalidade !== "pregao_srp") return;
      if (ch === "requisitos") {
        const box = el("div", {}, el("label", {}, rot));
        (t.requisitos || []).forEach((rq, i) =>
          box.append(el("div", { class: "req" },
            campoTexto(rq, "requisito", `Requisito ${i + 1}`),
            campoTexto(rq, "justificativa", "Justificativa técnica"),
            campoTexto(rq, "base_legal", "Base legal")))
        );
        cont.append(box);
        return;
      }
      cont.append(campoTexto(t, ch, rot));
    });
    const refazer = el("button", { class: "btn sec peq", onclick: (e) => { e.preventDefault(); refazerBloco(k, e.target); } }, "↻ Refazer este bloco com IA");
    const det = el("details", { class: "bloco", "data-bloco": k, open: aberto },
      el("summary", {}, r.titulo, el("span", { class: "espaco" }), estado.demo ? null : refazer),
      cont);
    const antigo = $(`[data-bloco="${k}"]`);
    if (antigo) antigo.replaceWith(det);
    else $("#editor").append(det);
  }

  async function refazerBloco(k, botao) {
    await ocupado(botao, async () => {
      try {
        estado.textos[k] = await window.Pipeline.redigirBloco(k, estado.processo);
        renderBloco(k, true);
      } catch (e) {
        alert("Erro ao refazer o bloco: " + e.message);
      }
    });
  }

  function etapaUI(nome) {
    const linha = el("div", { class: "etapa rodando" }, el("span", { class: "ic" }), nome);
    $("#progresso").append(linha);
    return {
      ok: () => (linha.className = "etapa feito"),
      falha: (m) => {
        linha.className = "etapa falhou";
        linha.append(" — " + m);
      },
    };
  }

  $("#btn-redigir").addEventListener("click", (ev) =>
    ocupado(ev.target, async () => {
      msg("#msg2", "");
      const proc = montarProcesso();
      if (!proc.itens.length) return msg("#msg2", "Inclua ao menos um item.");
      estado.processo = proc;
      $("#passo3").classList.remove("oculto");
      $("#progresso").textContent = "";
      $("#downloads").textContent = "";
      $("#editor").textContent = "";
      $("#passo3").scrollIntoView({ behavior: "smooth", block: "start" });

      const nomes = { dfd: "DFD", justificativa: "Termo de Justificativa", etp1: "ETP – necessidade e requisitos", etp2: "ETP – mercado e solução" };
      const ui = {};
      Object.entries(nomes).forEach(([k, n]) => (ui[k] = etapaUI("Redigindo " + n)));

      try {
        if (estado.demo) {
          estado.textos = clone(window.Demo.textos);
          for (const k of Object.keys(nomes)) {
            await new Promise((r) => setTimeout(r, 250));
            ui[k].ok();
          }
          registrarSimulado(["3a", "3b", "3c", "3d"]);
        } else {
          estado.textos = await window.Pipeline.redigirTudo(proc, (k) => ui[k].ok());
        }
      } catch (e) {
        $$(".etapa.rodando").forEach((x) => (x.className = "etapa falhou"));
        return msg("#msg2", (e instanceof ErroRota ? "" : "Erro na redação: ") + e.message);
      }
      Object.keys(nomes).forEach((k, i) => renderBloco(k, i === 0));
      renderDownloads();
    })
  );

  // ---------------- Downloads ----------------
  function baixar(blob, nome) {
    const a = el("a", { href: URL.createObjectURL(blob), download: nome });
    document.body.append(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }

  function renderDownloads() {
    const box = $("#downloads");
    box.textContent = "";
    // Usa sempre os textos atuais (editados) no momento do clique.
    const lista = () => window.Docs.listaArquivos(estado.processo, estado.textos);
    lista().forEach((a, i) => {
      const ext = a.xlsx ? "xlsx" : "docx";
      box.append(
        el("div", { class: "arquivo" },
          el("span", { class: "tipo " + ext }, ext.toUpperCase()),
          el("div", { class: "nome" }, a.titulo, el("small", {}, a.nome)),
          el("button", {
            class: "btn sec peq",
            onclick: async (e) => {
              const arq = lista()[i];
              await ocupado(e.target, async () => baixar(await window.Docs.gerarBlob(arq), arq.nome));
            },
          }, "Baixar"))
      );
    });
    box.append(
      el("div", { class: "tudo" },
        el("button", {
          class: "btn",
          onclick: (e) =>
            ocupado(e.target, async () => {
              const zip = new window.JSZip();
              for (const a of lista()) zip.file(a.nome, await window.Docs.gerarBlob(a));
              const nomeZip = "Processo_" + lista()[0].nome.replace(/^00_Oficio_Solicitacao_PAMS_/, "").replace(/\.docx$/, "") + ".zip";
              baixar(await zip.generateAsync({ type: "blob" }), nomeZip);
            }),
        }, "Baixar processo completo (.zip)"))
    );
  }

  // ---------------- Início ----------------
  renderUso();
  verificarConexao(false);
})();
