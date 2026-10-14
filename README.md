# DEAO Processos

Protótipo de gerador de processos de aquisição da COMARA. A pessoa descreve em texto livre o que precisa comprar; o site extrai os dados, classifica o procedimento e redige a documentação no padrão dos modelos da Seção de Aquisição. Tudo sai pronto para baixar e editar no Word/Excel.

O site mostra quantos tokens cada chamada de IA consumiu e quanto isso custou, por processo e no acumulado.

## Documentos gerados (Pregão / Dispensa de material)

| Arquivo | Conteúdo |
|---|---|
| `00_Oficio_Solicitacao_PAMS_*.docx` | Ofício ao Chefe da DA com a lista de anexos conforme o procedimento |
| `01_DFD_*.docx` | Documento de Formalização da Demanda |
| `02_Termo_de_Justificativa_*.docx` | Termo de Justificativa (consumo ou permanente; SRP ou dispensa) |
| `03_ETP_*.docx` | Estudo Técnico Preliminar digital |
| `04_Quantitativos_e_Pesquisa_de_Precos_*.xlsx` | Justificativa dos quantitativos + mapa de pesquisa de preços (IN 65/2021) com fórmulas |

Os dados que a IA não tem (nº de processo, códigos PGC/PAAC, CATMAT, CPF) saem entre colchetes e **destacados em amarelo** no Word.

## Como a IA é usada (chamadas pontuais)

1. **Extração** (Claude, 1 chamada): o texto livre vira dados estruturados — itens, especificações, quantidades, local, exercício.
2. **Classificação** (TypeSafe Jev, 1 chamada): natureza, procedimento, prioridade e indicação de marca. Custa frações de centavo.
3. **Redação** (Claude, 4 chamadas): DFD, Termo de Justificativa, ETP parte 1 e ETP parte 2. Cada chamada devolve só os campos variáveis em JSON; o texto fixo dos modelos fica em `js/docs.js`.
4. **Montagem** (sem IA): o navegador monta os .docx e o .xlsx.

O prompt de sistema comum fica em cache: só a primeira chamada paga o preço cheio por ele. Cada bloco pode ser refeito isoladamente pelo botão "Refazer este bloco".

Custo de referência com Claude Opus 5.5 e esforço baixo: cerca de **US$ 0,20 (≈ R$ 1,10) por processo**. O valor real aparece no painel "Uso de IA" e na aba "Custos e histórico".

## Estrutura

```
index.html          interface
css/style.css
js/config.js        URL do worker, modelos, tabela de preços, cotação do dólar
js/api.js           chamadas ao worker + contabilidade de tokens/custo
js/pipeline.js      prompts e etapas (extração, Jev, redação)
js/docs.js          montagem dos documentos Word/Excel
js/demo.js          respostas de exemplo para o modo demonstração
js/app.js           lógica da tela
lib/                docx, jszip e exceljs (embutidas para funcionar sem CDN)
worker/worker.js    proxy Cloudflare que guarda as chaves de API
```

## Worker (Cloudflare) — passo necessário para usar o Claude

As chaves **nunca** ficam no site: o navegador chama o worker, e o worker chama as APIs com as variáveis `CLAUDE-API-KEY` e `TYPESAFE_API_KEY`.

O worker publicado hoje só encaminha para a Jev. Para ligar o Claude:

1. Abra o painel da Cloudflare → Workers → `still-cake-5afc` → **Edit code**.
2. Substitua o código pelo conteúdo de [`worker/worker.js`](worker/worker.js) e clique em **Deploy**.
3. Confira em Settings → Variables que existem `CLAUDE-API-KEY` (chave da API da Anthropic, começa com `sk-ant-api…`) e `TYPESAFE_API_KEY`.
4. Recomendado: adicione `ALLOWED_ORIGINS` = `https://maxmox.github.io` para que só o site use o worker. Opcionalmente, `APP_TOKEN` com uma senha, que deve ser informada na aba Configurações do site.

Rotas: `POST /claude` → Anthropic; `POST /jev` (e `POST /`) → Jev, compatível com a versão anterior.

Enquanto o worker não for atualizado, o site mostra "Claude: sem rota no worker" e funciona em **modo demonstração**: a classificação da Jev é real, e os textos do Claude vêm do exemplo das tintas, com custo **estimado** (marcado com *).

## Publicar no GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → Branch `main`, pasta `/ (root)`. O site fica em `https://maxmox.github.io/DEAO_PROCESSOS/`.

Para rodar localmente: `python -m http.server` na pasta do projeto e abrir `http://localhost:8000`.

## Limitações do protótipo

- Modelos de **serviço** e de adesão a ata (carona/IRP) ainda não foram implementados.
- O preço unitário sugerido pela IA é só referência; a pesquisa de preços real continua obrigatória.
- O limite de dispensa (`LIMITE_DISPENSA` em `js/config.js`) muda todo ano por decreto e precisa ser atualizado.
- Os textos precisam de revisão técnica e jurídica antes da assinatura.
