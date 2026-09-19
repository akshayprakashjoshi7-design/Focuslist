/* =========================================================
   FOCUSLIST — PRODUCTIVITY ENGINE
   Frontend only / LocalStorage / Vanilla JS
========================================================= */

"use strict";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE = {
    tasks: "focuslist_tasks_v2",
    profile: "focuslist_profile_v2",
    theme: "focuslist_theme_v2",
    sidebar: "focuslist_sidebar_v2",
    seeded: "focuslist_seeded_v2"
};

/* =========================================================
   DEFAULT STATE
========================================================= */

const state = {
    tasks: [],
    profile: {
        name: "Akshay",
        email: ""
    },

    theme: "dark",

    sidebarCollapsed: false,

    filters: {
        status: "all",
        priority: "all",
        search: "",
        sort: "newest"
    },

    currentView: "dashboard",

    editingTaskId: null,

    confirmAction: null
};

/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

/* =========================================================
   DOM REFERENCES
========================================================= */

const DOM = {
    body: document.body,
    appShell: $("#appShell"),
    sidebar: $("#sidebar"),
    sidebarBackdrop: $("#sidebarBackdrop"),

    taskList: $("#taskList"),
    emptyState: $("#emptyState"),

    searchInput: $("#searchInput"),
    clearSearch: $("#clearSearch"),

    filterPanel: $("#filterPanel"),
    filterToggle: $("#filterToggle"),

    sortSelect: $("#sortSelect"),

    taskModal: $("#taskModal"),
    profileModal: $("#profileModal"),
    confirmModal: $("#confirmModal"),

    taskForm: $("#taskForm"),
    profileForm: $("#profileForm"),

    taskId: $("#taskId"),
    taskTitle: $("#taskTitle"),
    taskDescription: $("#taskDescription"),
    taskPriority: $("#taskPriority"),
    taskDueDate: $("#taskDueDate"),
    taskDueTime: $("#taskDueTime"),
    taskTags: $("#taskTags"),
    taskPinned: $("#taskPinned"),

    profileName: $("#profileName"),
    profileEmail: $("#profileEmail"),

    toastContainer: $("#toastContainer"),

    focusOverlay: $("#focusOverlay")
};

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", init);

function init() {
    loadState();
    bindEvents();
    applyTheme();
    applySidebarState();
    renderAll();

    setTimeout(() => {
        showToast(
            "FocusList ready. Your workspace is saved locally.",
            "info"
        );
    }, 500);
}

/* =========================================================
   LOAD STATE
========================================================= */

function loadState() {
    try {
        const storedTasks = localStorage.getItem(STORAGE.tasks);

        if (storedTasks) {
            const parsed = JSON.parse(storedTasks);

            if (Array.isArray(parsed)) {
                state.tasks = parsed;
            }
        }

        const storedProfile = localStorage.getItem(STORAGE.profile);

        if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);

            if (parsedProfile && typeof parsedProfile === "object") {
                state.profile = {
                    ...state.profile,
                    ...parsedProfile
                };
            }
        }

        const savedTheme = localStorage.getItem(STORAGE.theme);

        if (
            savedTheme === "dark" ||
            savedTheme === "light"
        ) {
            state.theme = savedTheme;
        } else {
            state.theme =
                window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: light)").matches
                    ? "light"
                    : "dark";
        }

        const savedSidebar = localStorage.getItem(STORAGE.sidebar);

        state.sidebarCollapsed = savedSidebar === "true";

        /*
         * First-run demo tasks.
         */
        if (
            !localStorage.getItem(STORAGE.seeded) &&
            state.tasks.length === 0
        ) {
            state.tasks = createDemoTasks();

            localStorage.setItem(
                STORAGE.seeded,
                "true"
            );

            saveTasks();
        }

    } catch (error) {
        console.error("Failed to load state:", error);

        state.tasks = [];
    }
}

/* =========================================================
   DEMO TASKS
========================================================= */

function createDemoTasks() {
    const today = getDateOnly(new Date());

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
        {
            id: createId(),
            title: "Complete Physics assignment",
            description:
                "Finish numerical problems and revise the important formulas.",
            priority: "high",
            dueDate: formatDateInput(today),
            dueTime: "19:00",
            tags: ["college", "physics"],
            pinned: true,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null
        },

        {
            id: createId(),
            title: "Work on FocusList UI",
            description:
                "Improve responsive layout and test the mobile experience.",
            priority: "medium",
            dueDate: formatDateInput(tomorrow),
            dueTime: "20:30",
            tags: ["coding", "project"],
            pinned: false,
            completed: false,
            createdAt: new Date(
                Date.now() - 1000 * 60 * 60 * 4
            ).toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null
        },

        {
            id: createId(),
            title: "Review chemistry notes",
            description:
                "Revise molarity, normality, equivalent weight and N-factor.",
            priority: "low",
            dueDate: "",
            dueTime: "",
            tags: ["study", "chemistry"],
            pinned: false,
            completed: true,
            createdAt: new Date(
                Date.now() - 1000 * 60 * 60 * 24
            ).toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
        }
    ];
}

