// Montagem dos documentos (.docx com a biblioteca docx e .xlsx com ExcelJS).
// O texto fixo dos modelos da COMARA está aqui; a IA só preenche os campos variáveis.
(function (global) {
  const D = global.docx;
  const FONTE = "Times New Roman";
  const TAM = 24; // 12 pt
  const LARGURA = 9071; // A4 menos margens (twips)

  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const dataExtenso = (d) => `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  const dataCurta = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const maisDias = (d, n) => new Date(d.getTime() + n * 86400000);
  const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtQtd = (v) => Number(v || 0).toLocaleString("pt-BR");

  // ---------- Primitivas ----------
  // Trechos entre colchetes ([informar ...]) saem destacados em amarelo para revisão.
  function runs(texto, o = {}) {
    return String(texto == null ? "" : texto)
      .split(/(\[[^\]]+\])/)
      .filter((s) => s !== "")
      .map(
        (s) =>
          new D.TextRun({
            text: s,
            bold: o.bold,
            italics: o.italics,
            size: o.size || TAM,
            font: FONTE,
            highlight: /^\[.*\]$/.test(s) ? "yellow" : undefined,
          })
      );
  }

  function par(texto, o = {}) {
    return new D.Paragraph({
      children: runs(texto, o),
      alignment: o.align || D.AlignmentType.JUSTIFIED,
      spacing: { before: o.antes || 0, after: o.depois == null ? 120 : o.depois, line: 300 },
      indent: o.recuo ? { firstLine: 709 } : o.esquerda ? { left: o.esquerda } : undefined,
      keepNext: o.keepNext,
    });
  }

  // Quebra um texto da IA em parágrafos.
  function pars(texto, o = {}) {
    return String(texto || "")
      .split(/\n\s*\n|\n/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => par(t, { recuo: true, ...o }));
  }

  const centro = (t, o = {}) => par(t, { align: D.AlignmentType.CENTER, depois: 0, ...o });
  const titulo = (t) => par(t, { bold: true, align: D.AlignmentType.CENTER, antes: 240, depois: 240 });
  const secao = (t) => par(t, { bold: true, antes: 240, depois: 120, keepNext: true });

  function cabecalho() {
    return [
      centro("MINISTÉRIO DA DEFESA", { bold: true }),
      centro("COMANDO DA AERONÁUTICA", { bold: true }),
      centro("COMISSÃO DE AEROPORTOS DA REGIÃO AMAZÔNICA", { bold: true, depois: 240 }),
    ];
  }

  const BORDA = { style: D.BorderStyle.SINGLE, size: 4, color: "000000" };
  const BORDAS = { top: BORDA, bottom: BORDA, left: BORDA, right: BORDA };

  // conteudo: string | Paragraph[]
  function cel(conteudo, o = {}) {
    const filhos = Array.isArray(conteudo)
      ? conteudo
      : String(conteudo == null ? "" : conteudo)
          .split(/\n\s*\n|\n/)
          .map((t) =>
            par(t, {
              bold: o.bold,
              align: o.align || (o.bold ? D.AlignmentType.LEFT : D.AlignmentType.JUSTIFIED),
              depois: 60,
              size: o.size,
            })
          );
    return new D.TableCell({
      children: filhos.length ? filhos : [par("")],
      columnSpan: o.span,
      width: o.w ? { size: o.w, type: D.WidthType.DXA } : undefined,
      shading: o.fundo ? { type: D.ShadingType.CLEAR, color: "auto", fill: o.fundo } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      verticalAlign: D.VerticalAlign.CENTER,
      borders: BORDAS,
    });
  }

  function tabela(linhas, larguras) {
    return new D.Table({
      width: { size: LARGURA, type: D.WidthType.DXA },
      columnWidths: larguras || [LARGURA],
      rows: linhas.map((cells) => new D.TableRow({ children: cells, cantSplit: false })),
    });
  }

  const faixa = (t, span) => cel(t, { bold: true, fundo: "D9D9D9", span, align: D.AlignmentType.CENTER });
  const espaco = () => par("", { depois: 120 });

  function documento(filhos) {
    return new D.Document({
      creator: "DEAO Processos",
      styles: { default: { document: { run: { font: FONTE, size: TAM } } } },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1418, bottom: 1134, left: 1701, right: 1134 },
            },
          },
          children: filhos,
        },
      ],
    });
  }

  function assinatura(nome, linha2, linha3) {
    return [
      par("", { depois: 480 }),
      centro("______________________________________"),
      centro(nome || "[NOME COMPLETO]", { bold: true }),
      linha2 ? centro(linha2) : null,
      linha3 ? centro(linha3) : null,
    ].filter(Boolean);
  }

  const nomeComPosto = (pessoa) =>
    [pessoa && pessoa.nome, pessoa && pessoa.posto].filter(Boolean).join(" ") || "[NOME COMPLETO – POSTO]";

  function tabelaItens(p, comPreco) {
    const w = comPreco ? [700, 1100, 3471, 1100, 800, 1900] : [700, 1300, 4571, 1500, 1000];
    const cab = comPreco
      ? ["Item", "CATMAT", "Descrição", "Unidade", "Qtde.", "Valor estimado (R$)"]
      : ["Item", "CATMAT", "Descrição", "Unidade", "Qtde."];
    const linhas = [cab.map((t) => cel(t, { bold: true, fundo: "D9D9D9", align: D.AlignmentType.CENTER, size: 20 }))];
    p.itens.forEach((it, k) => {
      const c = [
        cel(String(k + 1), { align: D.AlignmentType.CENTER, size: 20 }),
        cel(it.catmat || "[CATMAT]", { align: D.AlignmentType.CENTER, size: 20 }),
        cel(it.especificacao || it.descricao, { size: 20 }),
        cel(it.unidade, { align: D.AlignmentType.CENTER, size: 20 }),
        cel(fmtQtd(it.quantidade), { align: D.AlignmentType.CENTER, size: 20 }),
      ];
      if (comPreco)
        c.push(cel(brl((it.quantidade || 0) * (it.valor_unitario_estimado || 0)), { align: D.AlignmentType.RIGHT, size: 20 }));
      linhas.push(c);
    });
    if (comPreco) {
      const total = p.itens.reduce((s, i) => s + (i.quantidade || 0) * (i.valor_unitario_estimado || 0), 0);
      linhas.push([
        cel("VALOR TOTAL ESTIMADO", { bold: true, span: 5, align: D.AlignmentType.RIGHT, size: 20 }),
        cel(brl(total), { bold: true, align: D.AlignmentType.RIGHT, size: 20 }),
      ]);
    }
    return tabela(linhas, w);
  }

  const SRP = (p) => p.classe.modalidade === "pregao_srp";
  const DISPENSA = (p) => p.classe.modalidade === "dispensa";

  // "Tintas acrílicas para reparos – 2027" -> "tintas acrílicas para reparos"
  function objetoMinusculo(p) {
    const o = String(p.objeto_curto || "material").replace(/\s*[–-]\s*\d{4}\s*$/, "");
    return /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]/.test(o) ? o.charAt(0).toLowerCase() + o.slice(1) : o;
  }

  function anexosOficio(p) {
    const l = ["Documento de Formalização de Demanda (DFD)", "Termo de Justificativa para Aquisição de Material", "Estudo Técnico Preliminar (ETP)"];
    if (DISPENSA(p)) l[2] += " – facultado para dispensa de pequeno valor";
    l.push("Pesquisa de preços (conforme IN SEGES/ME nº 65/2021)");
    if (!DISPENSA(p) && p.classe.modalidade !== "inexigibilidade") l.push("Justificativa dos quantitativos para aquisição de itens");
    return l;
  }

  // ---------- 0. Ofício ----------
  function oficio(p) {
    const hoje = p.data || new Date();
    const sig = p.perfil.sigla || p.requisitante.sigla_setor || "[SIGLA]";
    const setor = p.perfil.setor || p.requisitante.setor || "[Setor Solicitante]";
    const chefe = p.perfil.chefe && p.perfil.chefe.nome ? p.perfil.chefe : null;
    const signatario = chefe || p.perfil;
    const contato = [p.perfil.posto, p.perfil.nomeGuerra || p.perfil.nome].filter(Boolean).join(" ") || "[POSTO E NOME DE GUERRA]";
    const anexos = anexosOficio(p);
    const letras = "ABCDEFG";
    const urg = p.urgencia ? ` Ressalta-se, ainda, que ${p.urgencia.replace(/\.$/, "")}, razão pela qual se solicita a devida celeridade na tramitação.` : "";

    return documento([
      ...cabecalho(),
      centro(`(${setor.toUpperCase()})`, { depois: 240 }),
      par(`Ofício nº [XX]/${sig}`, { depois: 0 }),
      par(`${global.CONFIG.ORGAO.cidade}, ${dataExtenso(hoje)}.`, { align: D.AlignmentType.RIGHT }),
      par(`Protocolo COMAER nº 67202.[XXXXXX]/${hoje.getFullYear()}-[XX]`, { antes: 120 }),
      par(`Do Chefe da ${setor}`, { depois: 0 }),
      par("Ao Chefe da Divisão de Apoio (DA)", { depois: 0 }),
      par(`Assunto: Solicitação de confecção de PAM/S – ${p.objeto_curto}`, { bold: true, antes: 120 }),
      par("Anexos:", { antes: 120, depois: 0 }),
      ...anexos.map((a, i) => par(`${letras[i]}. ${a}${i === anexos.length - 1 ? "." : ";"}`, { esquerda: 709, depois: 0 })),
      par(
        `1. Ao cumprimentá-lo cordialmente, passo a tratar sobre a necessidade de aquisição de ${objetoMinusculo(p)}, para ${p.finalidade.replace(/\.$/, "").replace(/^(para|destinad[oa]s? a)\s+/i, "")}.`,
        { recuo: true, antes: 240 }
      ),
      par(
        `2. Nesse sentido, solicito ao Sr. a possibilidade de confeccionar o PAM/S para aquisição do referido material, por meio de ${global.Pipeline.NOMES_MODALIDADE[p.classe.modalidade] || p.classe.modalidade}, conforme documentação em anexo.`,
        { recuo: true }
      ),
      par(
        `3. Informo que a aquisição se destina ao exercício de ${p.exercicio}, com entrega no seguinte local: ${p.local_entrega}.${urg}`,
        { recuo: true }
      ),
      par(
        `4. Sendo essas as considerações, reforço os protestos de estima e coloco à disposição o ${contato}, por intermédio do telefone ${p.perfil.telefone || "(91) [XXXX-XXXX]"}, para eventuais esclarecimentos.`,
        { recuo: true }
      ),
      ...assinatura(
        [signatario.nome, signatario.posto].filter(Boolean).join(" – ").toUpperCase() || "[NOME COMPLETO – POSTO]",
        `Chefe da ${setor}`
      ),
    ]);
  }

  // ---------- 1. DFD ----------
  function dfd(p, t) {
    const hoje = p.data || new Date();
    const area = p.perfil.area || p.perfil.setor || p.requisitante.setor || "[Área requisitante]";
    const chefe = p.perfil.chefe || {};
    const w2 = [Math.round(LARGURA * 0.3), LARGURA - Math.round(LARGURA * 0.3)];
    const w4 = [2268, 2268, 2268, 2267];
    const prio = p.classe.prioridade;

    return documento([
      par("DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA - DFD", { bold: true, align: D.AlignmentType.CENTER, depois: 240 }),
      tabela(
        [
          [faixa("INTRODUÇÃO", 2)],
          [
            cel(
              "De acordo com o inciso IV do art. 2º do Decreto nº 10.947, de 25 de janeiro de 2022, o Documento de Formalização de Demanda (DFD) é o documento que fundamenta o plano de contratações anual, em que a área requisitante evidencia e detalha a necessidade de contratação.\nAdicionalmente, o art. 8º do Decreto nº 10.947, de 2022, e a IN SEGES/ME nº 58, de 08 de agosto de 2022, especificam as informações mínimas requeridas ao preenchimento do DFD no Sistema de Planejamento e Gerenciamento de Contratações (PGC), as quais serão detalhadas nos tópicos a seguir.",
              { span: 2 }
            ),
          ],
          [faixa("PREENCHIMENTO PELA ÁREA REQUISITANTE", 2)],
          [faixa("INFORMAÇÕES GERAIS", 2)],
          [cel("Data prevista para conclusão do processo", { bold: true, w: w2[0] }), cel(dataCurta(maisDias(hoje, 90)), { w: w2[1] })],
          [cel("Descrição sucinta do objeto", { bold: true }), cel(t.descricao_sucinta)],
          [
            cel("Grau de prioridade da compra ou da contratação", { bold: true }),
            cel([par(prio, { bold: true, depois: 60 }), ...pars(t.justificativa_prioridade, { recuo: false })]),
          ],
        ],
        w2
      ),
      espaco(),
      tabela(
        [
          [faixa("JUSTIFICATIVA DA NECESSIDADE DA CONTRATAÇÃO")],
          [cel([...pars(t.justificativa_necessidade, { recuo: true })])],
          [cel("Indicação de vinculação ou dependência com o objeto de outro documento de formalização de demanda.", { bold: true })],
          [cel(t.vinculacao)],
        ],
        [LARGURA]
      ),
      espaco(),
      tabela([[faixa("MATERIAIS/SERVIÇOS")]], [LARGURA]),
      tabelaItens(p, false),
      espaco(),
      tabela(
        [
          [faixa("PREENCHIMENTO PELA ÁREA REQUISITANTE", 4)],
          [faixa("IDENTIFICAÇÃO DA ÁREA REQUISITANTE", 4)],
          [cel(`Área Requisitante (Unidade/Setor/Depto): ${area}`, { span: 4 })],
          [
            cel(`Responsável pela demanda: ${nomeComPosto(chefe)}`, { span: 2 }),
            cel(`Matrícula/SARAM: ${chefe.saram || "[SARAM]"}`, { span: 2 }),
          ],
          [cel(`E-mail: ${chefe.email || "[e-mail]"}`, { span: 2 }), cel(`Telefone: ${chefe.telefone || "[telefone]"}`, { span: 2 })],
        ],
        w4
      ),
      espaco(),
      tabela(
        [
          [faixa("IDENTIFICAÇÃO E CIÊNCIA DO INTEGRANTE REQUISITANTE", 4)],
          [cel(`Nome: ${nomeComPosto(p.perfil)}`, { span: 2 }), cel(`Matrícula/SARAM: ${p.perfil.saram || "[SARAM]"}`, { span: 2 })],
          [cel(`Cargo: ${p.perfil.cargo || "[cargo]"}`, { span: 2 }), cel("Lotação:", { span: 2 })],
          [cel(`E-mail: ${p.perfil.email || "[e-mail]"}`, { span: 2 }), cel(`Telefone: ${p.perfil.telefone || "[telefone]"}`, { span: 2 })],
          [
            cel(
              [
                par(
                  "Por este instrumento declaro ter ciência das competências do INTEGRANTE REQUISITANTE definidas no art. 18, § 1º, da Lei nº 14.133, de 01 de abril de 2021, e na IN SEGES/ME nº 58, de 08 de agosto de 2022, bem como da minha indicação para exercer esse papel na equipe de Planejamento da Contratação de que trata este documento."
                ),
                par(`${global.CONFIG.ORGAO.cidade}, ${dataExtenso(hoje)}.`, { align: D.AlignmentType.CENTER, antes: 240 }),
                par("______________________________", { align: D.AlignmentType.CENTER, antes: 360, depois: 0 }),
                par(nomeComPosto(p.perfil), { align: D.AlignmentType.CENTER }),
              ],
              { span: 4 }
            ),
          ],
        ],
        w4
      ),
    ]);
  }

  // ---------- 2. Termo de Justificativa ----------
  function justificativa(p, t) {
    const tipo = p.classe.natureza === "permanente" ? "MATERIAL PERMANENTE" : "MATERIAL DE CONSUMO";
    const L = "ABCDEFGHIJ";
    let i = 0;
    const s = (nome) => secao(`${L[i++]}) ${nome}:`);
    const filhos = [...cabecalho(), titulo(`TERMO DE JUSTIFICATIVA PARA AQUISIÇÃO DE ${tipo}`)];

    filhos.push(s("OBJETO DA AQUISIÇÃO"), ...pars(t.objeto));
    if (p.classe.indicaMarca && t.especificacoes_exclusivas) filhos.push(s("ESPECIFICAÇÕES EXCLUSIVAS"), ...pars(t.especificacoes_exclusivas));
    filhos.push(s("JUSTIFICATIVA/MOTIVAÇÃO DA AQUISIÇÃO"), ...pars(t.motivacao));
    if (SRP(p) && t.beneficios_srp)
      filhos.push(s("BENEFÍCIOS DIRETOS E INDIRETOS QUE RESULTARÃO DO PROCESSO DE REGISTRO DE PREÇOS"), ...pars(t.beneficios_srp));
    filhos.push(s("METODOLOGIA UTILIZADA PARA DEFINIÇÃO DOS QUANTITATIVOS A SEREM ADQUIRIDOS"), ...pars(t.metodologia_quantitativos));
    filhos.push(tabelaItens(p, false), espaco());
    filhos.push(s("CONEXÃO ENTRE A AQUISIÇÃO E O PLANEJAMENTO EXISTENTE"), ...pars(t.conexao_planejamento));
    filhos.push(
      s("CRITÉRIOS AMBIENTAIS ADOTADOS"),
      par(
        "Os fornecedores dos materiais deverão, em seu processo de produção ou aquisição, adotar, no que couber, as práticas de sustentabilidade ambiental previstas no art. 11, inciso IV, da Lei nº 14.133, de 01 de abril de 2021, no Decreto nº 7.746, de 05 de junho de 2012 (com redação dada pelo Decreto nº 9.178, de 23 de outubro de 2017), e na Lei nº 12.305, de 02 de agosto de 2010 (Política Nacional de Resíduos Sólidos), em especial ao art. 7º, observando-se:",
        { recuo: true }
      ),
      par("- que sejam observados os requisitos ambientais para a obtenção de certificação do Instituto Nacional de Metrologia, Qualidade e Tecnologia – INMETRO como produtos sustentáveis ou de menor impacto ambiental em relação aos seus similares;", { esquerda: 709 }),
      par("- que os bens devam ser, preferencialmente, acondicionados em embalagem individual adequada, com o menor volume possível, que utilize materiais recicláveis, de forma a garantir a máxima proteção durante o transporte e o armazenamento; e", { esquerda: 709 }),
      par("- que os bens não contenham substâncias perigosas em concentração acima da recomendada na diretiva RoHS (Restriction of Certain Hazardous Substances), tais como mercúrio (Hg), chumbo (Pb), cromo hexavalente (Cr(VI)), cádmio (Cd), bifenil-polibromados (PBBs) e éteres difenil-polibromados (PBDEs).", { esquerda: 709 }),
      s("NATUREZA DO OBJETO"),
      par(
        "Os bens a serem adquiridos enquadram-se na classificação de bens comuns, ou seja, aqueles cujo padrão de desempenho e qualidade possa ser aferido sem a necessidade de investigações pormenorizadas, possibilitando ao pregoeiro decidir com relativa facilidade acerca da aceitabilidade da proposta, atualmente entendidos como aqueles encontrados facilmente no mercado.",
        { recuo: true }
      ),
      s("REFERÊNCIA A ESTUDOS PRELIMINARES"),
      par(
        DISPENSA(p)
          ? "Em se tratando de Dispensa de Licitação enquadrada no inciso II do art. 75 da Lei nº 14.133/2021, e atendendo ao disposto no § 3º do art. 75 da mesma lei, foi elaborado o “Aviso de Dispensa Eletrônica” para servir de auxílio à fase de Gestão do Contrato a ser firmado."
          : "Foi elaborado, conforme Instrução Normativa SEGES/ME nº 58, de 08 de agosto de 2022, o documento normativo “Estudo Técnico Preliminar”, o qual serviu de base para a confecção do supramencionado Termo de Justificativa.",
        { recuo: true }
      ),
      ...assinatura(nomeComPosto(p.perfil).toUpperCase(), p.perfil.cargo || "Integrante Requisitante")
    );
    return documento(filhos);
  }

  // ---------- 3. ETP ----------
  function etp(p, t1, t2) {
    const area = p.perfil.area || p.perfil.setor || p.requisitante.setor || "[Área requisitante]";
    const chefe = p.perfil.chefe || {};
    const w2 = [2400, LARGURA - 2400];
    const total = p.itens.reduce((s, i) => s + (i.quantidade || 0) * (i.valor_unitario_estimado || 0), 0);
    const reqs = (t1.requisitos || []).flatMap((r, k) => [
      tabela(
        [
          [cel(`Requisito ${k + 1}`, { bold: true, fundo: "D9D9D9", w: w2[0] }), cel(r.requisito, { w: w2[1] })],
          [cel("Justificativa Técnica", { bold: true }), cel(r.justificativa)],
          [cel("Base Legal", { bold: true }), cel(r.base_legal)],
        ],
        w2
      ),
      espaco(),
    ]);

    const filhos = [
      ...cabecalho(),
      titulo("ESTUDO TÉCNICO PRELIMINAR DIGITAL"),
      secao("INFORMAÇÕES BÁSICAS"),
      par(`Número do Processo: 67215.[XXXXXX]/${(p.data || new Date()).getFullYear()}-[XX]`),
      secao("OBJETO DA AQUISIÇÃO:"),
      ...pars(t1.objeto),
      secao("DESCRIÇÃO DA NECESSIDADE:"),
      ...pars(t1.descricao_necessidade),
      par("Dessa forma, a solução se caracteriza conforme quadro a seguir:", { recuo: true }),
      tabela(
        [
          [cel("Objeto", { bold: true, w: w2[0] }), cel(t1.quadro_objeto, { w: w2[1] })],
          [cel("Motivo", { bold: true }), cel(t1.quadro_motivo)],
          [cel("Finalidade", { bold: true }), cel(t1.quadro_finalidade)],
          [cel("Setor Interessado", { bold: true }), cel(area)],
          [cel("Quantidades", { bold: true }), cel("Conforme quadro do item “Estimativa das quantidades a serem contratadas” e Termo de Referência, inclusive com itens que beneficiam EPP e ME.")],
          [cel("Prazo inicial da vigência", { bold: true }), cel(t1.quadro_vigencia)],
          [
            cel("Alinhamento aos instrumentos de planejamento", { bold: true }),
            cel("Esta aquisição está devidamente registrada no Sistema de Planejamento e Gerenciamento de Contratações (PGC), vinculada à DFD [nº DFD], no Planejamento Anual de Aquisições e Contratações (PAAC), sob o código [código PAAC], e alinhada com as disposições do Plano de Logística Sustentável (PLS) da COMARA."),
          ],
        ],
        w2
      ),
      secao("ÁREA REQUISITANTE:"),
      par(`Área requisitante: ${area}.`, { depois: 0 }),
      par(`Responsável: ${nomeComPosto(chefe)}${chefe.cargo ? " – " + chefe.cargo : ""}.`),
      secao("DESCRIÇÃO DOS REQUISITOS DA CONTRATAÇÃO:"),
      par("Requisitos necessários ao atendimento da necessidade da COMARA:", { recuo: true }),
      ...reqs,
      secao("LEVANTAMENTO DE MERCADO:"),
      ...pars(t2.levantamento_mercado),
      par("Parâmetros da pesquisa de preços", { bold: true, antes: 120 }),
      ...pars(t2.parametros_pesquisa_precos),
      secao("DESCRIÇÃO DA SOLUÇÃO COMO UM TODO:"),
      ...pars(t2.descricao_solucao),
      secao("ESTIMATIVA DAS QUANTIDADES A SEREM CONTRATADAS:"),
      ...pars(t2.estimativa_quantidades),
      par("Dessa forma, foram definidos os quantitativos de acordo com o quadro abaixo:", { recuo: true }),
      tabelaItens(p, false),
      secao("ESTIMATIVA DO VALOR DA CONTRATAÇÃO:"),
      par(`Valor estimado (R$): ${brl(total)} [valor preliminar – substituir pelo resultado da pesquisa de preços].`),
      par(
        SRP(p) || p.classe.modalidade === "pregao"
          ? "O custo estimado da contratação será tornado público apenas e imediatamente após o encerramento do envio de lances."
          : `O custo estimado da contratação é de ${brl(total)}, conforme pesquisa de preços anexa.`,
        { recuo: true }
      ),
      secao("JUSTIFICATIVA PARA O PARCELAMENTO OU NÃO DA SOLUÇÃO:"),
      ...pars(t2.parcelamento),
      secao("CONTRATAÇÕES CORRELATAS E/OU INTERDEPENDENTES:"),
      ...pars(t2.contratacoes_correlatas),
      secao("ALINHAMENTO ENTRE A CONTRATAÇÃO E O PLANEJAMENTO:"),
      ...pars(t2.alinhamento_planejamento),
      secao("BENEFÍCIOS A SEREM ALCANÇADOS COM A CONTRATAÇÃO:"),
      ...pars(t2.beneficios),
      secao("PROVIDÊNCIAS A SEREM ADOTADAS:"),
      par(
        "A Administração tomará todas as providências, previamente e durante a celebração do contrato, inclusive quanto à capacitação de servidores para fiscalização e gestão contratual ou adequação do ambiente da organização, com a devida comissão publicada em Boletim Interno.",
        { recuo: true }
      ),
      par(
        "Após o recebimento do material, haverá verificação de adequação de Nota Fiscal e Nota de Empenho por parte da comissão de recebimento para realização de pagamento.",
        { recuo: true }
      ),
      secao("POSSÍVEIS IMPACTOS AMBIENTAIS:"),
      par(
        "O fornecedor dos materiais deverá, em seu processo de produção ou aquisição, adotar, no que couber, as práticas de sustentabilidade ambiental dispostas na Lei nº 12.305, de 02 de agosto de 2010, em especial ao art. 7º, e no Decreto nº 7.746, de 05 de junho de 2012, no que tange a: observar os requisitos ambientais para a obtenção de certificação do INMETRO como produtos sustentáveis ou de menor impacto ambiental; acondicionar os bens, preferencialmente, em embalagem individual adequada, com o menor volume possível e materiais recicláveis; e não fornecer bens que contenham substâncias perigosas em concentração acima da recomendada na diretiva RoHS.",
        { recuo: true }
      ),
      secao("DECLARAÇÃO DE VIABILIDADE:"),
      ...pars(t2.declaracao_viabilidade),
      secao("RESPONSÁVEIS:"),
    ];

    [p.perfil, chefe].forEach((r) => {
      filhos.push(
        par("CPF: [CPF]", { depois: 0, antes: 120 }),
        par(`Nome: ${nomeComPosto(r)}`, { depois: 0 }),
        par(`Cargo/Função: ${r.cargo || "[cargo/função]"}`, { depois: 0 }),
        par(`E-mail Zimbra FAB: ${r.email || "[e-mail]"}`)
      );
    });
    return documento(filhos);
  }

  // ---------- 4. Planilha (justificativa dos quantitativos + pesquisa de preços) ----------
  async function planilha(p) {
    const wb = new global.ExcelJS.Workbook();
    wb.creator = "DEAO Processos";
    const borda = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    const cinza = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };
    const amarelo = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };

    // Aba 1 — segue o modelo "e - Justificativa dos quantitativos".
    const a = wb.addWorksheet("Justificativa Quantitativos");
    a.columns = [{ width: 6 }, { width: 70 }, { width: 16 }, { width: 14 }, { width: 70 }];
    a.addRow(["Unidade", `${global.CONFIG.ORGAO.sigla} – ${p.perfil.setor || p.requisitante.setor || ""}`]);
    a.addRow(["Exercício", p.exercicio]);
    a.addRow([`Processo: ${p.objeto_curto}`]);
    a.mergeCells("A3:E3");
    a.getCell("A3").font = { bold: true, size: 12 };
    a.addRow([]);
    const cab = a.addRow(["Nº", "Item", "Unidade de distribuição", `Qtd solicitada para ${p.exercicio}`, "Justificativa para o quantitativo planejado"]);
    cab.eachCell((c) => {
      c.font = { bold: true };
      c.fill = cinza;
      c.border = borda;
      c.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
    });
    p.itens.forEach((it, k) => {
      const r = a.addRow([k + 1, it.especificacao || it.descricao, it.unidade, it.quantidade, it.justificativa_quantidade || ""]);
      r.eachCell((c) => {
        c.border = borda;
        c.alignment = { wrapText: true, vertical: "top" };
      });
    });

    // Aba 2 — mapa de pesquisa de preços (IN 65/2021) para preencher.
    const b = wb.addWorksheet("Pesquisa de Preços");
    b.columns = [
      { width: 6 }, { width: 50 }, { width: 12 }, { width: 10 },
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 },
      { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 18 },
    ];
    b.addRow([`MAPA DE PESQUISA DE PREÇOS – ${p.objeto_curto}`]);
    b.mergeCells("A1:M1");
    b.getCell("A1").font = { bold: true, size: 12 };
    b.addRow(["Fontes (art. 5º da IN SEGES/ME nº 65/2021): Painel de Preços, contratações similares, mídia especializada, fornecedores (até 6 meses), notas fiscais eletrônicas. Mínimo de 3 preços por item."]);
    b.mergeCells("A2:M2");
    b.getCell("A2").alignment = { wrapText: true };
    b.getRow(2).height = 30;
    b.addRow([]);
    const cb = b.addRow([
      "Item", "Descrição", "Unidade", "Qtde.",
      "Painel de Preços", "Fornecedor 1", "Fornecedor 2", "Fornecedor 3",
      "Média", "Mediana", "Menor", "Valor adotado (un.)", "Valor total",
    ]);
    cb.eachCell((c) => {
      c.font = { bold: true };
      c.fill = cinza;
      c.border = borda;
      c.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
    });
    const ini = b.rowCount + 1;
    p.itens.forEach((it, k) => {
      const n = b.rowCount + 1;
      const r = b.addRow([
        k + 1, it.especificacao || it.descricao, it.unidade, it.quantidade,
        null, null, null, null,
        { formula: `IFERROR(AVERAGE(E${n}:H${n}),"")` },
        { formula: `IFERROR(MEDIAN(E${n}:H${n}),"")` },
        { formula: `IFERROR(MIN(E${n}:H${n}),"")` },
        { formula: `IF(COUNT(E${n}:H${n})>=3,J${n},"")` },
        { formula: `IF(L${n}="","",L${n}*D${n})` },
      ]);
      r.eachCell({ includeEmpty: true }, (c, col) => {
        c.border = borda;
        c.alignment = { wrapText: true, vertical: "top" };
        if (col >= 5 && col <= 8) c.fill = amarelo;
        if (col >= 5) c.numFmt = '"R$" #,##0.00';
      });
    });
    const fim = b.rowCount;
    const tot = b.addRow(["", "VALOR TOTAL ESTIMADO", "", "", "", "", "", "", "", "", "", "", { formula: `SUM(M${ini}:M${fim})` }]);
    tot.font = { bold: true };
    tot.getCell(13).numFmt = '"R$" #,##0.00';
    b.addRow([]);
    b.addRow(["", "Critério adotado: mediana (art. 6º da IN 65/2021). Células amarelas: preencher com as cotações obtidas."]);
    b.addRow([]);
    const ref = b.addRow(["", "Referência preliminar gerada por IA (NÃO substitui a pesquisa de preços):"]);
    ref.font = { italic: true, color: { argb: "FF7F7F7F" } };
    p.itens.forEach((it, k) => {
      const r = b.addRow([k + 1, it.descricao, it.unidade, it.quantidade, "", "", "", "", "", "", "", it.valor_unitario_estimado || 0, (it.valor_unitario_estimado || 0) * (it.quantidade || 0)]);
      r.font = { italic: true, color: { argb: "FF7F7F7F" } };
      r.getCell(12).numFmt = '"R$" #,##0.00';
      r.getCell(13).numFmt = '"R$" #,##0.00';
    });
    return wb.xlsx.writeBuffer();
  }

  // Lista dos arquivos a gerar para o processo, na ordem do ofício.
  function listaArquivos(p, textos) {
    let slug = (p.objeto_curto || "processo")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w]+/g, "_")
      .replace(/^_|_$/g, "");
    if (slug.length > 60) slug = slug.slice(0, 60).replace(/_[^_]*$/, ""); // corta em fim de palavra
    const arqs = [
      { nome: `00_Oficio_Solicitacao_PAMS_${slug}.docx`, titulo: "Ofício de solicitação de PAM/S", doc: () => oficio(p) },
      { nome: `01_DFD_${slug}.docx`, titulo: "Documento de Formalização da Demanda (DFD)", doc: () => dfd(p, textos.dfd) },
      { nome: `02_Termo_de_Justificativa_${slug}.docx`, titulo: "Termo de Justificativa", doc: () => justificativa(p, textos.justificativa) },
      {
        nome: `03_ETP_${slug}.docx`,
        titulo: DISPENSA(p) ? "Estudo Técnico Preliminar (facultado na dispensa)" : "Estudo Técnico Preliminar (ETP)",
        doc: () => etp(p, textos.etp1, textos.etp2),
      },
      {
        nome: `04_Quantitativos_e_Pesquisa_de_Precos_${slug}.xlsx`,
        titulo: "Justificativa dos quantitativos + mapa de pesquisa de preços",
        xlsx: () => planilha(p),
      },
    ];
    return arqs;
  }

  async function gerarBlob(arq) {
    if (arq.xlsx) {
      const buf = await arq.xlsx();
      return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    }
    return D.Packer.toBlob(arq.doc());
  }

  global.Docs = { oficio, dfd, justificativa, etp, planilha, listaArquivos, gerarBlob, brl };
})(typeof window !== "undefined" ? window : globalThis);
