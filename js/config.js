// Configuração central do DEAO Processos.
window.CONFIG = {
  WORKER_URL: "https://still-cake-5afc.cavalcante-maxi.workers.dev",

  // Modelos do Claude disponíveis no seletor. O primeiro é o padrão.
  CLAUDE_MODELS: [
    { id: "claude-opus-5-5", nome: "Claude Opus 5.5 (melhor redação)" },
    { id: "claude-sonnet-5-5", nome: "Claude Sonnet 5.5 (equilíbrio)" },
    { id: "claude-haiku-5-5", nome: "Claude Haiku 5.5 (mais barato)" },
  ],

  // Preços em US$ por milhão de tokens (tabela Anthropic de out/2026).
  // cw = escrita em cache (1,25x a entrada), cr = leitura em cache.
  // Modelos extras aparecem aqui porque uma resposta pode vir de um modelo de fallback.
  PRECOS: {
    "claude-opus-5-5": { in: 4.0, out: 20.0, cw: 5.0, cr: 0.2 },
    "claude-sonnet-5-5": { in: 2.0, out: 10.0, cw: 2.5, cr: 0.2 },
    "claude-haiku-5-5": { in: 0.1, out: 0.5, cw: 0.125, cr: 0.01 },
    "claude-opus-5": { in: 5.0, out: 25.0, cw: 6.25, cr: 0.5 },
    "claude-opus-4-8": { in: 5.0, out: 25.0, cw: 6.25, cr: 0.5 },
    "claude-sonnet-5": { in: 2.0, out: 10.0, cw: 2.5, cr: 0.2 },
    jev: { in: 0.042, out: 0, cw: 0, cr: 0 }, // TypeSafe Jev: só a entrada é cobrada
  },

  // Cotação padrão do dólar (editável na tela de configurações).
  COTACAO_DOLAR: 5.6,

  // Limite da dispensa por valor para compras (art. 75, II, Lei 14.133/2021),
  // atualizado anualmente por decreto. Confira o valor vigente.
  LIMITE_DISPENSA: 62725.59,

  ORGAO: {
    nome: "COMISSÃO DE AEROPORTOS DA REGIÃO AMAZÔNICA",
    sigla: "COMARA",
    endereco: "Av. Pedro Álvares Cabral, 7115 – CEP 66.613-150 – Belém/PA",
    cidade: "Belém",
  },
};