/* =========================================================
   SAVE
========================================================= */

function saveTasks() {
    localStorage.setItem(
        STORAGE.tasks,
        JSON.stringify(state.tasks)
    );
}

function saveProfile() {
    localStorage.setItem(
        STORAGE.profile,
        JSON.stringify(state.profile)
    );
}

/* =========================================================
   ID
========================================================= */

function createId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8)
    );
}

/* =========================================================
   EVENT BINDINGS
========================================================= */

function bindEvents() {

    /* Sidebar */

    $("#openSidebar").addEventListener(
        "click",
        openMobileSidebar
    );

    $("#closeSidebar").addEventListener(
        "click",
        closeMobileSidebar
    );

    DOM.sidebarBackdrop.addEventListener(
        "click",
        closeMobileSidebar
    );

    $("#collapseSidebar").addEventListener(
        "click",
        toggleSidebar
    );

    /* Profile */

    $("#openProfile").addEventListener(
        "click",
        openProfileModal
    );

    $("#profileButton").addEventListener(
        "click",
        openProfileModal
    );

    $("#mobileProfileBtn").addEventListener(
        "click",
        openProfileModal
    );

    DOM.profileForm.addEventListener(
        "submit",
        saveProfileForm
    );

    /* Add task */

    $("#addTaskBtn").addEventListener(
        "click",
        () => openTaskModal()
    );

    $("#quickAddNav").addEventListener(
        "click",
        () => {
            closeMobileSidebar();
            openTaskModal();
        }
    );

    $("#mobileAddBtn").addEventListener(
        "click",
        () => openTaskModal()
    );

    $("#emptyAddBtn").addEventListener(
        "click",
        () => openTaskModal()
    );

    $("#focusAddBtn").addEventListener(
        "click",
        () => {
            closeFocusMode();
            openTaskModal();
        }
    );

    /* Task form */

    DOM.taskForm.addEventListener(
        "submit",
        handleTaskSubmit
    );

    /* Search */

    DOM.searchInput.addEventListener(
        "input",
        handleSearch
    );

    DOM.clearSearch.addEventListener(
        "click",
        clearSearch
    );

    $("#globalSearchBtn").addEventListener(
        "click",
        focusSearch
    );

    /* Filter */

    DOM.filterToggle.addEventListener(
        "click",
        toggleFilterPanel
    );

    $$("#statusFilters .segment").forEach(button => {
        button.addEventListener(
            "click",
            () => {
                state.filters.status =
                    button.dataset.status;

                updateFilterButtons();
                renderTasks();
                updateStats();
            }
        );
    });

    $$(".priority-chip").forEach(button => {
        button.addEventListener(
            "click",
            () => {
                state.filters.priority =
                    button.dataset.priority;

                updateFilterButtons();
                renderTasks();
            }
        );
    });

    DOM.sortSelect.addEventListener(
        "change",
        () => {
            state.filters.sort =
                DOM.sortSelect.value;

            renderTasks();
        }
    );

    /* Navigation */

    $$(".nav-item[data-view]").forEach(button => {
        button.addEventListener(
            "click",
            () => {
                setView(button.dataset.view);
                closeMobileSidebar();
            }
        );
    });

    $$(".mobile-nav-item[data-mobile-view]").forEach(button => {
        button.addEventListener(
            "click",
            () => {
                setView(button.dataset.mobileView);
            }
        );
    });

    $("#brandHome").addEventListener(
        "click",
        event => {
            event.preventDefault();
            setView("dashboard");
        }
    );

    /* Theme */

    $("#themeToggle").addEventListener(
        "click",
        cycleTheme
    );

    $("#themeSidebarBtn").addEventListener(
        "click",
        cycleTheme
    );

    /* Focus */

    $("#focusModeBtn").addEventListener(
        "click",
        openFocusMode
    );

    $("#closeFocusMode").addEventListener(
        "click",
        closeFocusMode
    );

    /* Data */

    $("#exportBtn").addEventListener(
        "click",
        exportData
    );

    $("#exportNav").addEventListener(
        "click",
        () => {
            closeMobileSidebar();
            exportData();
        }
    );

    $("#importNav").addEventListener(
        "click",
        () => {
            closeMobileSidebar();
            $("#importFile").click();
        }
    );

    $("#importFile").addEventListener(
        "change",
        handleImport
    );

    $("#clearCompletedBtn").addEventListener(
        "click",
        clearCompleted
    );

    $("#resetBtn").addEventListener(
        "click",
        resetWorkspace
    );

    /* Confirmation */

    $("#confirmAction").addEventListener(
        "click",
        executeConfirmation
    );

    /* Modal close */

    $$("[data-close-modal]").forEach(button => {
        button.addEventListener(
            "click",
            () => {
                closeModal(
                    button.dataset.closeModal
                );
            }
        );
    });

    /* Keyboard shortcuts */

    document.addEventListener(
        "keydown",
        handleKeyboard
    );

    /* Escape modal by clicking overlay */

    [DOM.taskModal, DOM.profileModal, DOM.confirmModal]
        .forEach(overlay => {

            overlay.addEventListener(
                "click",
                event => {
                    if (event.target === overlay) {
                        closeModal(overlay.id);
                    }
                }
            );

        });
}

