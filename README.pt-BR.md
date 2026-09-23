# Verba

Um dashboard de operações financeiras para organizações sociais: documentos, programas, aprovações e equipe num lugar só. Feito com React 19, TypeScript, Tailwind CSS v4, Radix UI, TanStack Query e Recharts. Roda inteiro no navegador contra uma API simulada, então publica como site estático.

[Read in English](README.md)

![Visão geral com indicadores, pago e pendente por mês, execução por programa, vencimentos próximos e atividade recente](docs/overview.png)

## O que tem

- **Visão geral.** Quatro indicadores (pago no mês com a variação sobre o mês anterior, aguardando aprovação, glosado nos últimos 30 dias, vencendo em 7 dias), um gráfico de área com pago e pendente por mês, execução por programa, vencimentos próximos e atividade recente.
- **Documentos.** Uma tabela densa com 480 documentos, com busca, filtros de estado, programa e setor, ordenação, paginação e total filtrado.
  - Documentos pendentes podem ser selecionados e aprovados ou glosados em lote; a glosa exige um motivo por escrito, que vai para o histórico.
  - Um painel lateral mostra cada documento com o seu histórico.
  - A exportação em CSV abre direito no Excel: BOM, ponto e vírgula e vírgula decimal em português.
  - Os filtros ficam no endereço, então uma visão filtrada pode ser compartilhada.
- **Programas.** Orçamento, executado e comprometido de cada programa, gráfico de execução mensal e maiores fornecedores.
- **Equipe.** Convite com validação (e-mail duplicado é detectado), troca de papel e remoção, com limite de assentos.
- **Configurações.** Perfil, preferências (idioma, tema, densidade das tabelas) e uso do plano.
- **Paleta de comandos.** `Ctrl K` ou `⌘K` leva a páginas, programas e documentos, e executa ações.
- **Português e inglês.** Todos os textos, e moeda, datas e números formatados por localidade com `Intl`.
- **Tema claro, escuro e do sistema**, sem piscar ao carregar.
- **Estados de carregamento, vazio e erro** em toda parte. Ligar "Simular falhas de rede" nas configurações faz toda leitura falhar, para ver os estados de erro e as novas tentativas.

| Documentos, com o painel lateral aberto | Paleta de comandos |
| --- | --- |
| ![Tabela de documentos filtrada por pendentes, com um documento glosado aberto no painel lateral](docs/documents.png) | ![Paleta de comandos aberta sobre a visão geral, filtrando páginas conforme a digitação](docs/command-palette.png) |

| Tema escuro | Celular |
| --- | --- |
| ![Visão geral no tema escuro](docs/overview-dark.png) | ![Documentos no celular, onde a tabela vira cartões](docs/mobile.png) |

## Decisões que valem a leitura

**Cor nunca é o único sinal.** Cada estado tem símbolo e palavra além da cor: ● pago, ◐ pendente, ◆ glosado.

**Cinco faixas de prazo, uma matiz de aviso.** A escala de prazo tem cinco faixas e a marca tem uma cor de aviso, então os três avisos são três degraus do mesmo laranja. O vencido se marca pelo peso e por um `!`, não por uma segunda matiz. Senão, a tela diria que um documento está vencido e glosado ao mesmo tempo.

**Contraste é testado, não avaliado a olho.** O `src/lib/tokens.test.ts` lê os tokens OKLCH direto do `styles.css` e confere 18 pares nos dois temas contra a WCAG 2.1: 4,5:1 em texto e 3:1 em bordas de controle e anel de foco. Mude um token e o teste falha antes de alguém ver.

**Acessibilidade faz parte do componente, não vem depois.**
- A paleta de comandos é um combobox em que o foco nunca sai do campo: a opção ativa é anunciada por `aria-activedescendant`.
- Os cabeçalhos ordenáveis têm `aria-sort`.
- Os gráficos ficam ocultos para o leitor de tela e são substituídos por uma tabela com os mesmos números.
- Todo campo tem rótulo visível, e o erro fica ligado a ele por `aria-describedby`.
- Depois de navegar, o foco vai para o título da página.
- Há uma única região viva educada para as confirmações.
- O app passa no axe sem nenhuma violação em todas as páginas, nos dois temas.

**Tabela densa sem rolagem horizontal.** A tabela de documentos vira cartões por container query, então ela responde à largura que recebeu, não à da janela.

**A API é uma porta só.** O `src/api/client.ts` é a única coisa que a interface chama. Ele adiciona latência, pode falhar de propósito e guarda as suas alterações no `localStorage`. Trocá-lo por chamadas `fetch` a um backend real não muda nada acima dele.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm test
npm run build      # arquivos estáticos em dist/
```

Entre com qualquer e-mail válido e uma senha de seis caracteres ou mais, ou use o botão da conta de demonstração.

Publica na Vercel sem ajustes: o `vercel.json` redireciona toda rota para o `index.html`, por causa do roteamento no cliente.

## Testes

81 testes com Vitest e Testing Library, todos escritos sobre papéis, nomes acessíveis e teclado, e não sobre classes CSS:

- fluxos de interface: 14
- consultas e números derivados: 20
- banco de dados no navegador: 7
- contraste dos temas: 36
- CSV: 4

O CI roda a checagem de tipos, os testes e o build em Node 20 e 22.

## Estrutura

```
src/api/         tipos, dados gerados, consultas puras, banco no navegador, cliente de API, ganchos do TanStack Query
src/app/         provedores (preferências e idioma, autenticação), layout, paleta de comandos
src/components/  primitivos de interface (botão, campos, selos, diálogos, painel, avisos, estados) e gráficos
src/pages/       visão geral, documentos, programas, equipe, configurações, login, página não encontrada
src/i18n/        dicionários de português e inglês
src/lib/         CSV, cor e contraste
```

Cada página é um pedaço separado do código, então a biblioteca de gráficos só carrega nas páginas que desenham gráficos.

## Os dados

Tudo é fictício: o Instituto Semear, os oito programas, os fornecedores e as pessoas. Os dados são gerados de uma semente fixa a cada carregamento, então são os mesmos para todo mundo, e as datas são relativas ao dia de hoje, para os prazos continuarem fazendo sentido.

## Licença

MIT
