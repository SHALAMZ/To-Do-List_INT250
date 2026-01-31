(() => {
      const STORAGE_KEY = "todo_tasks_v1";

      // elements
      const taskInput = document.getElementById("taskInput");
      const addTaskBtn = document.getElementById("addTaskBtn");
      const searchInput = document.getElementById("searchInput");
      const emptyState = document.getElementById("emptyState");
      const taskList = document.getElementById("taskList");
      const statsText = document.getElementById("statsText");

      const priorityBtn = document.getElementById("priorityBtn");
      const priorityMenu = document.getElementById("priorityMenu");

      const markAllBtn = document.getElementById("markAllBtn");
      const clearCompletedBtn = document.getElementById("clearCompletedBtn");
      const resetListBtn = document.getElementById("resetListBtn");

      let tasks = loadTasks();
      let currentPriority = "medium";
      let currentFilter = "all";
      let currentQuery = "";

      function loadTasks() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      }

      function saveTasks() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      }

      function escapeHtml(str) {
        return String(str)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      function formatDate(d = new Date()) {
        return d.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        }).replace(" at", ",");
      }

      function uid() {
        return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      }

      function getVisibleTasks() {
        let list = [...tasks];

        if (currentFilter === "active") list = list.filter(t => !t.done);
        if (currentFilter === "completed") list = list.filter(t => t.done);

        if (currentQuery.trim()) {
          const q = currentQuery.trim().toLowerCase();
          list = list.filter(t => t.title.toLowerCase().includes(q));
        }

        list.sort((a, b) => b.createdAt - a.createdAt);
        return list;
      }

      function render() {
        const visible = getVisibleTasks();

        const total = tasks.length;
        const active = tasks.filter(t => !t.done).length;
        statsText.textContent = `${total} total • ${active} active`;

        const showEmpty = tasks.length === 0;
        emptyState.style.display = showEmpty ? "block" : "none";
        taskList.style.display = showEmpty ? "none" : "block";

        if (showEmpty) {
          taskList.innerHTML = "";
          return;
        }

        if (visible.length === 0) {
          taskList.innerHTML = `
            <div class="empty-state mt-3 px-3 py-4 text-center">
              <div class="text-light fw-semibold mb-1">No results</div>
              <div class="text-secondary">Try a different search or filter.</div>
            </div>
          `;
          return;
        }

        taskList.innerHTML = visible.map(t => `
          <div class="task-item d-flex align-items-center justify-content-between px-3 py-3 mb-3 ${t.done ? "completed" : ""}" data-id="${t.id}">
            <div class="d-flex align-items-start gap-3">
              <button type="button" class="task-check ${t.done ? "done" : ""}" data-action="toggle" aria-label="Mark as done">
                ${t.done ? "✓" : ""}
              </button>

              <div>
                <div class="d-flex align-items-center gap-2">
                  <div class="task-title text-light fw-semibold">${escapeHtml(t.title)}</div>
                  <span class="task-badge ${t.priority}">${t.priority[0].toUpperCase() + t.priority.slice(1)}</span>
                </div>

                <div class="task-meta text-secondary mt-1">
                  <i class="bi bi-clock me-1"></i> ${escapeHtml(t.time)}
                </div>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2">
              <button type="button" class="task-action" data-action="edit" aria-label="Edit">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="task-action" data-action="delete" aria-label="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        `).join("");
      }

      function addTask() {
        const title = taskInput.value.trim();
        if (!title) return;

        tasks.push({
          id: uid(),
          title,
          priority: currentPriority,
          done: false,
          time: formatDate(new Date()),
          createdAt: Date.now()
        });

        taskInput.value = "";
        saveTasks();
        render();
      }

      function toggleDone(id) {
        const t = tasks.find(x => x.id === id);
        if (!t) return;
        t.done = !t.done;
        saveTasks();
        render();
      }

      function deleteTask(id) {
        tasks = tasks.filter(x => x.id !== id);
        saveTasks();
        render();
      }

      function editTask(id) {
        const t = tasks.find(x => x.id === id);
        if (!t) return;

        const next = prompt("Edit task title:", t.title);
        if (next === null) return;
        const title = next.trim();
        if (!title) return;

        t.title = title;
        saveTasks();
        render();
      }

      // events
      addTaskBtn.addEventListener("click", addTask);
      taskInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") addTask();
      });

      priorityMenu.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-priority]");
        if (!btn) return;

        priorityMenu.querySelectorAll(".dropdown-item").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");

        currentPriority = btn.dataset.priority;
        const label = currentPriority[0].toUpperCase() + currentPriority.slice(1);
        priorityBtn.textContent = `${label} priority`;
      });

      searchInput.addEventListener("input", (e) => {
        currentQuery = e.target.value;
        render();
      });

      document.querySelectorAll('input[name="taskFilter"]').forEach(r => {
        r.addEventListener("change", (e) => {
          currentFilter = e.target.value;
          render();
        });
      });

      taskList.addEventListener("click", (e) => {
        const card = e.target.closest(".task-item");
        if (!card) return;
        const id = card.dataset.id;

        const actionEl = e.target.closest("[data-action]");
        if (!actionEl) return;

        const action = actionEl.dataset.action;
        if (action === "toggle") toggleDone(id);
        if (action === "delete") deleteTask(id);
        if (action === "edit") editTask(id);
      });

      markAllBtn.addEventListener("click", () => {
        tasks.forEach(t => t.done = true);
        saveTasks();
        render();
      });

      clearCompletedBtn.addEventListener("click", () => {
        tasks = tasks.filter(t => !t.done);
        saveTasks();
        render();
      });

      resetListBtn.addEventListener("click", () => {
        tasks = [];
        localStorage.removeItem(STORAGE_KEY);
        render();
      });

      render();
    })();