/* =========================================================
   NAVIGATION
========================================================= */

function setView(view) {

    state.currentView = view;

    if (view === "dashboard") {
        state.filters.status = "all";
    }

    if (view === "all") {
        state.filters.status = "all";
    }

    if (view === "active") {
        state.filters.status = "active";
    }

    if (view === "completed") {
        state.filters.status = "completed";
    }

    updateNavigation();

    renderTasks();
    updateStats();

    const titles = {
        dashboard: "Dashboard",
        all: "All Tasks",
        active: "Active Tasks",
        completed: "Completed Tasks"
    };

    $("#breadcrumbCurrent").textContent =
        titles[view] || "Dashboard";

    $("#taskSectionTitle").textContent =
        view === "dashboard"
            ? "All Tasks"
            : titles[view];

    if (window.innerWidth < 850) {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
}

function updateNavigation() {

    $$(".nav-item[data-view]").forEach(button => {

        const buttonView =
            button.dataset.view;

        const shouldActive =
            buttonView === state.currentView;

        button.classList.toggle(
            "active",
            shouldActive
        );

    });

    $$(".mobile-nav-item[data-mobile-view]")
        .forEach(button => {

            const buttonView =
                button.dataset.mobileView;

            let active = false;

            if (
                state.currentView === "dashboard" &&
                buttonView === "dashboard"
            ) {
                active = true;
            }

            if (
                state.currentView === "all" &&
                buttonView === "all"
            ) {
                active = true;
            }

            if (
                state.currentView === "active" &&
                buttonView === "active"
            ) {
                active = true;
            }

            button.classList.toggle(
                "active",
                active
            );

        });
}

/* =========================================================
   SIDEBAR
========================================================= */

function toggleSidebar() {

    state.sidebarCollapsed =
        !state.sidebarCollapsed;

    localStorage.setItem(
        STORAGE.sidebar,
        state.sidebarCollapsed
    );

    applySidebarState();
}

function applySidebarState() {

    DOM.appShell.classList.toggle(
        "sidebar-collapsed",
        state.sidebarCollapsed
    );
}

function openMobileSidebar() {

    DOM.sidebar.classList.add(
        "mobile-open"
    );

    DOM.sidebarBackdrop.classList.add(
        "show"
    );
}

function closeMobileSidebar() {

    DOM.sidebar.classList.remove(
        "mobile-open"
    );

    DOM.sidebarBackdrop.classList.remove(
        "show"
    );
}

/* =========================================================
   THEME
========================================================= */

function cycleTheme() {

    state.theme =
        state.theme === "dark"
            ? "light"
            : "dark";

    localStorage.setItem(
        STORAGE.theme,
        state.theme
    );

    applyTheme();

    showToast(
        `${capitalize(state.theme)} mode enabled.`,
        "info"
    );
}

function applyTheme() {

    DOM.body.dataset.theme =
        state.theme;

    const icon =
        state.theme === "dark"
            ? "☀"
            : "☾";

    $("#themeToggle").textContent = icon;
    $("#themeSidebarIcon").textContent = icon;
}

/* =========================================================
   TASK MODAL
========================================================= */

function openTaskModal(taskId = null) {

    state.editingTaskId = taskId;

    DOM.taskForm.reset();

    if (taskId) {

        const task =
            state.tasks.find(
                item => item.id === taskId
            );

        if (!task) return;

        $("#taskModalKicker").textContent =
            "EDIT TASK";

        $("#taskModalTitle").textContent =
            "Update task";

        $("#saveTaskText").textContent =
            "Save Changes";

        DOM.taskId.value = task.id;
        DOM.taskTitle.value = task.title;
        DOM.taskDescription.value =
            task.description || "";

        DOM.taskPriority.value =
            task.priority || "medium";

        DOM.taskDueDate.value =
            task.dueDate || "";

        DOM.taskDueTime.value =
            task.dueTime || "";

        DOM.taskTags.value =
            Array.isArray(task.tags)
                ? task.tags.join(", ")
                : "";

        DOM.taskPinned.checked =
            Boolean(task.pinned);

    } else {

        $("#taskModalKicker").textContent =
            "NEW TASK";

        $("#taskModalTitle").textContent =
            "Create a task";

        $("#saveTaskText").textContent =
            "Create Task";

        DOM.taskPriority.value =
            "medium";

        DOM.taskPinned.checked =
            false;
    }

    openModal("taskModal");

    setTimeout(
        () => DOM.taskTitle.focus(),
        100
    );
}

/* =========================================================
   TASK SUBMIT
========================================================= */

function handleTaskSubmit(event) {

    event.preventDefault();

    const title =
        DOM.taskTitle.value.trim();

    if (!title) {
        showToast(
            "Please enter a task title.",
            "error"
        );

        DOM.taskTitle.focus();
        return;
    }

    const description =
        DOM.taskDescription.value.trim();

    const priority =
        DOM.taskPriority.value;

    const dueDate =
        DOM.taskDueDate.value;

    const dueTime =
        DOM.taskDueTime.value;

    const tags =
        DOM.taskTags.value
            .split(",")
            .map(tag => tag.trim())
            .filter(Boolean)
            .slice(0, 8);

    const pinned =
        DOM.taskPinned.checked;

    if (state.editingTaskId) {

        const task =
            state.tasks.find(
                item =>
                    item.id ===
                    state.editingTaskId
            );

        if (!task) return;

        task.title = title;
        task.description = description;
        task.priority = priority;
        task.dueDate = dueDate;
        task.dueTime = dueTime;
        task.tags = tags;
        task.pinned = pinned;
        task.updatedAt =
            new Date().toISOString();

        saveTasks();

        closeModal("taskModal");

        showToast(
            "Task updated successfully.",
            "success"
        );

    } else {

        const task = {
            id: createId(),
            title,
            description,
            priority,
            dueDate,
            dueTime,
            tags,
            pinned,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null
        };

        state.tasks.unshift(task);

        saveTasks();

        closeModal("taskModal");

        showToast(
            "New task created.",
            "success"
        );
    }

    renderAll();
}

/* =========================================================
   TASK ACTIONS
========================================================= */

function toggleTask(taskId) {

    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) return;

    task.completed =
        !task.completed;

    task.updatedAt =
        new Date().toISOString();

    task.completedAt =
        task.completed
            ? new Date().toISOString()
            : null;

    saveTasks();

    renderAll();

    showToast(
        task.completed
            ? "Task completed. Nice work!"
            : "Task moved back to active.",
        task.completed
            ? "success"
            : "info"
    );
}

