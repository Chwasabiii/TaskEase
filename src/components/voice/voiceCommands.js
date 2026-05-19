const PAGE_ALIASES = [
  { page: "dashboard", terms: ["dashboard", "home", "overview"] },
  { page: "tasks", terms: ["tasks", "my tasks", "task list"] },
  { page: "pomodoro", terms: ["pomodoro", "timer", "focus timer"] },
  { page: "focus", terms: ["focus", "focus mode"] },
  { page: "archive", terms: ["archive", "archived"] },
  { page: "collaboration", terms: ["collaboration", "shared tasks", "team"] },
];

const PRIORITIES = ["urgent", "high", "medium", "low"];

export const VOICE_COMMAND_EXAMPLES = [
  "Go to tasks",
  "Add task finish report",
  "Complete task finish report",
  "Start pomodoro",
  "Pause timer",
  "Switch to light mode",
];

export const VOICE_COMMAND_GROUPS = [
  {
    label: "Navigate",
    examples: ["Open dashboard", "Show my tasks", "Go to focus mode"],
  },
  {
    label: "Tasks",
    examples: ["Add task call Sam", "Create urgent task pay bills", "Mark call Sam done"],
  },
  {
    label: "Timer",
    examples: ["Start focus", "Pause timer", "Switch to short break"],
  },
  {
    label: "Theme",
    examples: ["Light mode", "Dark mode"],
  },
];

const clean = (value) =>
  value
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripFiller = (value) =>
  value
    .replace(/^(please|can you|could you|would you|hey task ease|hey taskease|task ease|taskease)\s+/i, "")
    .replace(/\s+(please)$/i, "")
    .trim();

const parsePageCommand = (text) => {
  const isNavigation = /^(go to|open|show|switch to|take me to|navigate to|bring up)\s+/.test(text);
  if (!isNavigation) return null;

  const target = text.replace(/^(go to|open|show|switch to|take me to|navigate to|bring up)\s+/, "");
  const match = PAGE_ALIASES.find(({ terms }) =>
    terms.some((term) => target === term || target.includes(term))
  );

  return match ? { type: "navigate", page: match.page } : null;
};

const parseThemeCommand = (text) => {
  if (/(light mode|switch to light|turn on light)/.test(text)) {
    return { type: "theme", theme: "light" };
  }
  if (/(dark mode|switch to dark|turn on dark)/.test(text)) {
    return { type: "theme", theme: "dark" };
  }
  if (/(toggle theme|change theme)/.test(text)) {
    return { type: "theme", theme: "toggle" };
  }
  return null;
};

const parsePomodoroCommand = (text) => {
  if (/(start|resume|begin).*(pomodoro|timer|focus|session)/.test(text) || /^(start|resume|begin)$/.test(text)) {
    return { type: "pomodoro", action: "start" };
  }
  if (/(pause|stop).*(pomodoro|timer|focus|session)/.test(text) || /^(pause|stop)$/.test(text)) {
    return { type: "pomodoro", action: "pause" };
  }
  if (/(reset|restart).*(pomodoro|timer|focus|session)/.test(text) || /^(reset|restart)$/.test(text)) {
    return { type: "pomodoro", action: "reset" };
  }
  if (/(short break|switch to short|take a short break)/.test(text)) {
    return { type: "pomodoro", action: "mode", mode: "short" };
  }
  if (/(long break|switch to long|take a long break)/.test(text)) {
    return { type: "pomodoro", action: "mode", mode: "long" };
  }
  if (/(focus session|work session|pomodoro mode|switch to focus)/.test(text)) {
    return { type: "pomodoro", action: "mode", mode: "pomodoro" };
  }
  return null;
};

const parseTaskTitle = (text, patterns) => {
  for (const { pattern, titleIndex } of patterns) {
    const match = text.match(pattern);
    if (match?.[titleIndex]) return match[titleIndex].trim();
  }
  return "";
};

const parseTaskCommand = (text) => {
  const addTitle = parseTaskTitle(text, [
    { pattern: /^(add|create|make|new)\s+(a\s+)?task\s+(called|named|to)?\s*(.+)$/, titleIndex: 4 },
    { pattern: /^(add|create|make|new)\s+(urgent|high|medium|low)\s+(a\s+)?task\s+(called|named|to)?\s*(.+)$/, titleIndex: 5 },
    { pattern: /^(add|create|make|new)\s+(.+)\s+task$/, titleIndex: 2 },
    { pattern: /^(remind me to)\s+(.+)$/, titleIndex: 2 },
  ]);

  if (addTitle) {
    let title = addTitle;
    const priority = PRIORITIES.find((item) => new RegExp(`\\b${item}\\s+priority\\b`).test(title));
    const spokenPriority = PRIORITIES.find((item) => new RegExp(`^(add|create|make|new)\\s+${item}\\s+`).test(text));
    if (priority) {
      title = title.replace(new RegExp(`\\b${priority}\\s+priority\\b`, "g"), "").trim();
    }
    const leadingPriority = PRIORITIES.find((item) => new RegExp(`^${item}\\s+`).test(title));
    if (leadingPriority) {
      title = title.replace(new RegExp(`^${leadingPriority}\\s+`), "").trim();
    }

    return {
      type: "task",
      action: "create",
      title,
      priority: priority || leadingPriority || spokenPriority || "medium",
    };
  }

  const completeTitle = parseTaskTitle(text, [
    { pattern: /^(complete|finish|mark done|mark complete)\s+(task\s+)?(.+)$/, titleIndex: 3 },
    { pattern: /^mark\s+(.+)\s+(done|complete)$/, titleIndex: 1 },
    { pattern: /^(.+)\s+is\s+(done|complete|finished)$/, titleIndex: 1 },
  ]);
  if (completeTitle) {
    return { type: "task", action: "complete", title: completeTitle };
  }

  const reopenTitle = parseTaskTitle(text, [
    { pattern: /^(reopen|undo|mark todo)\s+(task\s+)?(.+)$/, titleIndex: 3 },
    { pattern: /^mark\s+(.+)\s+(todo|to do|open)$/, titleIndex: 1 },
  ]);
  if (reopenTitle) {
    return { type: "task", action: "reopen", title: reopenTitle };
  }

  return null;
};

export function parseVoiceCommand(transcript) {
  const text = stripFiller(clean(transcript));
  if (!text) return { type: "empty" };

  if (/^(help|voice help|what can i say|commands)$/.test(text)) {
    return { type: "help" };
  }

  return (
    parsePageCommand(text) ||
    parseThemeCommand(text) ||
    parsePomodoroCommand(text) ||
    parseTaskCommand(text) ||
    { type: "unknown", text }
  );
}

export function findTaskByVoiceTitle(tasks, spokenTitle) {
  const title = clean(spokenTitle);
  if (!title) return null;

  return (
    tasks.find((task) => clean(task.title) === title) ||
    tasks.find((task) => clean(task.title).includes(title)) ||
    tasks.find((task) => title.includes(clean(task.title)))
  );
}
