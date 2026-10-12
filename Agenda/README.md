# 🚀 DevAgenda CLI — Agenda de Estudos no Padrão GitHub CLI (`gh`)
### Edição Didática & Integração GitHub REST API

Uma aplicação web moderna para controle de rotina e atividades de estudos técnicos, inspirada no design, usabilidade e sintaxe do **GitHub CLI (`gh`)**, com **modo pedagógico** e **integração real com a GitHub REST API**.

---

## ⚡ 1. Nova Funcionalidade: Integração com GitHub REST API (Marcus Vance)

Para permitir a validação prática e didática de como APIs REST funcionam tanto na interface gráfica quanto no terminal, integramos os serviços públicos da **GitHub API (api.github.com)**:

1. **Endpoint de Filosofia & Health Check (`GET /zen`):**
   * Comando CLI: `agenda api zen`
   * Retorna a mensagem de filosofia do GitHub, mede o tempo de resposta em milissegundos e inspeciona o header `X-RateLimit-Remaining`.
2. **Importador de Issues Reais para a Grade de Estudos:**
   * Comando CLI: `agenda github import --repo octocat/Hello-World --limit 3`
   * Interface Gráfica: Botão **"GitHub API (Desafio QA)"** no cabeçalho.
   * Converte issues abertas de qualquer repositório público em tarefas de estudo locais, inferindo prioridade baseada nas labels (`bug`, `high`, etc.).
3. **Telemetria de Rede ao Vivo:**
   * Medição de latência real (`ms`).
   * Visualização dos status codes HTTP (`200 OK`, `404 Not Found`, `403 Rate Limit Exceeded`).
   * Inspetor de cabeçalhos de limitação de taxa por IP (`X-RateLimit-Remaining: 58/60`).

---

## 🎓 2. Como Funciona o Aprendizado Didático (Arthur Wright)

Se você tem pouco ou nenhum conhecimento prévio em Git ou Linha de Comando, a interface foi desenhada para servir como uma ponte de aprendizado bidirecional:

1. **Formulário Visual com Gerador de CLI em Tempo Real:**
   * Clique em **"Nova Atividade"** ou no botão de editar (`✏️`) de qualquer card.
   * Conforme você preenche o título, altera a prioridade ou define uma data limite, uma janela de terminal abaixo do formulário mostra **exatamente o comando que o GitHub CLI gera**, explicando o papel de cada flag (`--title`, `--priority`, `--status`).
   * Ao clicar em **"Executar Comando & Salvar"**, a interface despacha o comando para o terminal e atualiza o quadro visual!

2. **Inspetor Didático em Tempo Real (Barra Superior):**
   * Cada clique na interface (mover uma tarefa para "Em Curso", clicar em "Concluir", filtrar por tag ou inspecionar um card) aciona o **Inspetor Didático**.
   * O painel destaca a ação visual realizada, o comando CLI equivalente e uma explicação pedagógica.

---

## 💻 3. Como Rodar Localmente na Sua Máquina

A aplicação roda diretamente no navegador, sem necessidade de Node.js:

### Opção A: Servidor Local com Python (Recomendado)
No terminal (PowerShell ou Prompt de Comando), dentro desta pasta:
```bash
python -m http.server 3000
```
Em seguida, acesse no seu navegador:
👉 **`http://localhost:3000`**

### Opção B: Abertura Direta no Navegador
Basta dar dois cliques no arquivo **`index.html`** ou executar no PowerShell:
```powershell
Start-Process .\index.html
```

---

## ⌨️ 4. Guia Completo de Comandos e Sintaxe CLI

A aplicação segue a semântica padrão: `agenda <entidade> <ação> [argumentos] [flags]`