function deleteTask(taskId) {

    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) return;

    openConfirmation({
        title: "Delete this task?",
        text:
            `"${task.title}" will be permanently removed from this workspace.`,
        icon: "×",
        action: () => {

            state.tasks =
                state.tasks.filter(
                    item => item.id !== taskId
                );

            saveTasks();
            renderAll();

            showToast(
                "Task deleted.",
                "success"
            );
        }
    });
}

function togglePin(taskId) {

    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) return;

    task.pinned =
        !task.pinned;

    task.updatedAt =
        new Date().toISOString();

    saveTasks();

    renderTasks();

    showToast(
        task.pinned
            ? "Task pinned to top."
            : "Task unpinned.",
        "info"
    );
}

/* =========================================================
   TASK RENDERING
========================================================= */

function renderTasks() {

    const tasks =
        getFilteredTasks();

    DOM.taskList.innerHTML = "";

    $("#resultCount").textContent =
        `${tasks.length} ${
            tasks.length === 1
                ? "task"
                : "tasks"
        }`;

    if (tasks.length === 0) {

        DOM.emptyState.classList.remove(
            "hidden"
        );

        const hasFilters =
            Boolean(state.filters.search) ||
            state.filters.status !== "all" ||
            state.filters.priority !== "all";

        if (hasFilters) {

            $("#emptyTitle").textContent =
                "Nothing matches your filters";

            $("#emptyText").textContent =
                "Try changing the search, status or priority filter.";

        } else {

            $("#emptyTitle").textContent =
                "Your workspace is clear";

            $("#emptyText").textContent =
                "Create a task and start building momentum.";
        }

        return;
    }

    DOM.emptyState.classList.add(
        "hidden"
    );

    const fragment =
        document.createDocumentFragment();

    tasks.forEach(task => {

        const card =
            createTaskElement(task);

        fragment.appendChild(card);

    });

    DOM.taskList.appendChild(fragment);
}

/* =========================================================
   TASK FILTER
========================================================= */

function getFilteredTasks() {

    let tasks = [...state.tasks];

    const search =
        state.filters.search
            .trim()
            .toLowerCase();

    if (search) {

        tasks =
            tasks.filter(task => {

                const title =
                    task.title?.toLowerCase() || "";

                const description =
                    task.description?.toLowerCase() || "";

                const tags =
                    Array.isArray(task.tags)
                        ? task.tags.join(" ").toLowerCase()
                        : "";

                return (
                    title.includes(search) ||
                    description.includes(search) ||
                    tags.includes(search)
                );
            });
    }

    if (state.filters.status === "active") {

        tasks =
            tasks.filter(
                task => !task.completed
            );
    }

    if (state.filters.status === "completed") {

        tasks =
            tasks.filter(
                task => task.completed
            );
    }

    if (state.filters.priority !== "all") {

        tasks =
            tasks.filter(
                task =>
                    task.priority ===
                    state.filters.priority
            );
    }

    tasks.sort(sortTasks);

    return tasks;
}

/* =========================================================
   SORT
========================================================= */

function sortTasks(a, b) {

    /*
     * Pinned tasks always come first.
     */
    if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
    }

    switch (state.filters.sort) {

        case "oldest":
            return (
                new Date(a.createdAt) -
                new Date(b.createdAt)
            );

        case "priority": {

            const priorityWeight = {
                high: 1,
                medium: 2,
                low: 3
            };

            return (
                (priorityWeight[a.priority] || 2) -
                (priorityWeight[b.priority] || 2)
            );
        }

        case "due": {

            const aDate =
                getTaskDueTimestamp(a);

            const bDate =
                getTaskDueTimestamp(b);

            if (aDate === Infinity) return 1;
            if (bDate === Infinity) return -1;

            return aDate - bDate;
        }

        case "alpha":

            return a.title.localeCompare(
                b.title
            );

        case "newest":
        default:

            return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
            );
    }
}

