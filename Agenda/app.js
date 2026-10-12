/**
 * DevAgenda CLI - Engine & State Management
 * Includes Didactic Learning Experience (Arthur Wright Persona)
 * and Real GitHub REST API Integration & Telemetry (Marcus Vance Persona)
 * Follows GitHub CLI (gh) command design patterns
 */

// Initial Sample Study Tasks (Pre-loaded with SQL course contents)
const DEFAULT_TASKS = [
  {
    id: 1,
    title: "Modelagem Relacional e Formas Normais (1FN, 2FN, 3FN)",
    status: "done",
    tag: "sql,modelagem",
    priority: "high",
    due: "2026-10-01",
    notes: "Compreender dependências funcionais e eliminação de redundâncias em tabelas.",
    createdAt: "2026-09-28"
  },
  {
    id: 2,
    title: "Consultas Avançadas: INNER, LEFT e FULL OUTER JOIN",
    status: "in-progress",
    tag: "sql,queries",
    priority: "high",
    due: "2026-10-03",
    notes: "Praticar junções múltiplas e resolução de valores nulos (COALESCE).",
    createdAt: "2026-09-29"
  },
  {
    id: 3,
    title: "Criação de Índices B-Tree e Análise com EXPLAIN ANALYZE",
    status: "todo",
    tag: "sql,performance",
    priority: "medium",
    due: "2026-10-06",
    notes: "Evitar Seq Scans em tabelas de grande volume; testar índices compostos.",
    createdAt: "2026-10-01"
  },
  {
    id: 4,
    title: "Implementação de Stored Procedures e Triggers de Auditoria",
    status: "todo",
    tag: "sql,programacao",
    priority: "medium",
    due: "2026-10-09",
    notes: "Criar trigger para alimentar tabela de log em operações de UPDATE/DELETE.",
    createdAt: "2026-10-01"
  },
  {
    id: 5,
    title: "Gerenciamento de Transações (ACID) e Níveis de Isolamento",
    status: "todo",
    tag: "sql,teoria",
    priority: "low",
    due: "2026-10-12",
    notes: "Simular Dirty Reads, Non-repeatable Reads e Phantom Reads.",
    createdAt: "2026-10-01"
  }
];

class DevAgendaApp {
  constructor() {
    this.storageKey = "devagenda_tasks_v1";
    this.tasks = this.loadTasks();
    this.history = JSON.parse(localStorage.getItem("devagenda_cmd_history") || "[]");
    this.historyIndex = this.history.length;
    
    // Didactic Learning Mode (Arthur Wright)
    this.didacticMode = localStorage.getItem("devagenda_didactic_mode") !== "false";

    // Interactive Wizard state
    this.interactiveState = null;

    // Last API fetched data cache for modal import
    this.lastApiIssues = [];

    // DOM Elements
    this.termOutput = document.getElementById("terminal-output");
    this.termInput = document.getElementById("terminal-input");
    this.kanbanView = document.getElementById("kanban-view");
    this.tableView = document.getElementById("table-view");
    this.tableBody = document.getElementById("table-body");
    this.statTotal = document.getElementById("stat-total");
    this.statCompleted = document.getElementById("stat-completed");
    this.statProgress = document.getElementById("stat-progress");
    this.statNextDue = document.getElementById("stat-next-due");

    // Didactic DOM Elements
    this.didacticPanel = document.getElementById("didactic-panel");
    this.didacticActionLabel = document.getElementById("didactic-action-label");
    this.didacticCmdDisplay = document.getElementById("didactic-cmd-display");
    this.didacticExplanation = document.getElementById("didactic-explanation");
    this.btnToggleDidactic = document.getElementById("btn-toggle-didactic");
    this.labelDidacticMode = document.getElementById("label-didactic-mode");

    // Task Modal Elements
    this.taskModal = document.getElementById("task-modal");
    this.taskForm = document.getElementById("task-form");
    this.modalTaskHeading = document.getElementById("modal-task-heading");
    this.modalLiveCommand = document.getElementById("modal-live-command");
    this.modalCmdExplanation = document.getElementById("modal-cmd-explanation");

    // GitHub API Modal Elements (Marcus Vance Integration)
    this.apiModal = document.getElementById("api-modal");
    this.apiRepoInput = document.getElementById("api-repo-input");
    this.btnFetchApi = document.getElementById("btn-fetch-api");
    this.apiBtnSpinner = document.getElementById("api-btn-spinner");
    this.apiStatusBadge = document.getElementById("api-status-badge");
    this.apiLatencyBadge = document.getElementById("api-latency-badge");
    this.apiRatelimitBadge = document.getElementById("api-ratelimit-badge");
    this.apiEndpointUrl = document.getElementById("api-endpoint-url");
    this.apiItemsCount = document.getElementById("api-items-count");
    this.apiJsonPreview = document.getElementById("api-json-preview");
    this.apiCliCmd = document.getElementById("api-cli-cmd");
    this.btnImportIssuesNow = document.getElementById("btn-import-issues-now");

    this.init();
  }