| Comando | Descrição | Exemplo de Uso |
| :--- | :--- | :--- |
| `agenda --help` | Exibe o manual completo de comandos e flags | `agenda --help` |
| `agenda api zen` | Faz chamada HTTP GET para `/zen` na GitHub API | `agenda api zen` |
| `agenda api <endpoint>` | Faz chamadas diretas à GitHub REST API (estilo `gh api`) | `agenda api repos/octocat/Hello-World` |
| `agenda github import [flags]` | Importa issues de um repositório como tarefas | `agenda github import --repo octocat/Hello-World -l 3` |
| `agenda task list` | Lista todas as atividades em formato de tabela colorida | `agenda task list` |
| `agenda task list --status <st>` | Filtra por status (`todo`, `in-progress`, `done`) | `agenda task list --status in-progress` |
| `agenda task create` | Cria uma atividade via **Modo Interativo (Wizard estilo `gh`)** | `agenda task create` |
| `agenda task create [flags]` | Cria uma atividade passando parâmetros diretamente | `agenda task create --title "Estudo Window Functions" --tag "sql" -p high` |
| `agenda task edit <id> [flags]` | Altera atributos de uma tarefa específica | `agenda task edit 2 --status done --priority low` |
| `agenda task done <id>` | Atalho rápido para concluir uma atividade | `agenda task done 3` |
| `agenda task view <id>` | Mostra os detalhes e anotações completas de uma tarefa | `agenda task view 1` |
| `agenda task delete <id>` | Remove uma atividade da agenda | `agenda task delete 4` |
| `agenda stats` | Exibe painel com barra de progresso ASCII e estatísticas | `agenda stats` |
| `agenda export` | Faz backup e download dos dados em formato JSON | `agenda export` |
| `agenda reset` | Restaura os exercícios modelo do Curso de SQL | `agenda reset` |
| `clear` | Limpa o histórico de tela do terminal (ou atalho `Ctrl + L`) | `clear` |

### Flags Suportadas:
- `-r, --repo <owner/repo>`: Repositório GitHub para consulta ou importação de issues.
- `-l, --limit <n>`: Quantidade limite de itens a importar (padrão: 3).
- `-t, --title <string>`: Título da atividade de estudo.
- `-s, --status <todo|in-progress|done>`: Estado da atividade.
- `-p, --priority <low|medium|high>`: Nível de prioridade.
- `-d, --due <YYYY-MM-DD>`: Data limite para conclusão.
- `--tag <string>`: Tags separadas por vírgula (ex: `sql,joins`).
- `-i, --interactive`: Aciona o modo de perguntas interativas.

---

## 🧪 5. Guia de Testes para QA (Desafio Marcus Vance)

Como responsável de testes, valide os seguintes cenários:

1. **Cenário Sucesso 200 OK:**
   * Terminal: `agenda api zen`
   * Modal: Preset `octocat/Hello-World` ➔ Clicar em "Testar Requisição HTTP" ➔ Validar badge verde `200 OK`, latência e contador de Rate Limit. Em seguida, clique em "Importar como Tarefas" e confira os novos cards no Kanban.
2. **Cenário de Erro 404 Not Found:**
   * Modal: Preset `Cenário 404` (repositório inexistente) ➔ Validar badge vermelho `404 Not Found` e tratamento amigável de erro.
   * Terminal: `agenda github import --repo usuario-fantasma/repo-que-nao-existe` ➔ Validar mensagem em vermelho sem quebra de script.
3. **Cenário de Modo Offline / Erro de Rede:**
   * No DevTools (`F12`), aba *Network*, marque **Offline**.
   * Dispare `agenda api zen` e valide se a mensagem `Falha de Conexão` é exibida com elegância.

---

## 🌐 6. Passo a Passo de Deploy Gratuito na Web

1. **Vercel (Recomendado):** Suba a pasta para o GitHub e importe no [vercel.com](https://vercel.com) com 1 clique (deploy imediato).
2. **GitHub Pages:** Ative em *Settings > Pages* no seu repositório.
3. **Netlify Drop:** Arraste a pasta no [app.netlify.com/drop](https://app.netlify.com/drop).

---

## 👥 7. Equipe do Projeto

- **Marcus Vance** — *Tech Lead & Product Architecture*
- **Chloe Miller** — *CLI & UX/UI Designer*
- **Lucas Scott** — *Lead Frontend & Terminal Engine*
- **Arthur Wright** — *Didactic & Learning Experience Specialist (Pedagogical DX)*
- **Sarah Jenkins** — *DevOps & Cloud Deployment*
- **Daniel Reed** — *QA & Developer Advocate*