/* =========================================================
   TASK ELEMENT
========================================================= */

function createTaskElement(task) {

    const article =
        document.createElement("article");

    article.className =
        "task-card" +
        (task.completed
            ? " completed"
            : "") +
        (task.pinned
            ? " pinned"
            : "");

    const dueInfo =
        getDueInfo(task);

    const tagsHTML =
        Array.isArray(task.tags)
            ? task.tags
                .slice(0, 4)
                .map(
                    tag =>
                        `<span class="tag-pill">#${escapeHTML(tag)}</span>`
                )
                .join("")
            : "";

    const descriptionHTML =
        task.description
            ? `
                <p class="task-description">
                    ${escapeHTML(task.description)}
                </p>
            `
            : "";

    const dueHTML =
        task.dueDate
            ? `
                <span class="meta-pill due-pill ${dueInfo.className}">
                    ${dueInfo.icon} ${escapeHTML(dueInfo.text)}
                </span>
            `
            : "";

    article.innerHTML = `
        <span class="task-priority-line ${escapeHTML(task.priority)}"></span>

        <button
            class="task-check"
            data-action="toggle"
            data-id="${escapeHTML(task.id)}"
            title="${
                task.completed
                    ? "Mark active"
                    : "Mark complete"
            }"
            aria-label="${
                task.completed
                    ? "Mark task active"
                    : "Mark task complete"
            }"
        >
            ✓
        </button>

        <div class="task-main">

            <div class="task-title-row">

                <h3 class="task-title">
                    ${escapeHTML(task.title)}
                </h3>

                ${
                    task.pinned
                        ? `<span class="pin-icon" title="Pinned">◆</span>`
                        : ""
                }

            </div>

            ${descriptionHTML}

            <div class="task-meta">

                <span class="meta-pill priority-pill ${escapeHTML(task.priority)}">
                    ${capitalize(task.priority)}
                </span>

                ${dueHTML}

                ${tagsHTML}

            </div>

        </div>

        <div class="task-actions">

            <button
                class="task-action pin ${
                    task.pinned ? "active" : ""
                }"
                data-action="pin"
                data-id="${escapeHTML(task.id)}"
                title="${
                    task.pinned
                        ? "Unpin task"
                        : "Pin task"
                }"
                aria-label="${
                    task.pinned
                        ? "Unpin task"
                        : "Pin task"
                }"
            >
                ◆
            </button>

            <button
                class="task-action edit"
                data-action="edit"
                data-id="${escapeHTML(task.id)}"
                title="Edit task"
                aria-label="Edit task"
            >
                ✎
            </button>

            <button
                class="task-action delete"
                data-action="delete"
                data-id="${escapeHTML(task.id)}"
                title="Delete task"
                aria-label="Delete task"
            >
                ×
            </button>

        </div>
    `;

    /*
     * Event delegation inside individual card.
     */
    article
        .querySelectorAll("[data-action]")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const action =
                        button.dataset.action;

                    const id =
                        button.dataset.id;

                    if (action === "toggle") {
                        toggleTask(id);
                    }

                    if (action === "pin") {
                        togglePin(id);
                    }

                    if (action === "edit") {
                        openTaskModal(id);
                    }

                    if (action === "delete") {
                        deleteTask(id);
                    }
                }
            );

        });

    return article;
}

/* =========================================================
   SEARCH
========================================================= */

function handleSearch(event) {

    state.filters.search =
        event.target.value;

    DOM.searchInput
        .closest(".search-box")
        .classList.toggle(
            "has-value",
            Boolean(state.filters.search)
        );

    renderTasks();
}

function clearSearch() {

    state.filters.search = "";

    DOM.searchInput.value = "";

    DOM.searchInput
        .closest(".search-box")
        .classList.remove(
            "has-value"
        );

    renderTasks();

    DOM.searchInput.focus();
}

function focusSearch() {

    if (window.innerWidth < 850) {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    setTimeout(
        () => DOM.searchInput.focus(),
        100
    );
}

/* =========================================================
   FILTER UI
========================================================= */

function toggleFilterPanel() {

    const isOpen =
        DOM.filterPanel.classList.toggle(
            "open"
        );

    DOM.filterToggle.classList.toggle(
        "active",
        isOpen
    );
}

function updateFilterButtons() {

    $$("#statusFilters .segment")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.status ===
                    state.filters.status
            );
        });

    $$(".priority-chip")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.priority ===
                    state.filters.priority
            );
        });

    DOM.sortSelect.value =
        state.filters.sort;
}

/* =========================================================
   STATS
========================================================= */

