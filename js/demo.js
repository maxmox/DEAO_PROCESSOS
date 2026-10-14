// Modo demonstração: respostas pré-redigidas para o pedido de exemplo (tintas),
// usadas quando o worker ainda não tem a rota /claude ou quando se quer ver o fluxo sem gastar.
// Os tokens são ESTIMADOS (≈ 4 caracteres por token) e aparecem marcados como simulados.
(function () {
  const PEDIDO_EXEMPLO =
    "Eu sou 1T ° Maximiliano Cavalcante Dias Souza , Trabalho na sessão de obras da comara , preciso fazer aquisição de tinta branca , preta, vermelha , amarela, verde  para realização reparos predias no predio da comara , as quantidfades são de 50 Latas de cada , a aquisição deve ser para 2027 , sendo que o processo deva estar pronto o quanto antes a entrega do material deve ser aqui em belém na sede da comara.";

  const espec = (cor, extra) =>
    `TINTA ACRÍLICA PREMIUM, BASE ÁGUA, ACABAMENTO FOSCO, COR ${cor}${extra || ""}, PARA SUPERFÍCIES INTERNAS E EXTERNAS DE ALVENARIA, REBOCO E CONCRETO, ALTO RENDIMENTO E RESISTÊNCIA A INTEMPÉRIES, ANTIMOFO, BAIXO ODOR, ATENDENDO AOS REQUISITOS DE DESEMPENHO DA ABNT NBR 15079 E À NORMA DE DESEMPENHO DO PROGRAMA SETORIAL DA QUALIDADE (PSQ) DE TINTAS IMOBILIÁRIAS. EMBALAGEM: LATA COM 18 LITROS, LACRADA, COM IDENTIFICAÇÃO DO FABRICANTE, LOTE E DATA DE VALIDADE MÍNIMA DE 12 MESES NA ENTREGA.`;

  const extracao = {
    requisitante: { nome: "Maximiliano Cavalcante Dias Souza", posto: "1º Ten", setor: "Seção de Apoio às Obras", sigla_setor: "DEAO" },
    objeto_curto: "Tintas acrílicas para reparos prediais da Sede – 2027",
    finalidade: "a execução de serviços de reparo e manutenção predial no edifício da Sede da COMARA",
    local_entrega: "Sede da COMARA – Av. Pedro Álvares Cabral, 7115, CEP 66.613-150, Belém/PA",
    exercicio: "2027",
    urgencia: "o processo deve estar concluído o quanto antes, para garantir a disponibilidade do material no início do exercício de 2027",
    itens: [
      { descricao: "Tinta acrílica premium – branca", especificacao: espec("BRANCA"), unidade: "Lata 18 L", quantidade: 50, valor_unitario_estimado: 420, justificativa_quantidade: "Cor predominante das fachadas e ambientes internos da Sede; considera rendimento médio de 250 m²/lata/demão e duas demãos nas áreas com degradação levantadas pela seção." },
      { descricao: "Tinta acrílica premium – preta", especificacao: espec("PRETA"), unidade: "Lata 18 L", quantidade: 50, valor_unitario_estimado: 480, justificativa_quantidade: "Aplicação em rodapés, barrados, faixas e elementos de contraste de sinalização; quantitativo padronizado com as demais cores de acabamento." },
      { descricao: "Tinta acrílica premium – vermelha", especificacao: espec("VERMELHA", " (VERMELHO SEGURANÇA, PADRÃO NR-26)"), unidade: "Lata 18 L", quantidade: 50, valor_unitario_estimado: 480, justificativa_quantidade: "Demarcação de áreas de equipamentos de combate a incêndio e elementos de identidade visual, conforme NR-26." },
      { descricao: "Tinta acrílica premium – amarela", especificacao: espec("AMARELA", " (AMARELO SEGURANÇA, PADRÃO NR-26)"), unidade: "Lata 18 L", quantidade: 50, valor_unitario_estimado: 480, justificativa_quantidade: "Sinalização de atenção em degraus, desníveis, faixas de circulação e áreas de risco, conforme NR-26." },
      { descricao: "Tinta acrílica premium – verde", especificacao: espec("VERDE", " (VERDE SEGURANÇA, PADRÃO NR-26)"), unidade: "Lata 18 L", quantidade: 50, valor_unitario_estimado: 480, justificativa_quantidade: "Identificação de rotas de fuga, equipamentos de segurança e elementos de identidade visual da Organização." },
    ],
  };

  const textos = {
    dfd: {
      descricao_sucinta:
        "Aquisição de tintas acrílicas premium nas cores branca, preta, vermelha, amarela e verde, em latas de 18 litros, totalizando 250 (duzentas e cinquenta) latas, destinadas à execução de serviços de reparo e manutenção predial no edifício da Sede da Comissão de Aeroportos da Região Amazônica – COMARA, em Belém/PA, no exercício de 2027.",
      justificativa_prioridade:
        "A contratação possui grau de prioridade alto, pois o processo precisa estar concluído com antecedência suficiente para que o material esteja disponível no início do exercício de 2027. As edificações da Sede estão submetidas ao clima equatorial úmido de Belém, com elevada pluviosidade, umidade e insolação, o que acelera a degradação dos revestimentos. A postergação dos reparos favorece a proliferação de fungos, infiltrações e o desgaste do substrato, elevando o custo das futuras intervenções e comprometendo a conservação do patrimônio público e a sinalização de segurança das instalações.",
      justificativa_necessidade:
        "A Seção de Apoio às Obras (DEAO) identificou a necessidade de recuperar a pintura de áreas do edifício da Sede da COMARA que apresentam desgaste, descascamento, manchas de umidade e proliferação de fungos, bem como de renovar as faixas e demarcações de segurança nas cores padronizadas pela NR-26.\n\nO problema decorre da ação contínua do clima amazônico sobre as superfícies de alvenaria e concreto, que reduz a vida útil dos revestimentos e exige manutenção periódica. A ausência de material para essas intervenções implica a deterioração progressiva das instalações, prejuízo à imagem institucional e riscos à segurança dos usuários, em especial pela perda de visibilidade das sinalizações de atenção, combate a incêndio e rotas de fuga.\n\nPretende-se, com a aquisição, dispor do insumo necessário para que as equipes da COMARA executem os reparos prediais ao longo de 2027 de forma planejada. Os quantitativos de 50 (cinquenta) latas de 18 litros por cor foram definidos pela área técnica considerando as áreas a recuperar, a aplicação de duas demãos e o rendimento médio de tintas acrílicas premium, cabendo à equipe de planejamento anexar a memória de cálculo com o levantamento das áreas [anexar levantamento de áreas].",
      vinculacao: "Não há dependência com o objeto de outro documento de formalização de demanda para a sua execução.",
    },
    justificativa: {
      objeto:
        "O objeto do presente processo é o Registro de Preços para eventual aquisição de material de consumo do tipo tintas acrílicas premium para alvenaria, nas cores branca, preta, vermelha, amarela e verde, em latas de 18 litros, destinadas à manutenção e ao reparo predial do edifício da Sede da Comissão de Aeroportos da Região Amazônica – COMARA, em Belém/PA, no exercício de 2027, e se justifica de acordo com as informações dispostas a seguir.",
      especificacoes_exclusivas: "",
      motivacao:
        "A necessidade da aquisição decorre do desgaste natural da pintura do edifício da Sede da COMARA, agravado pelas condições climáticas de Belém/PA, caracterizadas por alta umidade relativa do ar, chuvas frequentes e forte insolação. Tais condições provocam descascamento, manchas, proliferação de fungos e perda de aderência dos revestimentos, exigindo intervenções periódicas para preservar o substrato e evitar danos de maior custo, como infiltrações e degradação do reboco.\n\nAlém do aspecto de conservação, as cores vermelha, amarela e verde atendem à padronização das cores de segurança prevista na Norma Regulamentadora nº 26, empregadas na demarcação de equipamentos de combate a incêndio, de áreas de atenção e de rotas de fuga, enquanto as cores branca e preta compõem o acabamento das superfícies e os elementos de contraste. A manutenção dessas sinalizações em condições adequadas de visibilidade é medida de segurança do trabalho e de proteção dos usuários das instalações.\n\nDo ponto de vista jurídico, a aquisição atende ao dever de planejamento e de conservação do patrimônio público, em observância aos princípios da eficiência e da economicidade previstos no art. 5º da Lei nº 14.133/2021, e à descrição da necessidade exigida pelo inciso I do § 1º do art. 18 da mesma Lei.",
      beneficios_srp:
        "A adoção do Sistema de Registro de Preços fundamenta-se no art. 82 da Lei nº 14.133/2021 e no art. 3º do Decreto nº 11.462/2023, por verificar-se que a execução dos reparos prediais ocorrerá de forma escalonada ao longo de 2027, conforme a programação das frentes de serviço, sendo conveniente a entrega parcelada do material. O SRP permite à Administração adquirir as tintas à medida da necessidade, reduzindo o volume estocado no almoxarifado e o risco de perda por vencimento do prazo de validade do produto.\n\nAdicionalmente, o registro de preços confere flexibilidade para ajustar as quantidades efetivamente adquiridas à evolução dos serviços, sem obrigação de contratação integral, assegurando maior controle do gasto público e a seleção da proposta mais vantajosa, em observância aos princípios da legalidade, eficiência e economicidade.",
      metodologia_quantitativos:
        "Para a definição dos quantitativos estimados, tomou-se o cuidado de não incluir condições que comprometam, restrinjam ou frustrem o caráter competitivo do certame. A estimativa partiu do levantamento, pela Seção de Apoio às Obras, das superfícies do edifício da Sede que necessitam de repintura e das faixas e demarcações de segurança a renovar no exercício de 2027.\n\nConsiderou-se o rendimento médio de referência das tintas acrílicas premium, da ordem de 200 a 250 m² por lata de 18 litros por demão, e a aplicação de duas demãos sobre superfícies previamente preparadas. Com base nesses parâmetros e na distribuição das áreas por cor, a área técnica fixou o quantitativo de 50 (cinquenta) latas para cada uma das cinco cores, totalizando 250 (duzentas e cinquenta) latas, incluída margem para retoques e perdas inerentes à aplicação [anexar memória de cálculo com as áreas levantadas por cor].\n\nRessalta-se que, por se tratar de registro de preços, os quantitativos possuem caráter estimativo, servindo de parâmetro para a formação do valor da contratação, e as aquisições ocorrerão conforme a demanda efetiva da Administração.",
      conexao_planejamento:
        "A presente aquisição encontra-se alinhada ao planejamento institucional da COMARA, devendo constar do Plano de Contratações Anual (PCA) e do Sistema de Planejamento e Gerenciamento de Contratações (PGC) referentes ao exercício de 2027, sob o código [informar código PGC/PCA].\n\nA demanda decorre de necessidade previamente identificada pela área técnica no planejamento das atividades de manutenção predial da Sede, não se caracterizando como demanda emergencial ou superveniente, mas como ação planejada e estruturada, em observância aos princípios do planejamento, da eficiência e da economicidade.",
    },
    etp1: {
      objeto:
        "O objeto do presente processo é o Registro de Preços para eventual aquisição de material de consumo do tipo tintas acrílicas premium, nas cores branca, preta, vermelha, amarela e verde, em latas de 18 litros, destinadas à manutenção e ao reparo predial do edifício da Sede da Comissão de Aeroportos da Região Amazônica – COMARA, em Belém/PA, e se justifica de acordo com as informações dispostas a seguir.",
      descricao_necessidade:
        "A COMARA, organização integrante do Comando da Aeronáutica, tem por missão projetar, construir, ampliar e recuperar a infraestrutura aeroportuária na região amazônica. Para o cumprimento dessa missão, é indispensável que as instalações da Sede, em Belém/PA, que abrigam as atividades administrativas, técnicas e de apoio, sejam mantidas em adequadas condições de conservação, funcionalidade e segurança.\n\nO edifício da Sede está exposto ao clima equatorial úmido, com elevada umidade relativa do ar, chuvas intensas e forte radiação solar durante todo o ano. Essas condições aceleram a degradação das pinturas, ocasionando descascamento, manchas, proliferação de fungos e perda de proteção das superfícies de alvenaria e concreto, o que, se não corrigido, evolui para infiltrações e danos ao substrato.\n\nAlém da conservação das superfícies, há necessidade de renovar a sinalização de segurança das instalações, cujas cores padronizadas pela NR-26 (vermelho para equipamentos de combate a incêndio, amarelo para atenção e verde para segurança e rotas de fuga) perdem visibilidade com o tempo.\n\nA Seção de Apoio às Obras levantou, assim, a necessidade de 50 (cinquenta) latas de 18 litros de cada uma das cinco cores, a serem empregadas pelas equipes da COMARA nos reparos prediais programados para o exercício de 2027, com entrega na Sede, em Belém/PA.",
      quadro_objeto:
        "Registro de Preços para eventual aquisição de tintas acrílicas premium (branca, preta, vermelha, amarela e verde), em latas de 18 litros, para a Comissão de Aeroportos da Região Amazônica – COMARA.",
      quadro_motivo:
        "Recuperar a pintura e a sinalização de segurança do edifício da Sede, degradadas pela ação do clima amazônico, preservando o patrimônio público e a segurança dos usuários.",
      quadro_finalidade:
        "Disponibilizar o insumo necessário à execução, pelas equipes da COMARA, dos serviços de reparo e manutenção predial programados para o exercício de 2027.",
      quadro_vigencia:
        "A vigência da Ata de Registro de Preços decorrente da licitação será de um ano, contado do primeiro dia útil subsequente à data de divulgação no PNCP, podendo ser prorrogada por igual período, desde que comprovado que o preço é vantajoso, nos termos do art. 84 da Lei nº 14.133/2021 c/c art. 22 do Decreto nº 11.462/2023.",
      requisitos: [
        {
          requisito: "Especificação e desempenho: tinta acrílica premium, base água, acabamento fosco, com propriedades antimofo e resistência a intempéries, em latas de 18 litros, conforme descrição dos itens.",
          justificativa: "Garantir durabilidade e rendimento compatíveis com a exposição ao clima úmido de Belém/PA, reduzindo a frequência de repintura e o custo de manutenção ao longo do ciclo de vida.",
          base_legal: "Art. 40, § 1º, inciso I, da Lei nº 14.133/2021; ABNT NBR 15079 (requisitos de desempenho de tintas para edificações não industriais).",
        },
        {
          requisito: "Cores de segurança: as cores vermelha, amarela e verde deverão corresponder aos padrões de cores de segurança.",
          justificativa: "As tintas serão empregadas na demarcação de equipamentos de combate a incêndio, áreas de atenção e rotas de fuga, devendo assegurar a correta identificação visual.",
          base_legal: "Norma Regulamentadora nº 26 (Sinalização de Segurança); ABNT NBR 7195 (cores para segurança).",
        },
        {
          requisito: "Validade e embalagem: produto com prazo de validade mínimo de 12 meses na data da entrega, em embalagem original lacrada com identificação do fabricante, lote e data de fabricação.",
          justificativa: "Assegurar a integridade do produto durante o armazenamento e a execução parcelada dos serviços ao longo do exercício.",
          base_legal: "Art. 40, § 1º, inciso I, da Lei nº 14.133/2021; Lei nº 8.078/1990 (Código de Defesa do Consumidor), art. 31.",
        },
        {
          requisito: "Local e prazo de entrega: entrega na Sede da COMARA, Av. Pedro Álvares Cabral, 7115, CEP 66.613-150, Belém/PA, em até 30 dias corridos após o recebimento da nota de empenho.",
          justificativa: "O material será aplicado pelas equipes sediadas em Belém/PA; a centralização da entrega no almoxarifado da Sede facilita o controle e o recebimento.",
          base_legal: "Art. 40, § 1º, inciso II, da Lei nº 14.133/2021.",
        },
        {
          requisito: "Recebimento: provisório no ato da entrega e definitivo em até 5 dias úteis, após verificação da conformidade com as especificações.",
          justificativa: "Permitir a conferência da quantidade, da cor, da validade e da integridade das embalagens antes do aceite definitivo.",
          base_legal: "Art. 140, inciso II, da Lei nº 14.133/2021.",
        },
        {
          requisito: "Sustentabilidade: produtos de base água, com baixo teor de compostos orgânicos voláteis (COV), sem metais pesados acima dos limites legais, em embalagens recicláveis.",
          justificativa: "Atendimento às normas ambientais e à promoção do desenvolvimento nacional sustentável, reduzindo impactos à saúde dos trabalhadores e ao meio ambiente.",
          base_legal: "Art. 11, inciso IV, da Lei nº 14.133/2021; Decreto nº 7.746/2012; Lei nº 12.305/2010.",
        },
      ],
    },
    etp2: {
      levantamento_mercado:
        "Com o objetivo de identificar as soluções disponíveis no mercado capazes de atender à necessidade desta Comissão, foram analisadas as alternativas de fornecimento de tintas para manutenção predial, considerando contratações similares de outros órgãos e a oferta de fabricantes e distribuidores.\n\nForam identificadas as seguintes alternativas: (i) aquisição de tintas acrílicas premium em embalagens de 18 litros; (ii) aquisição de tintas de linha standard ou econômica, de menor preço unitário, porém com menor rendimento, durabilidade e resistência à umidade; e (iii) contratação de serviço de pintura com fornecimento de material por empresa terceirizada.\n\nA alternativa (ii) mostra-se desvantajosa no clima amazônico, pois exige maior número de demãos e repinturas mais frequentes, elevando o custo total. A alternativa (iii) não se justifica, uma vez que a COMARA dispõe de equipes próprias habilitadas para a execução dos reparos. Optou-se, assim, pela alternativa (i), que oferece o melhor custo-benefício ao longo do ciclo de vida.\n\nO mercado nacional apresenta ampla oferta do produto, com diversos fabricantes certificados e distribuidores com atuação na região Norte, o que favorece a competitividade. Em consulta ao Portal de Compras do Governo Federal, foram identificados pregões que guardam semelhança com o objeto deste estudo, tais como: [Pregão nº / UASG] e [Pregão nº / UASG].",
      parametros_pesquisa_precos:
        "A estimativa de preços observará o art. 23 da Lei nº 14.133/2021 e o art. 5º da Instrução Normativa SEGES/ME nº 65/2021, priorizando os parâmetros do Painel de Preços (inciso I) e de contratações similares de outros entes públicos (inciso II), complementados, se necessário, por pesquisa em sítios eletrônicos especializados (inciso III) e por cotações formais junto a fornecedores realizadas em até 6 meses (inciso IV).\n\nO preço estimado de cada item será obtido pela mediana de, no mínimo, 3 (três) preços válidos, conforme mapa de pesquisa de preços anexo ao processo, desconsiderados os valores inexequíveis, inconsistentes ou excessivamente elevados.",
      descricao_solucao:
        "Após o levantamento de mercado, optou-se pela aquisição de tintas acrílicas premium nas cinco cores especificadas, em latas de 18 litros, considerando o melhor custo-benefício e o atendimento às necessidades apresentadas pela área requisitante. Adotou-se o princípio da padronização, previsto na alínea “a” do inciso V do art. 40 da Lei nº 14.133/2021, uniformizando linha, acabamento e embalagem.\n\nA solução definida é o Pregão Eletrônico, sob o regime de Sistema de Registro de Preços, com critério de julgamento de menor preço por item, o que permitirá aquisições parceladas conforme a programação dos reparos ao longo de 2027, sem a realização de licitações sucessivas para o mesmo objeto.\n\nNo que tange às condições de aquisição e pagamento, de que trata o art. 40, inciso I, da Lei nº 14.133/2021, a Administração observará, sempre que possível, condições semelhantes às do setor privado.",
      estimativa_quantidades:
        "A estimativa considerou o levantamento das superfícies do edifício da Sede a serem repintadas e das demarcações de segurança a renovar, a aplicação de duas demãos e o rendimento médio de referência de 200 a 250 m² por lata de 18 litros por demão, típico das tintas acrílicas premium.\n\nCom base nesses parâmetros, cada lote de 50 latas permite o recobrimento, em duas demãos, de aproximadamente 5.000 a 6.250 m² de superfície por cor, valor compatível com a dimensão das áreas a recuperar e com a margem necessária para retoques e perdas. Os quantitativos foram validados pela Seção de Apoio às Obras [anexar memória de cálculo com as áreas por cor].",
      parcelamento:
        "A solução será parcelada em itens, um para cada cor, com adjudicação por item, nos termos do art. 40, inciso V, alínea “b”, da Lei nº 14.133/2021. O parcelamento é técnica e economicamente viável, amplia a competitividade ao permitir a participação de fornecedores que não disponham de todas as cores e não acarreta perda de economia de escala, dado o quantitativo de cada item.",
      contratacoes_correlatas:
        "Não se faz necessária a realização de contratações correlatas e/ou interdependentes para que o objetivo desta contratação seja atingido, uma vez que os serviços de aplicação serão executados por equipes próprias da COMARA, que já dispõem das ferramentas e equipamentos necessários.",
      alinhamento_planejamento:
        "A contratação é necessária à continuidade das atividades de manutenção predial da COMARA e deverá constar do Sistema de Planejamento e Gerenciamento de Contratações (PGC) e do Plano de Contratações Anual (PCA) do exercício de 2027, sob o código [informar código PCA], caracterizando-se como aquisição de bens comuns.",
      beneficios:
        "Espera-se, com a contratação, a recuperação da pintura e da sinalização de segurança do edifício da Sede, a proteção das superfícies contra umidade e fungos, o prolongamento da vida útil das edificações e a melhoria das condições de trabalho e da imagem institucional da COMARA.\n\nA utilização de tintas de linha premium, com maior durabilidade, reduz a frequência de intervenções e o custo global de manutenção, e a renovação das cores de segurança contribui para a prevenção de acidentes e para a pronta identificação de equipamentos de emergência.",
      declaracao_viabilidade:
        "Diante dos fatos expostos neste Estudo Técnico Preliminar, tomando como diretriz a necessidade de prover tintas acrílicas para a manutenção predial da Sede da COMARA, e considerando o orçamento e as priorizações justificadas neste instrumento, esta equipe de planejamento declara viável esta contratação, consoante o inciso XIII do art. 9º da IN SEGES/ME nº 58, de 08 de agosto de 2022.",
    },
  };

  // Tokens estimados por etapa (aprox. 4 caracteres/token) para simular o custo.
  function usoEstimado(sistemaChars) {
    const tk = (s) => Math.round(String(s).length / 4);
    const sis = tk("x".repeat(sistemaChars));
    const out = {
      "1. Extração do pedido": tk(JSON.stringify(extracao)),
      "3a. DFD": tk(JSON.stringify(textos.dfd)),
      "3b. Termo de Justificativa": tk(JSON.stringify(textos.justificativa)),
      "3c. ETP — necessidade e requisitos": tk(JSON.stringify(textos.etp1)),
      "3d. ETP — mercado e solução": tk(JSON.stringify(textos.etp2)),
    };
    const casoIn = 700; // pedido + dados do caso + instruções da etapa
    const etapas = Object.keys(out);
    return etapas.map((e, i) => ({
      etapa: e + " (simulado)",
      input: casoIn,
      // 1ª chamada grava o cache do sistema; as demais leem do cache
      cacheWrite: i === 0 ? sis : 0,
      cacheRead: i === 0 ? 0 : sis,
      // saída inclui o raciocínio interno do modelo (~40% a mais, estimado)
      output: Math.round(out[e] * 1.4),
    }));
  }

  window.Demo = { PEDIDO_EXEMPLO, extracao, textos, usoEstimado };
})();
