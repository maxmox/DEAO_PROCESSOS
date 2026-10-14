// Etapas de geração do processo. Cada etapa é uma chamada pontual e curta à IA,
// que devolve apenas os campos variáveis; o texto fixo dos modelos fica no código (docs.js).
(function () {
  const { claudeJSON, jev } = window.API;

  // Prompt de sistema compartilhado por todas as chamadas do Claude (fica em cache).
  // Não colocar aqui nada que mude entre chamadas (datas, nomes, pedidos).
  const SISTEMA = `Você é um redator técnico da Seção de Apoio às Obras (DEAO) da Comissão de Aeroportos da Região Amazônica (COMARA), Organização Militar do Comando da Aeronáutica (Força Aérea Brasileira), sediada na Av. Pedro Álvares Cabral, 7115, CEP 66.613-150, Belém/PA. Você redige peças de planejamento de contratações públicas que serão anexadas ao ofício de solicitação de PAM/S (Pedido de Aquisição de Material/Serviço) encaminhado ao Chefe da Divisão de Apoio (DA).

CONTEXTO DA COMARA
- Missão: projetar, construir, ampliar e recuperar infraestrutura aeroportuária na região amazônica, atuando em múltiplas frentes simultâneas.
- Estrutura relevante: Divisão de Engenharia (DE), Subdivisão de Obras (SDO), Subdivisão de Projetos (SDPJ), Seção de Apoio às Obras (DEAO), Seção de Manutenção e Conservação (SMC), Seção de Almoxarifado (SAL), Divisão de Apoio (DA), Seção de Aquisição (SAQ).
- Unidades apoiadas: Sede em Belém/PA e Destacamentos de Apoio de Coari (DACO-TT), São Gabriel da Cachoeira (DACO-UA) e Manaus (DACO-MN), além de Yauaretê/AM.
- A logística amazônica é difícil: entregas longas, dependência de transporte fluvial, clima úmido e quente que acelera a degradação de edificações e materiais.

ARCABOUÇO LEGAL (cite apenas o que for pertinente)
- Lei nº 14.133/2021: art. 5º e art. 11 (princípios e objetivos); art. 18, §1º (estudo técnico preliminar e seus elementos); art. 23 (estimativa de preços); art. 40 (planejamento de compras, padronização, parcelamento); art. 41 (indicação de marca); art. 75, II (dispensa por valor); art. 82 a 86 (Sistema de Registro de Preços); art. 84 (vigência da ata).
- Decreto nº 11.462/2023 (regulamenta o SRP; art. 3º hipóteses de adoção).
- Decreto nº 10.947/2022 (Plano de Contratações Anual – PCA, DFD e PGC).
- IN SEGES/ME nº 58/2022 (ETP digital), IN SEGES/ME nº 65/2021 (pesquisa de preços para bens e serviços comuns), IN SEGES/MGI nº 10/2023.
- Sustentabilidade: Decreto nº 7.746/2012 (redação do Decreto nº 9.178/2017), Lei nº 12.305/2010 (PNRS), requisitos do INMETRO e diretiva RoHS.
- Bens comuns: padrões de desempenho e qualidade objetivamente definidos por especificações usuais de mercado.

ESTILO OBRIGATÓRIO
- Português formal administrativo do Brasil, impessoal, em terceira pessoa, frases claras, sem marketing, sem listas com marcadores dentro de parágrafos (salvo quando o campo pedir lista).
- Seja específico ao caso: cite o material, a quantidade, a finalidade, o local de entrega e o exercício informados. Evite generalidades que serviriam a qualquer processo.
- Nunca invente fatos verificáveis: números de processo, de pregão, de DFD, códigos PGC/PAAC, CATMAT, valores históricos de consumo, nomes de pessoas ou dados pessoais. Quando um dado for necessário e não tiver sido informado, escreva um marcador entre colchetes, por exemplo [informar código PGC] ou [nº do processo].
- Quantitativos: justifique com base no que foi informado (área a ser recuperada, frentes de serviço, reposição de estoque, rendimento típico do material). Pode apresentar raciocínio técnico de estimativa, sinalizando quando for estimativa.
- Separe parágrafos com uma linha em branco (\\n\\n). Não use markdown, negrito ou títulos dentro dos campos.
- Responda SOMENTE com o objeto JSON pedido, sem texto antes ou depois.

EXEMPLOS DE TOM (trechos de processos reais da COMARA)
Motivação: "A opção pelo Sistema de Registro de Preços como instrumento de contratação fundamenta-se na experiência consolidada da COMARA, cuja execução demonstrou que o fornecimento parcelado de insumos conforme demanda real é significativamente mais eficiente do que a aquisição antecipada de quantidades fixas."
Benefícios do SRP: "A adoção do Sistema de Registro de Preços fundamenta-se no art. 82 da Lei nº 14.133/2021 e no art. 3º do Decreto nº 11.462/2023, por verificar-se que: (i) há necessidade de contratações frequentes ao longo do exercício; (ii) os quantitativos definitivos dependem do ritmo de execução dos serviços; e (iii) a aquisição parcelada conforme a demanda real é mais vantajosa para a Administração."
Conexão com o planejamento: "A inserção da demanda nos instrumentos formais de planejamento evidencia que a contratação decorre de necessidade previamente identificada, analisada e consolidada pela Administração, não se caracterizando como demanda emergencial ou superveniente, mas como ação planejada e estruturada."
Necessidade: "A ausência ou insuficiência de tais insumos representa risco direto de paralisação das frentes de trabalho, com impactos sobre o cumprimento dos prazos e a preservação do patrimônio público."`;

  // Utilitário para montar schemas JSON estritos.
  const S = {
    str: (d) => ({ type: "string", description: d }),
    num: (d) => ({ type: "number", description: d }),
    obj(props) {
      return { type: "object", properties: props, required: Object.keys(props), additionalProperties: false };
    },
    arr: (items, d) => ({ type: "array", items, description: d }),
  };

  // ---------------------------------------------------------------------------
  // ETAPA 1 — Extração: transforma o texto livre em dados estruturados.
  // ---------------------------------------------------------------------------
  const SCHEMA_EXTRACAO = S.obj({
    requisitante: S.obj({
      nome: S.str("nome completo de quem escreveu o pedido, ou vazio"),
      posto: S.str("posto/graduação abreviado no padrão FAB, ex.: 1º Ten, Cap, Maj, ou vazio"),
      setor: S.str("seção/setor por extenso, ex.: Seção de Apoio às Obras"),
      sigla_setor: S.str("sigla do setor se conhecida, ex.: DEAO, ou vazio"),
    }),
    objeto_curto: S.str("nome simplificado do objeto para o assunto do ofício, ex.: Tintas para reparos prediais 2027"),
    finalidade: S.str("para que o material será usado, em uma frase"),
    local_entrega: S.str("local de entrega informado"),
    exercicio: S.str("ano de execução/aquisição, ex.: 2027"),
    urgencia: S.str("o que o pedido diz sobre prazo/urgência, ou vazio"),
    itens: S.arr(
      S.obj({
        descricao: S.str("nome curto do item, ex.: Tinta acrílica branca"),
        especificacao: S.str(
          "especificação técnica de mercado em MAIÚSCULAS no padrão de catálogo (material, tipo, acabamento, embalagem, norma ABNT quando houver), sem marca"
        ),
        unidade: S.str("unidade de fornecimento, ex.: Lata 18 L, Galão 3,6 L, Unidade"),
        quantidade: S.num("quantidade pedida"),
        valor_unitario_estimado: S.num(
          "estimativa grosseira de preço unitário de mercado em reais, só como referência inicial"
        ),
        justificativa_quantidade: S.str("justificativa curta (1-2 frases) do quantitativo deste item"),
      }),
      "um item por material distinto pedido"
    ),
  });

  async function extrair(textoPedido) {
    return claudeJSON({
      etapa: "1. Extração do pedido",
      sistema: SISTEMA,
      schema: SCHEMA_EXTRACAO,
      maxTokens: 8000,
      usuario: `Extraia os dados do pedido abaixo. Quando o pedido não especificar a embalagem/tipo, adote o padrão técnico mais usual para o uso descrito e deixe isso explícito na especificação (ex.: tinta acrílica premium fosca para alvenaria, lata de 18 litros, conforme ABNT NBR 15079).

PEDIDO:
"""${textoPedido}"""`,
    });
  }

  // ---------------------------------------------------------------------------
  // ETAPA 2 — Classificação com a Jev (decisões objetivas, custo ínfimo).
  // ---------------------------------------------------------------------------
  async function classificar(textoPedido, dados) {
    const total = (dados.itens || []).reduce((s, i) => s + (i.quantidade || 0) * (i.valor_unitario_estimado || 0), 0);
    const estado = `Pedido do requisitante: ${textoPedido}

Itens: ${(dados.itens || []).map((i) => `${i.quantidade} ${i.unidade} de ${i.descricao}`).join("; ")}.
Valor total estimado: R$ ${total.toFixed(2)}. Limite de dispensa por valor para compras: R$ ${window.CONFIG.LIMITE_DISPENSA.toFixed(2)}.`;

    const r = await jev({
      etapa: "2. Classificação (Jev)",
      estado,
      perguntas: {
        natureza: {
          type: "choice",
          instructions: "Qual a natureza do objeto desta contratação pública?",
          criteria: {
            consumo: "material de consumo: perde identidade ou é consumido com o uso em até dois anos (tintas, insumos, peças de reposição)",
            permanente: "material permanente: bem durável, patrimoniado, vida útil superior a dois anos (equipamentos, mobiliário, ferramentas elétricas)",
            servico: "contratação de serviço (mão de obra, manutenção, locação)",
          },
        },
        modalidade: {
          type: "choice",
          instructions:
            "Qual procedimento de contratação é mais adequado segundo a Lei 14.133/2021, considerando valor, frequência e previsibilidade da demanda?",
          criteria: {
            pregao_srp:
              "pregão eletrônico com Sistema de Registro de Preços: bens comuns, demanda recorrente ou de quantidade imprecisa, entregas parceladas, ou valor acima do limite de dispensa",
            pregao: "pregão eletrônico tradicional: bens comuns acima do limite de dispensa, quantidade certa, entrega única",
            dispensa: "dispensa de licitação por valor (art. 75, II): valor total abaixo do limite de dispensa",
            inexigibilidade: "inexigibilidade: fornecedor exclusivo ou inviabilidade de competição",
          },
        },
        prioridade: {
          type: "score",
          instructions: "Qual o grau de prioridade desta contratação para a Organização?",
          criteria: ["Baixa", "Média", "Alta"],
        },
        indica_marca: {
          type: "noul",
          instructions: "O pedido exige indicar uma marca ou modelo específico (padronização, compatibilidade)?",
        },
      },
    });

    const opcao = (a) => (a && a.choice) || "";
    let prioridade = "Média";
    // O score vem fracionado (ex.: 1.52); usa o nível mais provável.
    if (r.prioridade && r.prioridade.legend) {
      const probs = r.prioridade.probabilities || {};
      const nivel = Object.keys(probs).length
        ? Object.keys(probs).sort((a, b) => probs[b] - probs[a])[0]
        : String(Math.round(r.prioridade.score));
      prioridade = r.prioridade.legend[nivel] || prioridade;
    }
    return {
      natureza: opcao(r.natureza) || "consumo",
      naturezaConf: r.natureza && r.natureza.confidence,
      modalidade: opcao(r.modalidade) || "pregao_srp",
      modalidadeConf: r.modalidade && r.modalidade.confidence,
      prioridade,
      indicaMarca: r.indica_marca ? r.indica_marca.noul >= 0.5 : false,
      valorTotal: total,
      bruto: r,
    };
  }

  // ---------------------------------------------------------------------------
  // ETAPA 3 — Redação fracionada (uma chamada por bloco de documento).
  // ---------------------------------------------------------------------------
  const NOMES_MODALIDADE = {
    pregao_srp: "Pregão Eletrônico pelo Sistema de Registro de Preços (SRP)",
    pregao: "Pregão Eletrônico",
    dispensa: "Dispensa de Licitação por valor (art. 75, II, da Lei nº 14.133/2021)",
    inexigibilidade: "Inexigibilidade de Licitação (art. 74 da Lei nº 14.133/2021)",
  };

  function resumoCaso(p) {
    const itens = p.itens
      .map(
        (i, k) =>
          `${k + 1}. ${i.descricao} — ${i.quantidade} ${i.unidade} — especificação: ${i.especificacao}${
            i.valor_unitario_estimado ? ` — preço estimado R$ ${Number(i.valor_unitario_estimado).toFixed(2)}/un.` : ""
          }`
      )
      .join("\n");
    return `DADOS DO CASO
- Pedido original do requisitante: """${p.textoPedido}"""
- Requisitante: ${[p.requisitante.posto, p.requisitante.nome].filter(Boolean).join(" ") || "[não informado]"} — ${p.requisitante.setor || "[setor]"}
- Objeto: ${p.objeto_curto}
- Finalidade: ${p.finalidade}
- Natureza: material de ${p.classe.natureza}
- Procedimento: ${NOMES_MODALIDADE[p.classe.modalidade] || p.classe.modalidade}
- Prioridade: ${p.classe.prioridade}
- Exercício: ${p.exercicio}
- Local de entrega: ${p.local_entrega}
- Prazo/urgência: ${p.urgencia || "não informado"}
- Valor total estimado (preliminar, sujeito à pesquisa de preços): R$ ${p.classe.valorTotal.toFixed(2)}
- Itens:
${itens}`;
  }

  const BLOCOS = {
    dfd: {
      etapa: "3a. DFD",
      schema: S.obj({
        descricao_sucinta: S.str("descrição sucinta do objeto (1 parágrafo, começando por 'Aquisição de' ou 'Registro de Preços para eventual aquisição de')"),
        justificativa_prioridade: S.str("justificativa do grau de prioridade (1 parágrafo); obrigatória se Alta"),
        justificativa_necessidade: S.str("justificativa da necessidade: problema identificado, necessidade gerada e resultado pretendido, incluindo a lógica dos quantitativos (2 a 4 parágrafos)"),
        vinculacao: S.str("frase sobre vinculação ou dependência com outro DFD; se não houver, dizer que não há dependência"),
      }),
      pedido: "Redija os campos variáveis do DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA (DFD), conforme Decreto nº 10.947/2022.",
    },
    justificativa: {
      etapa: "3b. Termo de Justificativa",
      schema: S.obj({
        objeto: S.str("parágrafo do item A) OBJETO DA AQUISIÇÃO, terminando com 'e se justifica de acordo com as informações dispostas a seguir.'"),
        especificacoes_exclusivas: S.str("texto do item ESPECIFICAÇÕES EXCLUSIVAS (art. 41 da Lei 14.133/2021) se houver indicação de marca/modelo; senão string vazia"),
        motivacao: S.str("JUSTIFICATIVA/MOTIVAÇÃO DA AQUISIÇÃO (2 a 3 parágrafos, pressupostos de fato e de direito)"),
        beneficios_srp: S.str("BENEFÍCIOS DIRETOS E INDIRETOS DO REGISTRO DE PREÇOS (1-2 parágrafos) se o procedimento for SRP; senão string vazia"),
        metodologia_quantitativos: S.str("METODOLOGIA UTILIZADA PARA DEFINIÇÃO DOS QUANTITATIVOS (2 a 4 parágrafos, específica para os itens)"),
        conexao_planejamento: S.str("CONEXÃO ENTRE A AQUISIÇÃO E O PLANEJAMENTO EXISTENTE (1-2 parágrafos, com marcador para o código PGC/PCA)"),
      }),
      pedido: "Redija os campos variáveis do TERMO DE JUSTIFICATIVA PARA AQUISIÇÃO.",
    },
    etp1: {
      etapa: "3c. ETP — necessidade e requisitos",
      schema: S.obj({
        objeto: S.str("parágrafo OBJETO DA AQUISIÇÃO do ETP"),
        descricao_necessidade: S.str("DESCRIÇÃO DA NECESSIDADE (3 a 5 parágrafos, contextualizando a missão da COMARA e o problema concreto)"),
        quadro_objeto: S.str("linha 'Objeto' do quadro-resumo"),
        quadro_motivo: S.str("linha 'Motivo' do quadro-resumo"),
        quadro_finalidade: S.str("linha 'Finalidade' do quadro-resumo"),
        quadro_vigencia: S.str("linha 'Prazo inicial da vigência' (ata de 1 ano prorrogável, art. 84 se SRP; ou prazo de entrega se compra direta)"),
        requisitos: S.arr(
          S.obj({
            requisito: S.str("descrição do requisito"),
            justificativa: S.str("justificativa técnica"),
            base_legal: S.str("base legal ou norma técnica (ABNT, INMETRO, Lei)"),
          }),
          "4 a 6 requisitos: sustentabilidade, especificação/qualidade (normas ABNT do material), local e prazo de entrega, recebimento provisório/definitivo, garantia/validade do produto, embalagem"
        ),
      }),
      pedido: "Redija a primeira parte do ESTUDO TÉCNICO PRELIMINAR (IN SEGES/ME nº 58/2022): objeto, necessidade, quadro-resumo e requisitos da contratação.",
    },
    etp2: {
      etapa: "3d. ETP — mercado e solução",
      schema: S.obj({
        levantamento_mercado: S.str("LEVANTAMENTO DE MERCADO: soluções/alternativas identificadas e a escolhida, com justificativa (3 a 5 parágrafos; contratações similares citadas apenas com marcador [Pregão nº / UASG])"),
        parametros_pesquisa_precos: S.str("Parâmetros da pesquisa de preços conforme IN 65/2021 (fontes art. 5º, método média/mediana/menor, mínimo de 3 preços) (2 parágrafos)"),
        descricao_solucao: S.str("DESCRIÇÃO DA SOLUÇÃO COMO UM TODO (2 a 4 parágrafos, citando procedimento e critério de julgamento)"),
        estimativa_quantidades: S.str("ESTIMATIVA DAS QUANTIDADES: memória de cálculo/raciocínio dos quantitativos (2 a 3 parágrafos)"),
        parcelamento: S.str("JUSTIFICATIVA PARA O PARCELAMENTO OU NÃO DA SOLUÇÃO (adjudicação por item, art. 40, V, b)"),
        contratacoes_correlatas: S.str("CONTRATAÇÕES CORRELATAS E/OU INTERDEPENDENTES (1 parágrafo)"),
        alinhamento_planejamento: S.str("ALINHAMENTO ENTRE A CONTRATAÇÃO E O PLANEJAMENTO (1 parágrafo, com marcador de código PCA)"),
        beneficios: S.str("BENEFÍCIOS A SEREM ALCANÇADOS (1-2 parágrafos, concretos)"),
        declaracao_viabilidade: S.str("DECLARAÇÃO DE VIABILIDADE (1 parágrafo, citando art. 9º, XIII, da IN 58/2022)"),
      }),
      pedido: "Redija a segunda parte do ESTUDO TÉCNICO PRELIMINAR: mercado, pesquisa de preços, solução, quantidades, parcelamento, correlatas, planejamento, benefícios e viabilidade.",
    },
  };

  async function redigirBloco(chave, processo) {
    const b = BLOCOS[chave];
    return claudeJSON({
      etapa: b.etapa,
      sistema: SISTEMA,
      schema: b.schema,
      maxTokens: 12000,
      usuario: `${b.pedido}\n\n${resumoCaso(processo)}`,
    });
  }

  // Primeira chamada sozinha (grava o cache do prompt de sistema), demais em paralelo.
  async function redigirTudo(processo, aoConcluir) {
    const ordem = ["dfd", "justificativa", "etp1", "etp2"];
    const out = {};
    const rodar = async (k) => {
      out[k] = await redigirBloco(k, processo);
      aoConcluir && aoConcluir(k);
    };
    await rodar(ordem[0]);
    await Promise.all(ordem.slice(1).map(rodar));
    return out;
  }

  window.Pipeline = { extrair, classificar, redigirBloco, redigirTudo, NOMES_MODALIDADE, SISTEMA, BLOCOS };
})();