function updateStats() {

    const total =
        state.tasks.length;

    const completed =
        state.tasks.filter(
            task => task.completed
        ).length;

    const pending =
        total - completed;

    const overdue =
        state.tasks.filter(
            task =>
                !task.completed &&
                isTaskOverdue(task)
        ).length;

    const todayCompleted =
        state.tasks.filter(
            task =>
                task.completed &&
                task.completedAt &&
                isSameDate(
                    new Date(task.completedAt),
                    new Date()
                )
        ).length;

    $("#statTotal").textContent =
        total;

    $("#statCompleted").textContent =
        completed;

    $("#statPending").textContent =
        pending;

    $("#statOverdue").textContent =
        overdue;

    $("#completedTrend").textContent =
        `+${todayCompleted} today`;

    $("#pendingTrend").textContent =
        `${pending} active`;

    $("#navTotalCount").textContent =
        total;

    $("#navActiveCount").textContent =
        pending;

    $("#navCompletedCount").textContent =
        completed;

    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );

    $("#heroCompletion").textContent =
        `${percentage}%`;

    $("#progressPercent").textContent =
        `${percentage}%`;

    $("#progressCompleted").textContent =
        completed;

    $("#progressRemaining").textContent =
        pending;

    $("#progressBarFill").style.width =
        `${percentage}%`;

    $("#progressRing").style.setProperty(
        "--progress",
        `${percentage}%`
    );

    const high =
        state.tasks.filter(
            task => task.priority === "high"
        ).length;

    const medium =
        state.tasks.filter(
            task => task.priority === "medium"
        ).length;

    const low =
        state.tasks.filter(
            task => task.priority === "low"
        ).length;

    $("#highCount").textContent = high;
    $("#mediumCount").textContent = medium;
    $("#lowCount").textContent = low;

    $("#highBar").style.width =
        getPercentage(high, total);

    $("#mediumBar").style.width =
        getPercentage(medium, total);

    $("#lowBar").style.width =
        getPercentage(low, total);

    const streak =
        calculateStreak();

    $("#streakCount").textContent =
        streak;

    $("#streakMessage").textContent =
        streak > 0
            ? "Keep the momentum going."
            : "Complete a task today to build your streak.";

    $("#focusPending").textContent =
        pending;

    $("#focusPriority").textContent =
        high;
}

function getPercentage(value, total) {

    if (!total) {
        return "0%";
    }

    return `${Math.round(
        (value / total) * 100
    )}%`;
}

/* =========================================================
   STREAK
========================================================= */

function calculateStreak() {

    const completionDates =
        new Set();

    state.tasks.forEach(task => {

        if (!task.completedAt) return;

        completionDates.add(
            formatDateInput(
                new Date(task.completedAt)
            )
        );

    });

    if (completionDates.size === 0) {
        return 0;
    }

    let cursor =
        getDateOnly(new Date());

    const todayString =
        formatDateInput(cursor);

    /*
     * If nothing was completed today,
     * check whether yesterday starts
     * the active streak.
     */
    if (!completionDates.has(todayString)) {

        cursor.setDate(
            cursor.getDate() - 1
        );

        if (
            !completionDates.has(
                formatDateInput(cursor)
            )
        ) {
            return 0;
        }
    }

    let streak = 0;

    while (
        completionDates.has(
            formatDateInput(cursor)
        )
    ) {

        streak++;

        cursor.setDate(
            cursor.getDate() - 1
        );
    }

    return streak;
}

/* =========================================================
   DUE DATE
========================================================= */

function getTaskDueTimestamp(task) {

    if (!task.dueDate) {
        return Infinity;
    }

    const time =
        task.dueTime || "23:59";

    return new Date(
        `${task.dueDate}T${time}`
    ).getTime();
}

function isTaskOverdue(task) {

    if (
        task.completed ||
        !task.dueDate
    ) {
        return false;
    }

    return (
        getTaskDueTimestamp(task) <
        Date.now()
    );
}

function getDueInfo(task) {

    if (!task.dueDate) {
        return {
            text: "",
            className: "",
            icon: ""
        };
    }

    const dueDate =
        parseDateInput(task.dueDate);

    const now =
        getDateOnly(new Date());

    const due =
        getDateOnly(dueDate);

    const difference =
        Math.round(
            (due - now) /
            86400000
        );

    if (
        !task.completed &&
        isTaskOverdue(task)
    ) {
        return {
            text: `Overdue • ${formatReadableDate(dueDate)}`,
            className: "overdue",
            icon: "!"
        };
    }

    if (difference === 0) {

        return {
            text:
                task.dueTime
                    ? `Today • ${formatTime(task.dueTime)}`
                    : "Due today",
            className: "today",
            icon: "◷"
        };
    }

    if (difference === 1) {

        return {
            text:
                task.dueTime
                    ? `Tomorrow • ${formatTime(task.dueTime)}`
                    : "Tomorrow",
            className: "",
            icon: "◷"
        };
    }

    return {
        text:
            task.dueTime
                ? `${formatReadableDate(dueDate)} • ${formatTime(task.dueTime)}`
                : formatReadableDate(dueDate),
        className: "",
        icon: "◷"
    };
}

/* =========================================================
   PROFILE
========================================================= */