  loadTasks() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      localStorage.setItem(this.storageKey, JSON.stringify(DEFAULT_TASKS));
      return [...DEFAULT_TASKS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...DEFAULT_TASKS];
    }
  }

  saveTasks() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    this.renderBoard();
    this.renderTable();
    this.updateStats();
  }

  init() {
    this.renderBoard();
    this.renderTable();
    this.updateStats();
    this.setupEventListeners();
    this.setupApiModalListeners();
    this.updateDidacticUI();
    this.printWelcome();
  }

  setupEventListeners() {
    // Terminal input handling
    this.termInput.addEventListener("keydown", (e) => this.handleKeydown(e));

    // Focus input on terminal click
    document.getElementById("terminal-container").addEventListener("click", () => {
      this.termInput.focus();
    });

    // View toggles
    document.getElementById("btn-view-kanban").addEventListener("click", () => this.switchView("kanban"));
    document.getElementById("btn-view-table").addEventListener("click", () => this.switchView("table"));

    // Quick Command Chips
    document.querySelectorAll(".cmd-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const cmd = chip.getAttribute("data-cmd");
        if (cmd) {
          this.executeCommand(cmd);
          this.termInput.focus();
        }
      });
    });

    // Toggle Didactic Mode
    this.btnToggleDidactic.addEventListener("click", () => {
      this.didacticMode = !this.didacticMode;
      localStorage.setItem("devagenda_didactic_mode", this.didacticMode);
      this.updateDidacticUI();
      if (this.didacticMode) {
        this.printLine(`<span class="text-yellow-400 font-semibold">🎓 Modo Didático Ativado:</span> Agora cada ação no sistema e na API explicará o comando CLI correspondente!`);
      } else {
        this.printLine(`<span class="text-gray-400">Modo Didático pausado. Ações gráficas executarão de forma silenciosa.</span>`);
      }
    });

    // Copy Didactic Command
    document.getElementById("btn-copy-didactic").addEventListener("click", () => {
      const text = this.didacticCmdDisplay.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById("btn-copy-didactic");
        const prev = btn.innerHTML;
        btn.innerHTML = "✓";
        setTimeout(() => { btn.innerHTML = prev; }, 1200);
      });
    });

    // Open/Close Visual Task Modal
    document.getElementById("btn-open-task-modal").addEventListener("click", () => {
      this.openTaskModal();
    });
    document.getElementById("btn-close-task-modal").addEventListener("click", () => {
      this.closeTaskModal();
    });
    document.getElementById("btn-cancel-task-modal").addEventListener("click", () => {
      this.closeTaskModal();
    });

    // Real-time live command preview in form inputs
    const formInputs = ["form-title", "form-status", "form-priority", "form-tags", "form-due", "form-notes"];
    formInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => this.updateModalCommandPreview());
        el.addEventListener("change", () => this.updateModalCommandPreview());
      }
    });

    // Form Submit (Triggers real CLI command execution)
    this.taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleTaskFormSubmit();
    });

    // Deploy Modal toggles
    const deployModal = document.getElementById("deploy-modal");
    document.getElementById("btn-open-deploy").addEventListener("click", () => {
      deployModal.classList.remove("hidden");
    });
    document.getElementById("btn-close-deploy").addEventListener("click", () => {
      deployModal.classList.add("hidden");
    });
  }

  /**
   * Setup do Modal da GitHub REST API (Marcus Vance - Desafio QA)
   */
  setupApiModalListeners() {
    const openBtn = document.getElementById("btn-open-api-modal");
    const closeBtn = document.getElementById("btn-close-api-modal");
    const cancelBtn = document.getElementById("btn-cancel-api-modal");

    if (openBtn) openBtn.addEventListener("click", () => this.openApiModal());
    if (closeBtn) closeBtn.addEventListener("click", () => this.closeApiModal());
    if (cancelBtn) cancelBtn.addEventListener("click", () => this.closeApiModal());

    // Presets click
    document.querySelectorAll(".btn-api-preset").forEach(btn => {
      btn.addEventListener("click", () => {
        const repo = btn.getAttribute("data-repo");
        if (repo && this.apiRepoInput) {
          this.apiRepoInput.value = repo;
          this.testGitHubApiRequest(repo);
        }
      });
    });

    // Fetch button in modal
    if (this.btnFetchApi) {
      this.btnFetchApi.addEventListener("click", () => {
        const repo = (this.apiRepoInput.value || "").trim();
        if (repo) {
          this.testGitHubApiRequest(repo);
        }
      });
    }

    // Import from modal button
    if (this.btnImportIssuesNow) {
      this.btnImportIssuesNow.addEventListener("click", () => {
        this.importCachedIssues();
      });
    }
  }

  openApiModal() {
    this.apiModal.classList.remove("hidden");
    const repo = (this.apiRepoInput.value || "octocat/Hello-World").trim();
    this.updateApiCommandPreview(repo);
  }

  closeApiModal() {
    this.apiModal.classList.add("hidden");
  }

  updateApiCommandPreview(repo) {
    if (this.apiCliCmd) {
      this.apiCliCmd.textContent = `agenda github import --repo "${repo}" --limit 3`;
    }
  }

  async testGitHubApiRequest(repo) {
    if (!repo) return;
    this.updateApiCommandPreview(repo);

    const endpoint = `https://api.github.com/repos/${repo}/issues?state=open&per_page=5`;
    this.apiEndpointUrl.textContent = endpoint;
    this.apiBtnSpinner.classList.remove("hidden");
    this.btnFetchApi.disabled = true;
    this.btnImportIssuesNow.disabled = true;

    this.apiStatusBadge.textContent = "SOLICITANDO...";
    this.apiStatusBadge.className = "font-bold text-yellow-400 text-sm animate-pulse";
    this.apiJsonPreview.textContent = "Aguardando resposta da rede...";

    const startTime = performance.now();

    try {
      const response = await fetch(endpoint, {
        headers: { "Accept": "application/vnd.github.v3+json" }
      });
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      this.apiLatencyBadge.textContent = `${latency} ms`;

      // Header Telemetry (Rate Limits)
      const remaining = response.headers.get("x-ratelimit-remaining") || "N/A";
      const limit = response.headers.get("x-ratelimit-limit") || "60";
      this.apiRatelimitBadge.textContent = `${remaining} / ${limit}`;

      const status = response.status;
      const statusText = response.statusText || (status === 200 ? "OK" : status === 404 ? "Not Found" : status === 403 ? "Forbidden" : "Error");
      
      this.apiStatusBadge.textContent = `${status} ${statusText}`;

      if (response.ok) {
        this.apiStatusBadge.className = "font-bold text-green-400 text-sm";
        const data = await response.json();
        this.lastApiIssues = Array.isArray(data) ? data : [];
        this.apiItemsCount.textContent = `${this.lastApiIssues.length} issues encontradas`;

        // Format preview
        const preview = this.lastApiIssues.map(issue => ({
          number: issue.number,
          title: issue.title,
          user: issue.user ? issue.user.login : "anon",
          labels: (issue.labels || []).map(l => l.name),
          created_at: issue.created_at
        }));

        this.apiJsonPreview.textContent = JSON.stringify(preview, null, 2);

        if (this.lastApiIssues.length > 0) {
          this.btnImportIssuesNow.disabled = false;
        }

        this.notifyDidacticAction(
          `Requisição GET na GitHub API para '${repo}'`,
          `agenda api repos/${repo}/issues`,
          `Sucesso HTTP 200 OK (${latency}ms). ${this.lastApiIssues.length} issues recebidas e analisadas.`
        );
      } else {
        this.apiStatusBadge.className = "font-bold text-red-400 text-sm";
        const errData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        this.apiItemsCount.textContent = "0 itens";
        this.lastApiIssues = [];
        this.apiJsonPreview.textContent = JSON.stringify(errData, null, 2);

        this.notifyDidacticAction(
          `Falha na requisição API (${status})`,
          `agenda api repos/${repo}/issues`,
          `Status HTTP ${status} retornado pelo GitHub. Verifique se o repositório existe ou se a cota por IP esgotou.`
        );
      }

    } catch (err) {
      const endTime = performance.now();
      this.apiLatencyBadge.textContent = `${Math.round(endTime - startTime)} ms`;
      this.apiStatusBadge.textContent = "ERR_CONNECTION";
      this.apiStatusBadge.className = "font-bold text-red-500 text-sm";
      this.apiJsonPreview.textContent = `Falha de Rede: ${err.message}\nVerifique se o navegador está online ou se extensões bloquearam a chamada.`;
      this.apiItemsCount.textContent = "0 itens";
      this.lastApiIssues = [];
    } finally {
      this.apiBtnSpinner.classList.add("hidden");
      this.btnFetchApi.disabled = false;
    }
  }

  importCachedIssues() {
    if (!this.lastApiIssues || this.lastApiIssues.length === 0) return;

    const count = this.lastApiIssues.length;
    const repo = (this.apiRepoInput.value || "github-repo").trim();

    this.lastApiIssues.forEach(issue => {
      const isBug = (issue.labels || []).some(l => (l.name || "").toLowerCase().includes("bug"));
      const isHigh = (issue.labels || []).some(l => (l.name || "").toLowerCase().includes("high"));

      const newTask = {
        id: this.getNextId(),
        title: `[GH #${issue.number}] ${issue.title}`,
        status: "todo",
        tag: `github,${(issue.labels || []).map(l => l.name).slice(0, 2).join(",") || "issue"}`,
        priority: isBug || isHigh ? "high" : "medium",
        due: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        notes: `Origem: ${issue.html_url}\nCriado por @${issue.user ? issue.user.login : 'user'}\n\n${(issue.body || 'Sem descrição').slice(0, 250)}...`,
        createdAt: new Date().toISOString().split("T")[0]
      };
      this.tasks.push(newTask);
    });

    this.saveTasks();
    this.closeApiModal();

    this.notifyDidacticAction(
      `Importação de ${count} issues do GitHub para a Agenda`,
      `agenda github import --repo "${repo}" --limit ${count}`,
      `As issues da API foram mapeadas e adicionadas diretamente como tarefas na coluna 'A Fazer'.`
    );

    this.printLine(`<span class="text-green-400 font-bold">✓ Sucesso:</span> Foram importadas <span class="text-cyan-400 font-bold">${count} issues</span> do repositório <span class="text-white">${repo}</span> como atividades na sua agenda!`);
  }

  updateDidacticUI() {
    if (this.didacticMode) {
      this.btnToggleDidactic.classList.remove("text-gray-400", "border-gray-700");
      this.btnToggleDidactic.classList.add("text-yellow-300", "border-yellow-700/50");
      this.labelDidacticMode.textContent = "Modo Didático: ATIVO";
      this.didacticPanel.classList.remove("opacity-40");
    } else {
      this.btnToggleDidactic.classList.remove("text-yellow-300", "border-yellow-700/50");
      this.btnToggleDidactic.classList.add("text-gray-400", "border-gray-700");
      this.labelDidacticMode.textContent = "Modo Didático: PAUSADO";
      this.didacticPanel.classList.add("opacity-40");
    }
  }

  /**
   * Notificação Didática (Arthur Wright)
   */
  notifyDidacticAction(actionLabel, command, explanation) {
    if (!this.didacticActionLabel) return;

    this.didacticActionLabel.textContent = actionLabel;
    this.didacticCmdDisplay.textContent = command;
    this.didacticExplanation.innerHTML = `<strong class="text-yellow-300">Arthur Wright explica:</strong> ${explanation}`;

    // Highlight animation on panel
    this.didacticPanel.classList.remove("didactic-pulse");
    void this.didacticPanel.offsetWidth; // re-trigger reflow
    this.didacticPanel.classList.add("didactic-pulse");

    if (this.didacticMode) {
      const calloutHtml = `
<div class="my-1.5 p-2 rounded bg-[#161b22] border-l-4 border-yellow-400 font-sans text-xs">
  <div class="flex items-center gap-1.5 text-yellow-300 font-bold text-[11px] mb-0.5">
    <span>🎓 MENTORIA DIDÁTICA (Veja na UI ➔ Aprenda no Terminal):</span>
  </div>
  <div class="text-gray-200 mb-1"><span class="text-gray-400">Ação Gráfica:</span> <strong>${actionLabel}</strong></div>
  <div class="font-mono text-[#58a6ff] bg-[#0d1117] p-1.5 rounded border border-[#30363d] mb-1">$ ${command}</div>
  <div class="text-gray-400 text-[11px] leading-tight">${explanation}</div>
</div>
`;
      this.printLine(calloutHtml);
    }
  }

  openTaskModal(task = null) {
    this.taskForm.reset();
    
    if (task) {
      this.modalTaskHeading.textContent = `Editar Atividade #${task.id} (Visual)`;
      document.getElementById("form-task-id").value = task.id;
      document.getElementById("form-title").value = task.title;
      document.getElementById("form-status").value = task.status;
      document.getElementById("form-priority").value = task.priority;
      document.getElementById("form-tags").value = task.tag || "";
      document.getElementById("form-due").value = task.due || "";
      document.getElementById("form-notes").value = task.notes || "";
    } else {
      this.modalTaskHeading.textContent = "Nova Atividade de Estudo (Visual)";
      document.getElementById("form-task-id").value = "";
      document.getElementById("form-due").value = new Date().toISOString().split("T")[0];
    }

    this.updateModalCommandPreview();
    this.taskModal.classList.remove("hidden");
    document.getElementById("form-title").focus();
  }

  closeTaskModal() {
    this.taskModal.classList.add("hidden");
  }

  updateModalCommandPreview() {
    const taskId = document.getElementById("form-task-id").value;
    const title = document.getElementById("form-title").value.trim() || "Minha Nova Atividade";
    const status = document.getElementById("form-status").value;
    const priority = document.getElementById("form-priority").value;
    const tags = document.getElementById("form-tags").value.trim();
    const due = document.getElementById("form-due").value;

    let cmd = "";
    let explanation = "";

    if (taskId) {
      cmd = `agenda task edit ${taskId} --title "${title}" --status "${status}" --priority "${priority}"`;
      if (tags) cmd += ` --tag "${tags}"`;
      if (due) cmd += ` --due "${due}"`;

      explanation = `🎓 <strong>Como o GitHub CLI edita:</strong> O argumento posicional <code class="text-white">${taskId}</code> identifica o registro, e as flags com prefixo duplo <code class="text-cyan-300">--</code> atualizam apenas os campos enviados.`;
    } else {
      cmd = `agenda task create --title "${title}" --priority "${priority}"`;
      if (status !== "todo") cmd += ` --status "${status}"`;
      if (tags) cmd += ` --tag "${tags}"`;
      if (due) cmd += ` --due "${due}"`;

      explanation = `🎓 <strong>Como o GitHub CLI cria:</strong> <code class="text-white">agenda task create</code> é o comando raiz (como <code class="text-white">gh issue create</code>). As opções são enviadas como pares <em>flag + valor</em> (ex: <code class="text-cyan-300">--title "Nome"</code>).`;
    }

    this.modalLiveCommand.textContent = cmd;
    this.modalCmdExplanation.innerHTML = explanation;
  }

  handleTaskFormSubmit() {
    const generatedCmd = this.modalLiveCommand.textContent;
    const taskId = document.getElementById("form-task-id").value;
    const title = document.getElementById("form-title").value.trim();

    this.closeTaskModal();

    if (taskId) {
      this.notifyDidacticAction(
        `Atualização da Atividade #${taskId} via Formulário`,
        generatedCmd,
        `O comando 'agenda task edit' foi disparado com as flags dos campos preenchidos.`
      );
    } else {
      this.notifyDidacticAction(
        `Criação da Atividade "${title}" via Formulário`,
        generatedCmd,
        `O comando 'agenda task create' foi sintetizado visualmente e despachado para o motor CLI.`
      );
    }

    this.executeCommand(generatedCmd);
  }

  switchView(viewName) {
    const kanbanBtn = document.getElementById("btn-view-kanban");
    const tableBtn = document.getElementById("btn-view-table");

    if (viewName === "kanban") {
      this.kanbanView.classList.remove("hidden");
      this.tableView.classList.add("hidden");
      kanbanBtn.classList.add("bg-[#21262d]", "text-[#58a6ff]");
      kanbanBtn.classList.remove("text-gray-400");
      tableBtn.classList.remove("bg-[#21262d]", "text-[#58a6ff]");
      tableBtn.classList.add("text-gray-400");
      this.notifyDidacticAction("Visualização em Kanban", "agenda task list", "Organiza as atividades em 3 colunas baseadas na flag '--status'.");
    } else {
      this.kanbanView.classList.add("hidden");
      this.tableView.classList.remove("hidden");
      tableBtn.classList.add("bg-[#21262d]", "text-[#58a6ff]");
      tableBtn.classList.remove("text-gray-400");
      kanbanBtn.classList.remove("bg-[#21262d]", "text-[#58a6ff]");
      kanbanBtn.classList.add("text-gray-400");
      this.notifyDidacticAction("Visualização em Tabela", "agenda task list", "Apresenta todos os dados tabulados com colunas ID, Status, Título e Prazo.");
    }
  }

  handleKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const rawValue = this.termInput.value;
      this.termInput.value = "";
      
      if (this.interactiveState) {
        this.handleInteractiveInput(rawValue);
      } else {
        if (rawValue.trim() !== "") {
          this.history.push(rawValue);
          if (this.history.length > 50) this.history.shift();
          localStorage.setItem("devagenda_cmd_history", JSON.stringify(this.history));
          this.historyIndex = this.history.length;
        }
        this.executeCommand(rawValue);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.termInput.value = this.history[this.historyIndex] || "";
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.termInput.value = this.history[this.historyIndex] || "";
      } else {
        this.historyIndex = this.history.length;
        this.termInput.value = "";
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      this.handleAutocomplete();
    } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      this.cmdClear();
    }
  }

  handleAutocomplete() {
    const current = this.termInput.value.trimStart();
    const commonCommands = [
      "agenda --help",
      "agenda api zen",
      "agenda github import --repo octocat/Hello-World",
      "agenda task list",
      "agenda task list --status todo",
      "agenda task list --status in-progress",
      "agenda task list --status done",
      "agenda task create",
      "agenda task create --title \"\" --tag \"sql\" --priority high",
      "agenda task edit ",
      "agenda task done ",
      "agenda task delete ",
      "agenda task view ",
      "agenda stats",
      "agenda export",
      "agenda reset",
      "clear"
    ];

    if (!current) {
      this.termInput.value = "agenda ";
      return;
    }

    const matches = commonCommands.filter((cmd) => cmd.startsWith(current));
    if (matches.length === 1) {
      this.termInput.value = matches[0];
    } else if (matches.length > 1) {
      this.printLine(`<span class="text-gray-500">Sugestões:</span> ${matches.map(m => `<span class="text-cyan-400">${m}</span>`).join("  ")}`);
    }
  }

  printWelcome() {
    const banner = `
<span class="text-[#58a6ff] font-bold">dev-agenda CLI</span> <span class="text-gray-400">version 1.4.0</span> <span class="text-blue-400 font-semibold">[REST API & Didactic Edition]</span>
Inspirado na ergonomia do <span class="text-white font-semibold">GitHub CLI (gh)</span> com integração ativa à <span class="text-yellow-400 font-semibold">GitHub REST API</span>.
⚡ <span class="text-cyan-300">Novidade:</span> Digite <span class="text-white font-mono">agenda api zen</span> ou clique no botão <span class="text-white font-semibold">GitHub API (Desafio QA)</span> no topo!
`;
    this.printLine(banner);
  }

  printLine(html) {
    const div = document.createElement("div");
    div.className = "mb-1 leading-relaxed";
    div.innerHTML = html;
    this.termOutput.appendChild(div);
    this.scrollTerminal();
  }

  scrollTerminal() {
    const scrollContainer = document.getElementById("terminal-scroll");
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }

  cmdClear() {
    this.termOutput.innerHTML = "";
  }

  /**
   * Parser da linha de comando
   */
  parseCommandLine(cmdStr) {
    const args = [];
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    let match;
    while ((match = regex.exec(cmdStr)) !== null) {
      args.push(match[1] || match[2] || match[0]);
    }

    if (args.length === 0) return { root: "", sub: "", action: "", positional: [], flags: {} };

    const root = args[0];
    let sub = "";
    let action = "";
    const positional = [];
    const flags = {};

    let i = 1;
    if (args[i] && !args[i].startsWith("-")) {
      sub = args[i++];
    }
    if (args[i] && !args[i].startsWith("-")) {
      action = args[i++];
    }

    while (i < args.length) {
      const token = args[i];
      if (token.startsWith("--")) {
        const flagName = token.slice(2);
        if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
          flags[flagName] = args[++i];
        } else {
          flags[flagName] = true;
        }
      } else if (token.startsWith("-") && token.length === 2) {
        const flagAlias = token.slice(1);
        const aliasMap = { t: "title", p: "priority", s: "status", d: "due", n: "notes", i: "interactive", r: "repo", l: "limit" };
        const flagName = aliasMap[flagAlias] || flagAlias;
        if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
          flags[flagName] = args[++i];
        } else {
          flags[flagName] = true;
        }
      } else {
        positional.push(token);
      }
      i++;
    }

    return { root, sub, action, positional, flags };
  }

  async executeCommand(rawCmd) {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // Echo input with prompt
    this.printLine(`<span class="text-[#58a6ff] font-bold">dev-agenda $</span> <span class="text-white">${this.escapeHtml(trimmed)}</span>`);

    if (trimmed === "clear" || trimmed === "cls") {
      this.cmdClear();
      return;
    }

    const parsed = this.parseCommandLine(trimmed);

    // Root verification
    if (parsed.root !== "agenda") {
      this.printLine(`<span class="text-red-400">comando desconhecido "${parsed.root}"</span>. Você quis dizer <span class="text-yellow-400">agenda</span>? Digite <span class="text-cyan-400">agenda --help</span> para ver o manual.`);
      return;
    }

    if (parsed.flags.help || (!parsed.sub && !parsed.action)) {
      this.printHelp();
      return;
    }

    // Subcommand dispatch
    switch (parsed.sub) {
      case "help":
      case "--help":
        this.printHelp();
        break;

      case "task":
      case "issue":
        this.handleTaskCommand(parsed);
        break;

      case "api":
        await this.handleApiCommand(parsed);
        break;

      case "github":
        await this.handleGithubCommand(parsed);
        break;

      case "stats":
      case "summary":
        this.handleStatsCommand();
        break;

      case "export":
        this.handleExportCommand();
        break;

      case "reset":
        this.handleResetCommand();
        break;

      default:
        this.printLine(`<span class="text-red-400">subcomando desconhecido "${parsed.sub}"</span>. Execute <span class="text-cyan-400">agenda --help</span>.`);
        break;
    }
  }

  printHelp() {
    const helpText = `
<span class="text-[#58a6ff] font-bold">USO DO GITHUB CLI PATTERN</span>
  agenda &lt;comando&gt; &lt;subcomando&gt; [flags]

<span class="text-[#58a6ff] font-bold">COMANDOS PRINCIPAIS</span>
  <span class="text-white font-semibold">task list</span>             Lista as atividades com filtros opcionais
  <span class="text-white font-semibold">task create</span>           Cria uma nova atividade (com suporte a modo interativo)
  <span class="text-white font-semibold">task edit</span>             Modifica campos de uma tarefa por ID
  <span class="text-white font-semibold">task done</span>             Atalho rápido para marcar uma tarefa como concluída
  <span class="text-white font-semibold">task view</span>             Inspeciona os detalhes e anotações completas de uma tarefa
  <span class="text-white font-semibold">task delete</span>           Remove uma atividade da agenda
  <span class="text-white font-semibold">api zen</span>               Testa a conexão REST com a GitHub API (retorna filosofia zen)
  <span class="text-white font-semibold">api &lt;endpoint&gt;</span>        Faz chamadas diretas à GitHub REST API (estilo 'gh api')
  <span class="text-white font-semibold">github import</span>         Importa issues de um repositório como tarefas de estudo
  <span class="text-white font-semibold">stats</span>                 Mostra progresso e métricas com gráfico ASCII
  <span class="text-white font-semibold">export</span>                Exporta backup de todas as tarefas em JSON
  <span class="text-white font-semibold">reset</span>                 Restaura os exercícios modelo do Curso de SQL

<span class="text-[#58a6ff] font-bold">FLAGS E OPÇÕES</span>
  <span class="text-cyan-400">-r, --repo &lt;owner/repo&gt;</span> Repositório alvo do GitHub para importação
  <span class="text-cyan-400">-l, --limit &lt;n&gt;</span>         Quantidade limite de itens (padrão: 3)
  <span class="text-cyan-400">-t, --title &lt;string&gt;</span>     Título da atividade de estudo
  <span class="text-cyan-400">-s, --status &lt;state&gt;</span>     Estado: todo | in-progress | done
  <span class="text-cyan-400">-p, --priority &lt;level&gt;</span>   Prioridade: low | medium | high
  <span class="text-cyan-400">-d, --due &lt;YYYY-MM-DD&gt;</span>   Data limite de entrega
  <span class="text-cyan-400">    --tag &lt;string&gt;</span>       Tags separadas por vírgula (ex: sql,queries)
  <span class="text-cyan-400">-i, --interactive</span>        Força perguntas interativas no terminal
`;
    this.printLine(helpText);
  }

  /**
   * Integração com GitHub REST API (Marcus Vance)
   * Comando: agenda api <endpoint> (ex: agenda api zen ou agenda api repos/octocat/Hello-World)
   */
  async handleApiCommand(parsed) {
    const endpointArg = parsed.action || parsed.positional[0] || "zen";
    const cleanEndpoint = endpointArg.startsWith("/") ? endpointArg.slice(1) : endpointArg;
    const url = `https://api.github.com/${cleanEndpoint}`;

    this.printLine(`<span class="text-gray-400">Iniciando requisição HTTP GET para:</span> <span class="text-cyan-400">${url}</span>...`);
    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        headers: { "Accept": "application/vnd.github.v3+json" }
      });
      const latency = Math.round(performance.now() - startTime);
      const remaining = response.headers.get("x-ratelimit-remaining") || "N/A";
      const status = response.status;

      if (cleanEndpoint === "zen" && response.ok) {
        const text = await response.text();
        this.printLine(`
<div class="my-2 p-3 bg-[#161b22] border border-[#30363d] rounded-lg font-mono">
  <div class="flex items-center justify-between text-xs mb-1.5 pb-1 border-b border-[#30363d]">
    <span class="text-green-400 font-bold">HTTP 200 OK (${latency}ms)</span>
    <span class="text-yellow-400 text-[10px]">X-RateLimit-Remaining: ${remaining}</span>
  </div>
  <div class="text-white italic text-sm mb-1">"${text}"</div>
  <div class="text-gray-500 text-[10px]">Origem: GitHub Zen Philosophy API (api.github.com/zen)</div>
</div>
        `);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const jsonStr = JSON.stringify(data, null, 2);
        const truncated = jsonStr.length > 800 ? jsonStr.slice(0, 800) + "\n... (truncado para legibilidade)" : jsonStr;

        this.printLine(`
<div class="my-2 p-3 bg-[#161b22] border border-[#30363d] rounded-lg font-mono">
  <div class="flex items-center justify-between text-xs mb-1.5 pb-1 border-b border-[#30363d]">
    <span class="text-green-400 font-bold">HTTP ${status} OK (${latency}ms)</span>
    <span class="text-yellow-400 text-[10px]">X-RateLimit-Remaining: ${remaining}</span>
  </div>
  <pre class="text-xs text-gray-300 max-h-48 overflow-y-auto">${this.escapeHtml(truncated)}</pre>
</div>
        `);
      } else {
        this.printLine(`<span class="text-red-400 font-bold">✖ Erro HTTP ${status} (${latency}ms):</span> Não foi possível consultar o endpoint. Cota restante: ${remaining}`);
      }
    } catch (err) {
      this.printLine(`<span class="text-red-500 font-bold">✖ Falha de Conexão:</span> ${err.message}. Verifique sua conexão com a internet.`);
    }
  }

  /**
   * Comando: agenda github import --repo <owner/repo> [--limit 3]
   */
  async handleGithubCommand(parsed) {
    if (parsed.action !== "import") {
      this.printLine(`<span class="text-red-400">ação desconhecida "${parsed.action}" para "agenda github"</span>. Uso: <span class="text-cyan-400">agenda github import --repo &lt;owner/repo&gt;</span>`);
      return;
    }

    const repo = parsed.flags.repo || parsed.positional[0];
    if (!repo) {
      this.printLine(`<span class="text-red-400">flag obrigatória ausente: --repo</span>. Exemplo: <span class="text-yellow-400">agenda github import --repo octocat/Hello-World</span>`);
      return;
    }

    const limit = parseInt(parsed.flags.limit || "3", 10);
    const url = `https://api.github.com/repos/${repo}/issues?state=open&per_page=${limit}`;

    this.printLine(`<span class="text-cyan-400">Buscando issues no repositório "${repo}" via GitHub API...</span>`);

    try {
      const response = await fetch(url, {
        headers: { "Accept": "application/vnd.github.v3+json" }
      });

      if (!response.ok) {
        if (response.status === 404) {
          this.printLine(`<span class="text-red-400 font-bold">✖ Erro 404 Not Found:</span> O repositório "${repo}" não foi encontrado no GitHub. Verifique a grafia 'owner/repo'.`);
        } else if (response.status === 403) {
          this.printLine(`<span class="text-yellow-400 font-bold">✖ Erro 403 Forbidden:</span> Limite de 60 requisições/hora por IP atingido na API pública do GitHub.`);
        } else {
          this.printLine(`<span class="text-red-400 font-bold">✖ Erro HTTP ${response.status}</span> retornado pelo GitHub.`);
        }
        return;
      }

      const issues = await response.json();
      if (!Array.isArray(issues) || issues.length === 0) {
        this.printLine(`<span class="text-yellow-400">Nenhuma issue aberta encontrada no repositório "${repo}".</span>`);
        return;
      }

      issues.forEach(issue => {
        const isBug = (issue.labels || []).some(l => (l.name || "").toLowerCase().includes("bug"));
        const isHigh = (issue.labels || []).some(l => (l.name || "").toLowerCase().includes("high"));

        const newTask = {
          id: this.getNextId(),
          title: `[GH #${issue.number}] ${issue.title}`,
          status: "todo",
          tag: `github,${(issue.labels || []).map(l => l.name).slice(0, 2).join(",") || "issue"}`,
          priority: isBug || isHigh ? "high" : "medium",
          due: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          notes: `Origem: ${issue.html_url}\nCriado por @${issue.user ? issue.user.login : 'user'}\n\n${(issue.body || 'Sem descrição').slice(0, 250)}...`,
          createdAt: new Date().toISOString().split("T")[0]
        };
        this.tasks.push(newTask);
      });

      this.saveTasks();

      this.notifyDidacticAction(
        `Importação de ${issues.length} issues de ${repo}`,
        `agenda github import --repo "${repo}" --limit ${limit}`,
        `Sucesso HTTP 200. As issues foram convertidas para tarefas locais com IDs incrementais.`
      );

      this.printLine(`<span class="text-green-400 font-bold">✓ Sucesso:</span> ${issues.length} issues importadas como atividades de estudo do repositório <span class="text-white">${repo}</span>!`);
    } catch (err) {
      this.printLine(`<span class="text-red-500 font-bold">✖ Falha de Conexão:</span> ${err.message}.`);
    }
  }

  handleTaskCommand(parsed) {
    const action = parsed.action;
    switch (action) {
      case "list":
      case "ls":
        this.cmdTaskList(parsed.flags);
        break;

      case "create":
      case "new":
      case "add":
        this.cmdTaskCreate(parsed.flags);
        break;

      case "edit":
      case "update":
        this.cmdTaskEdit(parsed.positional[0], parsed.flags);
        break;

      case "done":
      case "close":
        this.cmdTaskDone(parsed.positional[0]);
        break;

      case "view":
        this.cmdTaskView(parsed.positional[0]);
        break;

      case "delete":
      case "rm":
        this.cmdTaskDelete(parsed.positional[0]);
        break;

      default:
        this.printLine(`<span class="text-red-400">ação desconhecida "${action || ''}" para "agenda task"</span>.`);
        break;
    }
  }

  cmdTaskList(flags = {}) {
    let list = [...this.tasks];

    if (flags.status) {
      const s = flags.status.toLowerCase();
      list = list.filter((t) => t.status.toLowerCase() === s);
    }
    if (flags.tag) {
      const tagQuery = flags.tag.toLowerCase();
      list = list.filter((t) => t.tag && t.tag.toLowerCase().includes(tagQuery));
    }
    if (flags.priority) {
      list = list.filter((t) => t.priority.toLowerCase() === flags.priority.toLowerCase());
    }

    if (list.length === 0) {
      this.printLine(`<span class="text-yellow-400">Nenhuma atividade encontrada com os filtros especificados.</span>`);
      return;
    }

    this.printLine(`<span class="text-gray-400">Mostrando ${list.length} de ${this.tasks.length} atividades no repositório:</span>\n`);

    // Table Header
    let output = `<div class="font-mono text-xs overflow-x-auto">`;
    output += `<div class="text-gray-400 border-b border-[#30363d] pb-1 mb-1 grid grid-cols-12 gap-2 font-bold">
      <span class="col-span-1">ID</span>
      <span class="col-span-2">STATUS</span>
      <span class="col-span-5">TÍTULO</span>
      <span class="col-span-2">TAGS</span>
      <span class="col-span-1">PRIORIDADE</span>
      <span class="col-span-1 text-right">PRAZO</span>
    </div>`;

    list.forEach((t) => {
      const statusBadge = this.formatStatusBadge(t.status);
      const priorityColor = t.priority === "high" ? "text-red-400" : t.priority === "medium" ? "text-yellow-400" : "text-gray-400";
      output += `<div class="grid grid-cols-12 gap-2 py-1 items-center hover:bg-[#161b22] rounded px-1">
        <span class="col-span-1 text-cyan-400 font-semibold">#${t.id}</span>
        <span class="col-span-2">${statusBadge}</span>
        <span class="col-span-5 text-gray-200 truncate font-medium cursor-pointer" onclick="app.visualInspectTask(${t.id})">${this.escapeHtml(t.title)}</span>
        <span class="col-span-2 text-purple-400 truncate text-[11px]">${t.tag || "-"}</span>
        <span class="col-span-1 font-semibold ${priorityColor}">${t.priority.toUpperCase()}</span>
        <span class="col-span-1 text-right text-gray-400 text-[11px]">${t.due || "-"}</span>
      </div>`;
    });

    output += `</div>`;
    this.printLine(output);
  }

  cmdTaskCreate(flags) {
    if (!flags.title || flags.interactive) {
      this.startInteractiveCreate();
      return;
    }

    const newTask = {
      id: this.getNextId(),
      title: flags.title,
      status: (flags.status || "todo").toLowerCase(),
      tag: flags.tag || "sql",
      priority: (flags.priority || "medium").toLowerCase(),
      due: flags.due || new Date().toISOString().split("T")[0],
      notes: flags.notes || "",
      createdAt: new Date().toISOString().split("T")[0]
    };

    this.tasks.push(newTask);
    this.saveTasks();

    this.printLine(`<span class="text-green-400 font-semibold">✓ Atividade criada #${newTask.id}</span> <span class="text-white">"${this.escapeHtml(newTask.title)}"</span>`);
    this.printLine(`<span class="text-gray-400">  Prioridade: <span class="text-yellow-400">${newTask.priority.toUpperCase()}</span> | Prazo: <span class="text-cyan-400">${newTask.due}</span> | Status: <span class="text-blue-400">${newTask.status.toUpperCase()}</span></span>`);
  }

  startInteractiveCreate() {
    this.interactiveState = {
      step: 0,
      data: { title: "", tag: "", due: "", priority: "", notes: "" }
    };

    this.printLine(`<span class="text-yellow-400 font-semibold">? Criação Interativa (Padrão GitHub CLI)</span>`);
    this.printLine(`<span class="text-gray-400">Pressione Enter para aceitar valores sugeridos ou digite cancel para sair.</span>`);
    this.promptNextInteractiveStep();
  }

  promptNextInteractiveStep() {
    const steps = [
      { key: "title", prompt: `<span class="text-cyan-400">? Título da Atividade:</span> ` },
      { key: "tag", prompt: `<span class="text-cyan-400">? Tags (separadas por vírgula, padrão "sql"):</span> ` },
      { key: "due", prompt: `<span class="text-cyan-400">? Data Limite (YYYY-MM-DD, padrão hoje):</span> ` },
      { key: "priority", prompt: `<span class="text-cyan-400">? Prioridade (low / medium / high, padrão "medium"):</span> ` },
      { key: "notes", prompt: `<span class="text-cyan-400">? Anotações / Observações:</span> ` }
    ];

    const currentStep = steps[this.interactiveState.step];
    this.printLine(currentStep.prompt);
  }

  handleInteractiveInput(value) {
    const trimmed = value.trim();
    if (trimmed.toLowerCase() === "cancel" || trimmed.toLowerCase() === "exit") {
      this.interactiveState = null;
      this.printLine(`<span class="text-red-400">✖ Criação cancelada.</span>`);
      return;
    }

    const stepIndex = this.interactiveState.step;

    if (stepIndex === 0) {
      if (!trimmed) {
        this.printLine(`<span class="text-red-400">Erro: O título não pode ser vazio. Digite um título:</span>`);
        return;
      }
      this.interactiveState.data.title = trimmed;
    } else if (stepIndex === 1) {
      this.interactiveState.data.tag = trimmed || "sql";
    } else if (stepIndex === 2) {
      this.interactiveState.data.due = trimmed || new Date().toISOString().split("T")[0];
    } else if (stepIndex === 3) {
      const p = trimmed.toLowerCase();
      this.interactiveState.data.priority = ["low", "medium", "high"].includes(p) ? p : "medium";
    } else if (stepIndex === 4) {
      this.interactiveState.data.notes = trimmed;
      
      const newTask = {
        id: this.getNextId(),
        title: this.interactiveState.data.title,
        status: "todo",
        tag: this.interactiveState.data.tag,
        priority: this.interactiveState.data.priority,
        due: this.interactiveState.data.due,
        notes: this.interactiveState.data.notes,
        createdAt: new Date().toISOString().split("T")[0]
      };

      this.tasks.push(newTask);
      this.saveTasks();
      this.interactiveState = null;

      this.printLine(`<span class="text-green-400 font-bold">✓ Criada tarefa #${newTask.id}</span> <span class="text-white font-medium">"${this.escapeHtml(newTask.title)}"</span>`);
      return;
    }

    this.interactiveState.step++;
    this.promptNextInteractiveStep();
  }

  cmdTaskEdit(idArg, flags) {
    if (!idArg) {
      this.printLine(`<span class="text-red-400">ID da atividade não informado</span>. Uso: <span class="text-yellow-400">agenda task edit &lt;id&gt; [flags]</span>`);
      return;
    }

    const id = parseInt(idArg.replace("#", ""), 10);
    const task = this.tasks.find((t) => t.id === id);

    if (!task) {
      this.printLine(`<span class="text-red-400">Atividade #${id} não encontrada.</span>`);
      return;
    }

    let modified = false;
    if (flags.title) { task.title = flags.title; modified = true; }
    if (flags.status) { task.status = flags.status.toLowerCase(); modified = true; }
    if (flags.tag) { task.tag = flags.tag; modified = true; }
    if (flags.priority) { task.priority = flags.priority.toLowerCase(); modified = true; }
    if (flags.due) { task.due = flags.due; modified = true; }
    if (flags.notes) { task.notes = flags.notes; modified = true; }

    if (!modified) {
      this.printLine(`<span class="text-yellow-400">Nenhum campo para atualizar na tarefa #${id}.</span> Passe flags como <span class="text-cyan-400">--status</span> ou <span class="text-cyan-400">--priority</span>.`);
      return;
    }

    this.saveTasks();
    this.printLine(`<span class="text-green-400 font-semibold">✓ Atualizada tarefa #${id}</span> ("${this.escapeHtml(task.title)}")`);
  }

  cmdTaskDone(idArg) {
    if (!idArg) {
      this.printLine(`<span class="text-red-400">ID não informado</span>. Uso: <span class="text-yellow-400">agenda task done &lt;id&gt;</span>`);
      return;
    }

    const id = parseInt(idArg.replace("#", ""), 10);
    const task = this.tasks.find((t) => t.id === id);

    if (!task) {
      this.printLine(`<span class="text-red-400">Atividade #${id} não encontrada.</span>`);
      return;
    }

    task.status = "done";
    this.saveTasks();
    this.printLine(`<span class="text-green-400 font-bold">✓ Concluída atividade #${id}</span> (Status: <span class="text-green-300">DONE</span>)`);
  }

  cmdTaskView(idArg) {
    if (!idArg) {
      this.printLine(`<span class="text-red-400">ID não informado</span>. Uso: <span class="text-yellow-400">agenda task view &lt;id&gt;</span>`);
      return;
    }

    const id = parseInt(idArg.replace("#", ""), 10);
    const task = this.tasks.find((t) => t.id === id);

    if (!task) {
      this.printLine(`<span class="text-red-400">Atividade #${id} não encontrada.</span>`);
      return;
    }

    const viewHtml = `
<div class="border border-[#30363d] rounded-lg p-3 bg-[#161b22] my-2">
  <div class="flex items-center justify-between border-b border-[#30363d] pb-2 mb-2">
    <span class="text-white font-bold text-sm">#${task.id} ${this.escapeHtml(task.title)}</span>
    <span>${this.formatStatusBadge(task.status)}</span>
  </div>
  <div class="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-2">
    <div><span class="text-gray-500">Tags:</span> <span class="text-purple-400">${task.tag || "Nenhuma"}</span></div>
    <div><span class="text-gray-500">Prioridade:</span> <span class="font-semibold text-yellow-400">${task.priority.toUpperCase()}</span></div>
    <div><span class="text-gray-500">Prazo:</span> <span class="text-cyan-400">${task.due}</span></div>
    <div><span class="text-gray-500">Criada em:</span> <span class="text-gray-400">${task.createdAt || "-"}</span></div>
  </div>
  <div class="text-xs border-t border-[#30363d] pt-2">
    <span class="text-gray-500 block mb-1">Anotações:</span>
    <span class="text-gray-200">${task.notes ? this.escapeHtml(task.notes) : "<em class='text-gray-500'>Sem anotações adicionadas.</em>"}</span>
  </div>
</div>
`;
    this.printLine(viewHtml);
  }

  cmdTaskDelete(idArg) {
    if (!idArg) {
      this.printLine(`<span class="text-red-400">ID não informado</span>. Uso: <span class="text-yellow-400">agenda task delete &lt;id&gt;</span>`);
      return;
    }

    const id = parseInt(idArg.replace("#", ""), 10);
    const index = this.tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      this.printLine(`<span class="text-red-400">Atividade #${id} não encontrada.</span>`);
      return;
    }

    const removed = this.tasks.splice(index, 1)[0];
    this.saveTasks();
    this.printLine(`<span class="text-green-400">✓ Excluída atividade #${id}</span> ("${this.escapeHtml(removed.title)}")`);
  }

  handleStatsCommand() {
    const total = this.tasks.length;
    const done = this.tasks.filter((t) => t.status === "done").length;
    const inProgress = this.tasks.filter((t) => t.status === "in-progress").length;
    const todo = this.tasks.filter((t) => t.status === "todo").length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    const barLength = 22;
    const filledLength = Math.round((pct / 100) * barLength);
    const progressBar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

    const html = `
<div class="my-2 border border-[#30363d] bg-[#161b22] p-3 rounded-lg">
  <div class="text-white font-bold mb-2">📊 Progresso da Grade de Estudos</div>
  <div class="text-xs mb-2">
    <span class="text-[#58a6ff] font-mono">[${progressBar}]</span> <span class="text-green-400 font-bold">${pct}%</span> concluído
  </div>
  <div class="grid grid-cols-4 gap-2 text-xs">
    <div class="p-2 bg-[#0d1117] rounded border border-[#30363d]">
      <span class="text-gray-400 block text-[10px]">Total</span>
      <span class="text-white font-bold text-sm">${total}</span>
    </div>
    <div class="p-2 bg-[#0d1117] rounded border border-[#30363d]">
      <span class="text-gray-400 block text-[10px]">A Fazer</span>
      <span class="text-yellow-400 font-bold text-sm">${todo}</span>
    </div>
    <div class="p-2 bg-[#0d1117] rounded border border-[#30363d]">
      <span class="text-gray-400 block text-[10px]">Em Curso</span>
      <span class="text-blue-400 font-bold text-sm">${inProgress}</span>
    </div>
    <div class="p-2 bg-[#0d1117] rounded border border-[#30363d]">
      <span class="text-gray-400 block text-[10px]">Concluídas</span>
      <span class="text-green-400 font-bold text-sm">${done}</span>
    </div>
  </div>
</div>
`;
    this.printLine(html);
  }

  handleExportCommand() {
    const dataStr = JSON.stringify(this.tasks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `devagenda-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.printLine(`<span class="text-green-400">✓ Exportadas ${this.tasks.length} atividades em formato JSON.</span>`);
  }

  handleResetCommand() {
    this.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    this.saveTasks();
    this.notifyDidacticAction(
      "Restauração dos Exercícios de SQL",
      "agenda reset",
      "Restaura os tópicos fundamentais do curso de Banco de Dados."
    );
    this.printLine(`<span class="text-green-400">✓ Banco de dados local redefinido com as atividades modelo de SQL!</span>`);
  }

  // Visual Inspection Handlers (Didactic Bridge)
  visualInspectTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    this.notifyDidacticAction(
      `Inspecionar detalhes da atividade #${id}`,
      `agenda task view ${id}`,
      `O subcomando 'view' exibe a ficha completa com tags, anotações e prazos no terminal.`
    );
    this.executeCommand(`agenda task view ${id}`);
    this.termInput.focus();
  }

  visualMoveStatus(id, newStatus) {
    const statusLabels = { todo: "A Fazer", "in-progress": "Em Curso", done: "Concluída" };
    this.notifyDidacticAction(
      `Mover tarefa #${id} para "${statusLabels[newStatus]}"`,
      `agenda task edit ${id} --status "${newStatus}"`,
      `A flag '--status' aceita valores 'todo', 'in-progress' ou 'done' para transição de estados.`
    );
    this.executeCommand(`agenda task edit ${id} --status "${newStatus}"`);
    this.termInput.focus();
  }

  visualMarkDone(id) {
    this.notifyDidacticAction(
      `Marcar atividade #${id} como concluída`,
      `agenda task done ${id}`,
      `Atalho rápido similar ao 'gh issue close'. Altera diretamente o status para DONE.`
    );
    this.executeCommand(`agenda task done ${id}`);
    this.termInput.focus();
  }

  visualDeleteTask(id) {
    const task = this.tasks.find(t => t.id === id);
    const title = task ? `"${task.title}"` : `#${id}`;
    if (!confirm(`Deseja realmente excluir a tarefa ${title}?`)) return;

    this.notifyDidacticAction(
      `Excluir atividade #${id}`,
      `agenda task delete ${id}`,
      `O subcomando 'delete' remove o registro selecionado pelo seu identificador único.`
    );
    this.executeCommand(`agenda task delete ${id}`);
    this.termInput.focus();
  }

  // Render Kanban Board
  renderBoard() {
    const cols = {
      todo: document.getElementById("col-todo-list"),
      "in-progress": document.getElementById("col-inprogress-list"),
      done: document.getElementById("col-done-list")
    };

    if (!cols.todo) return;

    cols.todo.innerHTML = "";
    cols["in-progress"].innerHTML = "";
    cols.done.innerHTML = "";

    this.tasks.forEach((t) => {
      const card = document.createElement("div");
      card.className = "task-card bg-[#161b22] border border-[#30363d] rounded-xl p-3 text-left mb-2.5 cursor-pointer shadow-sm";
      
      const priorityColor = t.priority === "high" 
        ? "bg-red-950/60 text-red-300 border-red-800" 
        : t.priority === "medium" 
        ? "bg-yellow-950/60 text-yellow-300 border-yellow-800" 
        : "bg-gray-800 text-gray-300 border-gray-700";

      card.innerHTML = `
        <div class="flex items-center justify-between text-xs mb-1.5">
          <span class="font-mono text-cyan-400 font-bold">#${t.id}</span>
          <span class="text-[10px] px-2 py-0.5 rounded border ${priorityColor} uppercase font-bold tracking-wider">${t.priority}</span>
        </div>

        <h4 class="text-sm font-semibold text-gray-100 mb-2 leading-snug">${this.escapeHtml(t.title)}</h4>

        <div class="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-[#30363d]">
          <span class="text-purple-400 font-medium truncate max-w-[120px]">🏷️ ${t.tag || "-"}</span>
          <span class="text-gray-400">📅 ${t.due}</span>
        </div>

        <!-- Quick Visual Action Bar (Didactic Bridge) -->
        <div class="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-[#30363d]/60 text-xs">
          
          <!-- Move Status Selector -->
          <div class="flex items-center gap-1" onclick="event.stopPropagation()">
            <label class="text-[10px] text-gray-500">Mover:</label>
            <select class="bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5 text-[10px] text-gray-300 outline-none focus:border-[#58a6ff]" onchange="app.visualMoveStatus(${t.id}, this.value)">
              <option value="todo" ${t.status === 'todo' ? 'selected' : ''}>A Fazer</option>
              <option value="in-progress" ${t.status === 'in-progress' ? 'selected' : ''}>Em Curso</option>
              <option value="done" ${t.status === 'done' ? 'selected' : ''}>Concluída</option>
            </select>
          </div>

          <div class="flex items-center gap-1">
            <button class="px-2 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-cyan-300 rounded text-[10px] border border-[#30363d] transition" onclick="event.stopPropagation(); app.openTaskModal(app.tasks.find(x => x.id === ${t.id}))" title="Editar e ver comando">✏️</button>
            ${t.status !== "done" ? `<button class="px-2 py-0.5 bg-green-900/40 hover:bg-green-700 text-green-300 rounded text-[10px] border border-green-800 transition" onclick="event.stopPropagation(); app.visualMarkDone(${t.id})" title="Marcar concluída">✓</button>` : ''}
            <button class="px-2 py-0.5 bg-red-950/40 hover:bg-red-800 text-red-300 rounded text-[10px] border border-red-900 transition" onclick="event.stopPropagation(); app.visualDeleteTask(${t.id})" title="Excluir">✕</button>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        this.visualInspectTask(t.id);
      });

      if (cols[t.status]) {
        cols[t.status].appendChild(card);
      }
    });

    document.getElementById("count-todo").textContent = this.tasks.filter((t) => t.status === "todo").length;
    document.getElementById("count-inprogress").textContent = this.tasks.filter((t) => t.status === "in-progress").length;
    document.getElementById("count-done").textContent = this.tasks.filter((t) => t.status === "done").length;
  }

  // Render Table View
  renderTable() {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = "";

    this.tasks.forEach((t) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-[#30363d] hover:bg-[#161b22] text-xs transition";
      tr.innerHTML = `
        <td class="py-2.5 px-3 font-mono text-cyan-400 font-bold">#${t.id}</td>
        <td class="py-2.5 px-3">${this.formatStatusBadge(t.status)}</td>
        <td class="py-2.5 px-3 font-medium text-gray-200 cursor-pointer" onclick="app.visualInspectTask(${t.id})">${this.escapeHtml(t.title)}</td>
        <td class="py-2.5 px-3 text-purple-400">${t.tag || "-"}</td>
        <td class="py-2.5 px-3"><span class="font-bold ${t.priority === 'high' ? 'text-red-400' : t.priority === 'medium' ? 'text-yellow-400' : 'text-gray-400'}">${t.priority.toUpperCase()}</span></td>
        <td class="py-2.5 px-3 text-gray-400 font-mono">${t.due}</td>
        <td class="py-2.5 px-3 text-right">
          <button class="text-blue-400 hover:underline mr-2" onclick="app.visualInspectTask(${t.id})">Inspecionar</button>
          <button class="text-yellow-400 hover:underline mr-2" onclick="app.openTaskModal(app.tasks.find(x => x.id === ${t.id}))">Editar</button>
          <button class="text-red-400 hover:underline" onclick="app.visualDeleteTask(${t.id})">Excluir</button>
        </td>
      `;
      this.tableBody.appendChild(tr);
    });
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.status === "done").length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

    const pendingTasks = this.tasks
      .filter((t) => t.status !== "done" && t.due)
      .sort((a, b) => new Date(a.due) - new Date(b.due));
    const nextDue = pendingTasks.length > 0 ? pendingTasks[0].due : "None";

    if (this.statTotal) this.statTotal.textContent = total;
    if (this.statCompleted) this.statCompleted.textContent = completed;
    if (this.statProgress) this.statProgress.textContent = `${pct}%`;
    if (this.statNextDue) this.statNextDue.textContent = nextDue;
  }

  formatStatusBadge(status) {
    if (status === "done") {
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-green-950 text-green-400 border border-green-800">✓ CONCLUÍDA</span>`;
    }
    if (status === "in-progress") {
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-yellow-950 text-yellow-400 border border-yellow-800">● EM CURSO</span>`;
    }
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-800 text-gray-300 border border-gray-700">○ A FAZER</span>`;
  }

  getNextId() {
    if (this.tasks.length === 0) return 1;
    return Math.max(...this.tasks.map((t) => t.id)) + 1;
  }

  escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
  window.app = new DevAgendaApp();
});
