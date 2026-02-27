# 📊 Financial Analytics Dashboard & Automation System

Transformando dados brutos em decisões estratégicas através da automação inteligente.

---

## 🔗 Link do Projeto
- **Live Demo:** https://financial-analytics-4jch.onrender.com

---

## 🧩 O Problema
Pequenas e médias empresas (PMEs) perdem, em média, **5 a 10 horas semanais** compilando dados financeiros manualmente. O uso excessivo de Excel estático resulta em:
- **Erros de integridade**: Dados duplicados ou fórmulas quebradas.
- **Lentidão**: A decisão é tomada com base no mês passado, não no hoje.
- **Falta de Previsibilidade**: Dificuldade em visualizar o impacto de contas pendentes no fluxo de caixa futuro.

---

## 💡 A Solução
Este projeto é uma **Aplicação Web de Business Intelligence** desenvolvida em Python. Ela automatiza todo o pipeline de dados: desde a ingestão de arquivos brutos (CSV/XLSX) até a visualização de KPIs críticos e análise preditiva de fluxo de caixa.

---

## 🚀 Funcionalidades Principais
1. ### Ingestão e Validação Automática
O sistema possui um motor de validação que verifica a integridade do arquivo enviado. Se faltarem colunas obrigatórias como *Data*, *Valor* ou *Status*, o sistema alerta o utilizador antes de processar, garantindo que os relatórios sejam sempre precisos.

2. ### Dashboard Dinâmico de Fluxo de Caixa
- **Real vs. Projetado**: Uma análise sofisticada que cruza o que já foi pago com o que está pendente, permitindo prever o saldo final do mês.
- **KPIs em Tempo Real**: Visualização instantânea de Receita, Despesas e Impacto de Pendências.
- **Filtros Inteligentes**: Segmentação por Mês, Categoria, Subcategoria e Status com atualização reativa.

3. ### User Experience (UX) Adaptável
- **Theme Switching**: Suporte nativo para Light Mode e Dark Mode via Dash Bootstrap Templates, garantindo conforto visual para diferentes perfis de utilizadores.
- **Interface Responsiva**: Desenvolvida com Bootstrap Grid System para adaptação a diferentes tamanhos de ecrã.

---

## 🛠 Stack Tecnológica
- **Python**:	Linguagem core do sistema
- **Pandas**:	Engine de processamento e limpeza de dados (ETL)
- **Dash / Plotly**:	Framework para interface web e gráficos interativos
- **Dash Bootstrap**: Components	Estilização e componentes de UI responsiva
- **JSON/Store**:	Gestão de estado e persistência de dados em sessão

---

## 🏗 Estrutura do Projeto e Lógica
O projeto segue o modelo de Single Page Application (SPA) com troca de estados (dcc.Store):
1. **Tela de Upload**: O utilizador submete o ficheiro. O backend processa o arquivo via io.BytesIO, realiza o parsing com Pandas, limpa duplicados e trata datas.
2. **Processamento Financeiro**:
 - Separação de fluxos (Receita/Despesa).
 - Cálculo de métricas de impacto (Diferença entre fluxo real e projetado).
 - Agrupamento por categorias para análise de Pareto.
 3. **Visualização**: Os dados processados alimentam os callbacks reativos que atualizam os gráficos Plotly sem necessidade de recarregar a página.

---

## 📈 Roadmap / Futuro do Projeto
- Implementar autenticação de utilizadores (Login/Signup).
- Conexão direta com APIs bancárias e ERPs.
- Exportação automática de relatórios consolidados em PDF.
- Módulo de Machine Learning para previsão de inadimplência.

---

## 👨‍💻 Autor
**Ivandro Macheque** - Desenvolvedor de Soluções de Automação & Data Analytics.

*"Transformando processos manuais em sistemas escaláveis."*

---

## Nota
Este projeto foca na lógica de negócio e processamento de dados eficiente. A arquitetura de callbacks do Dash foi otimizada para minimizar o overhead de memória, utilizando o dcc.Store para manter a fluidez da UI enquanto o Pandas lida com a computação pesada no background.