function openProfileModal() {

    DOM.profileName.value =
        state.profile.name || "";

    DOM.profileEmail.value =
        state.profile.email || "";

    updateProfilePreview();

    openModal("profileModal");
}

function saveProfileForm(event) {

    event.preventDefault();

    const name =
        DOM.profileName.value.trim() ||
        "User";

    const email =
        DOM.profileEmail.value.trim();

    state.profile.name = name;
    state.profile.email = email;

    saveProfile();

    updateProfileUI();

    closeModal("profileModal");

    showToast(
        "Profile updated.",
        "success"
    );
}

function updateProfileUI() {

    const name =
        state.profile.name || "User";

    const initials =
        getInitials(name);

    $("#sidebarName").textContent =
        name;

    $("#topName").textContent =
        name;

    $("#sidebarAvatar").textContent =
        initials;

    $("#topAvatar").textContent =
        initials;

    $("#profileAvatar").textContent =
        initials;

    $("#profilePreviewName").textContent =
        name;
}

function updateProfilePreview() {

    const name =
        DOM.profileName.value.trim() ||
        "User";

    $("#profileAvatar").textContent =
        getInitials(name);

    $("#profilePreviewName").textContent =
        name;
}

DOM.profileName.addEventListener(
    "input",
    updateProfilePreview
);

/* =========================================================
   MODAL HELPERS
========================================================= */

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.add("open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.remove("open");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    if (
        !DOM.taskModal.classList.contains("open") &&
        !DOM.profileModal.classList.contains("open") &&
        !DOM.confirmModal.classList.contains("open")
    ) {
        document.body.style.overflow = "";
    }
}

/* =========================================================
   CONFIRMATION
========================================================= */

function openConfirmation({
    title,
    text,
    icon = "!",
    action
}) {

    $("#confirmTitle").textContent =
        title;

    $("#confirmText").textContent =
        text;

    $("#confirmIcon").textContent =
        icon;

    state.confirmAction =
        action;

    openModal("confirmModal");
}

function executeConfirmation() {

    if (
        typeof state.confirmAction ===
        "function"
    ) {
        state.confirmAction();
    }

    state.confirmAction = null;

    closeModal("confirmModal");
}

/* =========================================================
   CLEAR COMPLETED
========================================================= */

function clearCompleted() {

    const completedCount =
        state.tasks.filter(
            task => task.completed
        ).length;

    if (completedCount === 0) {

        showToast(
            "There are no completed tasks to clear.",
            "info"
        );

        return;
    }

    openConfirmation({
        title: "Clear completed tasks?",
        text:
            `${completedCount} completed ${
                completedCount === 1
                    ? "task"
                    : "tasks"
            } will be removed.`,
        icon: "✓",
        action: () => {

            state.tasks =
                state.tasks.filter(
                    task => !task.completed
                );

            saveTasks();
            renderAll();

            showToast(
                "Completed tasks cleared.",
                "success"
            );
        }
    });
}

/* =========================================================
   RESET
========================================================= */

function resetWorkspace() {

    openConfirmation({
        title: "Reset workspace?",
        text:
            "All current tasks will be replaced with the FocusList demo workspace.",
        icon: "↻",
        action: () => {

            state.tasks =
                createDemoTasks();

            state.filters = {
                status: "all",
                priority: "all",
                search: "",
                sort: "newest"
            };

            state.currentView =
                "dashboard";

            saveTasks();

            DOM.searchInput.value = "";

            updateFilterButtons();
            updateNavigation();
            renderAll();

            showToast(
                "Workspace reset to demo data.",
                "success"
            );
        }
    });
}

/* =========================================================
   EXPORT
========================================================= */

function exportData() {

    const payload = {
        app: "FocusList",
        version: "2.0",
        exportedAt:
            new Date().toISOString(),

        profile: state.profile,

        tasks: state.tasks
    };

    const blob =
        new Blob(
            [
                JSON.stringify(
                    payload,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `focuslist-backup-${formatDateFile(
            new Date()
        )}.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showToast(
        "Workspace exported as JSON.",
        "success"
    );
}

/* =========================================================
   IMPORT
========================================================= */

function handleImport(event) {

    const file =
        event.target.files?.[0];

    if (!file) return;

    const reader =
        new FileReader();

    reader.onload = () => {

        try {

            const parsed =
                JSON.parse(
                    reader.result
                );

            const importedTasks =
                Array.isArray(parsed)
                    ? parsed
                    : parsed.tasks;

            if (
                !Array.isArray(
                    importedTasks
                )
            ) {
                throw new Error(
                    "Invalid task data"
                );
            }

            const normalized =
                importedTasks
                    .map(normalizeImportedTask)
                    .filter(Boolean);

            if (normalized.length === 0) {
                throw new Error(
                    "No valid tasks"
                );
            }

            openConfirmation({
                title: "Import workspace?",
                text:
                    `${normalized.length} tasks were found. Existing tasks will be replaced.`,
                icon: "⇧",
                action: () => {

                    state.tasks =
                        normalized;

                    if (
                        parsed.profile &&
                        typeof parsed.profile === "object"
                    ) {
                        state.profile = {
                            ...state.profile,
                            ...parsed.profile
                        };

                        saveProfile();
                    }

                    saveTasks();

                    state.filters.search =
                        "";

                    DOM.searchInput.value =
                        "";

                    renderAll();

                    showToast(
                        "Workspace imported successfully.",
                        "success"
                    );
                }
            });

        } catch (error) {

            console.error(error);

            showToast(
                "Invalid FocusList JSON file.",
                "error"
            );

        } finally {

            event.target.value = "";
        }
    };

    reader.readAsText(file);
}

function normalizeImportedTask(task) {

    if (
        !task ||
        typeof task !== "object" ||
        !String(task.title || "").trim()
    ) {
        return null;
    }

    return {
        id:
            task.id ||
            createId(),

        title:
            String(task.title)
                .trim()
                .slice(0, 120),

        description:
            String(task.description || "")
                .slice(0, 500),

        priority:
            ["high", "medium", "low"]
                .includes(task.priority)
                ? task.priority
                : "medium",

        dueDate:
            typeof task.dueDate === "string"
                ? task.dueDate
                : "",

        dueTime:
            typeof task.dueTime === "string"
                ? task.dueTime
                : "",

        tags:
            Array.isArray(task.tags)
                ? task.tags
                    .map(
                        tag =>
                            String(tag)
                                .trim()
                                .slice(0, 30)
                    )
                    .filter(Boolean)
                    .slice(0, 8)
                : [],

        pinned:
            Boolean(task.pinned),

        completed:
            Boolean(task.completed),

        createdAt:
            validISO(task.createdAt)
                ? task.createdAt
                : new Date().toISOString(),

        updatedAt:
            validISO(task.updatedAt)
                ? task.updatedAt
                : new Date().toISOString(),

        completedAt:
            validISO(task.completedAt)
                ? task.completedAt
                : null
    };
}

/* =========================================================
   FOCUS MODE
========================================================= */

function openFocusMode() {

    updateStats();

    DOM.focusOverlay.classList.add(
        "open"
    );

    document.body.style.overflow =
        "hidden";
}

function closeFocusMode() {

    DOM.focusOverlay.classList.remove(
        "open"
    );

    if (
        !DOM.taskModal.classList.contains("open") &&
        !DOM.profileModal.classList.contains("open") &&
        !DOM.confirmModal.classList.contains("open")
    ) {
        document.body.style.overflow = "";
    }
}

/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "info"
) {

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    const icon =
        type === "success"
            ? "✓"
            : type === "error"
                ? "!"
                : "i";

    toast.innerHTML = `
        <span class="toast-icon">
            ${icon}
        </span>

        <span>
            ${escapeHTML(message)}
        </span>
    `;

    DOM.toastContainer.appendChild(
        toast
    );

    setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transform =
            "translateX(20px)";

        setTimeout(
            () => toast.remove(),
            200
        );

    }, 2800);
}

/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function handleKeyboard(event) {

    /*
     * ESC
     */
    if (event.key === "Escape") {

        closeModal("taskModal");
        closeModal("profileModal");
        closeModal("confirmModal");
        closeFocusMode();

        closeMobileSidebar();

        return;
    }

    /*
     * Don't trigger shortcuts
     * while typing.
     */
    const tag =
        document.activeElement?.tagName;

    const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT";

    if (isTyping) {

        if (
            event.key === "/" &&
            document.activeElement ===
                DOM.searchInput
        ) {
            return;
        }

        return;
    }

    /*
     * N = New task
     */
    if (
        event.key.toLowerCase() === "n"
    ) {
        event.preventDefault();
        openTaskModal();
    }

    /*
     * / = Search
     */
    if (event.key === "/") {
        event.preventDefault();
        focusSearch();
    }
}

/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    updateProfileUI();

    updateNavigation();

    updateFilterButtons();

    renderTasks();

    updateStats();
}

/* =========================================================
   DATE HELPERS
========================================================= */

function getDateOnly(date) {

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
}

function formatDateInput(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDateInput(value) {

    const [year, month, day] =
        value.split("-").map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}

function formatReadableDate(date) {

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short"
        }
    );
}

function formatTime(time) {

    if (!time) return "";

    const [hours, minutes] =
        time.split(":").map(Number);

    const date =
        new Date();

    date.setHours(
        hours,
        minutes,
        0,
        0
    );

    return date.toLocaleTimeString(
        undefined,
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

function formatDateFile(date) {

    return formatDateInput(date)
        .replaceAll("-", "");
}

function isSameDate(a, b) {

    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/* =========================================================
   VALIDATION HELPERS
========================================================= */

function validISO(value) {

    if (!value) return false;

    const date =
        new Date(value);

    return !Number.isNaN(
        date.getTime()
    );
}

/* =========================================================
   TEXT HELPERS
========================================================= */

function capitalize(value) {

    if (!value) return "";

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}

function getInitials(name) {

    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!parts.length) {
        return "U";
    }

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}

/*
 * Important:
 * User-created text is escaped before
 * inserting into innerHTML.
 */
function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}