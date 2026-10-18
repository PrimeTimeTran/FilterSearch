import {
  AgentFeedback,
  AgentLogEntry,
  AgentRequest,
  AgentResponse,
  AgentSession,
  AgentSessionStatus,
  AgentSolution,
  AgentState,
  Attempt,
  BrowserTab,
  CapturedProblem,
  ComplexityAnalysis,
  InactiveState,
  Problem,
  ProblemExample,
  ProblemReference,
  ProgrammingLanguage,
  Submission,
  SubmissionResult,
} from "./@types";

/* ============================================================================
 * 2. EXTENSION LIFECYCLE
 * ============================================================================
 *
 * This is the browser-facing portion.
 */

/**
 * Called when the extension starts.
 *
 * This is where we eventually register all Chrome listeners.
 */
export async function initializeExtension(): Promise<void> {
  await initializeStorage();
  registerTabListeners();
  registerCommandListeners();
  registerRuntimeListeners();
  await inspectCurrentTab();
}
/**
 * Watch the browser for navigation / tab changes.
 */
export function registerTabListeners(): void {
  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    await handleActiveTabChanged(tabId);
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete") {
      return;
    }

    await handleTabUpdated(tabId, tab);
  });
}
/**
 * Commands will eventually provide the primary user interaction.
 */
export function registerCommandListeners(): void {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === "open-agent") {
      await handleAgentCommand();
    }
  });
}

/**
 * Runtime messages allow content.ts and background.ts to communicate.
 */
export function registerRuntimeListeners(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    void handleRuntimeMessage(message, sender).then(sendResponse);

    return true;
  });
}

/**
 * Inspect whichever tab is currently active when the extension starts.
 */
export async function inspectCurrentTab(): Promise<void> {
  const tab = await getActiveTab();

  if (!tab) {
    return;
  }

  await inspectTab(tab);
}

/**
 * Called whenever the active tab changes.
 */
export async function handleActiveTabChanged(tabId: number): Promise<void> {
  const tab = await getTab(tabId);

  if (!tab) {
    return;
  }

  await inspectTab(tab);
}

/**
 * Called whenever a page finishes loading.
 */
export async function handleTabUpdated(tabId: number, tab: chrome.tabs.Tab): Promise<void> {
  const browserTab = convertChromeTab(tabId, tab);

  await inspectTab(browserTab);
}
export async function handleRuntimeMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
): Promise<unknown> {
  console.log("Runtime message:", message, sender);

  return null;
}
export async function getActiveTab(): Promise<BrowserTab | null> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tab?.id === undefined || !tab.url) {
    return null;
  }

  return convertChromeTab(tab.id, tab);
}
export async function getTab(tabId: number): Promise<BrowserTab | null> {
  const tab = await chrome.tabs.get(tabId);

  if (!tab.url) {
    return null;
  }

  return convertChromeTab(tabId, tab);
}

export function convertChromeTab(tabId: number, tab: chrome.tabs.Tab): BrowserTab {
  return {
    id: tabId,
    url: tab.url ?? "",
    title: tab.title ?? "",
  };
}
/**
 * Determine whether the current page is something the agent understands.
 */
export async function inspectTab(tab: BrowserTab): Promise<void> {
  if (!isLeetCodeProblem(tab.url)) {
    await deactivateAgent(tab);
    return;
  }

  await activateAgent(tab);
}

/* ============================================================================
 * 3. DETECTING LEETCODE
 * ============================================================================
 */

export function isLeetCodeProblem(url: string): boolean {
  return /^https:\/\/leetcode\.com\/problems\/[^/]+/.test(url);
}

export function extractProblemReference(url: string): ProblemReference | null {
  const match = url.match(/^https:\/\/leetcode\.com\/problems\/([^/]+)/);

  if (!match) {
    return null;
  }

  return {
    url,
    slug: match[1],
  };
}

/**
 * Tell the UI that the agent is available.
 *
 * This could eventually:
 *
 *   - change the extension icon
 *   - show a badge
 *   - inject a button
 *   - open a command palette
 *   - do nothing
 */

export async function activateAgent(tab: BrowserTab): Promise<void> {
  const state: AgentState = {
    type: "available",
  };

  await setAgentState(state);
  await updateAgentIndicator(tab, state);
}

export async function deactivateAgent(tab: BrowserTab): Promise<void> {
  const state: AgentState = {
    type: "inactive",
  };

  await setAgentState(state);
  await updateAgentIndicator(tab, state);
}
export async function updateAgentIndicator(tab: BrowserTab, state: AgentState): Promise<void> {
  const text = getAgentIndicatorText(state);

  await chrome.action.setBadgeText({
    tabId: tab.id,
    text,
  });

  await chrome.action.setTitle({
    tabId: tab.id,
    title: `LeetCode Agent: ${state}`,
  });
}

export function getAgentIndicatorText(state: AgentState): string {
  switch (state.type) {
    case "inactive":
      return "";

    case "available":
      return "AI";

    case "capturing":
      return "…";

    case "solving":
      return "AI";

    case "submitting":
      return "↑";

    case "evaluating":
      return "…";

    case "reviewing":
      return "…";

    case "retrying":
      return "↻";

    case "complete":
      return "✓";

    case "error":
      return "!";
  }
}
export function describeState(state: AgentState): string {
  switch (state.type) {
    case "inactive":
      return "Agent inactive";

    case "available":
      return "Agent ready";

    case "capturing":
      // return `Capturing tab ${state.tabId}`
      return `Capturing tab ${state}`;

    case "solving":
      // return `Solving attempt ${state.attempt}`
      return `Solving attempt ${state}`;

    case "submitting":
      return "Submitting solution";

    case "evaluating":
      return "Evaluating submission";

    case "reviewing":
      return "Rewviewing submission";

    case "retrying":
      return "Retrying";

    case "complete":
      return "Problem solved";

    case "error":
      // return `Error: ${state.message}`
      return `Error: ${state}`;
  }
}

let agentState: AgentState = { type: "inactive" };

export async function setAgentState(state: AgentState): Promise<void> {
  agentState = state;
}

/* ============================================================================
 * 4. STARTING A SOLVE SESSION
 * ============================================================================
 */

export async function handleAgentCommand(): Promise<void> {
  const tab = await getActiveTab();

  if (!tab) {
    return;
  }

  if (!isLeetCodeProblem(tab.url)) {
    return;
  }

  await solveCurrentProblem(tab);
}

export async function solveCurrentProblem(tab: BrowserTab): Promise<void> {
  const session = await createAgentSession(tab);

  try {
    await runAgentSession(session);
  } catch (error) {
    await failSession(session, error);

    throw error;
  }
}

/* ============================================================================
 * 5. SESSION CREATION
 * ============================================================================
 */

export async function createAgentSession(tab: BrowserTab): Promise<AgentSession> {
  const reference = extractProblemReference(tab.url);

  if (!reference) {
    throw new Error("Tab is not a LeetCode problem");
  }

  const session: AgentSession = {
    id: createId(),
    problem: {
      id: createId(),
      source: "leetcode",
      url: reference.url,
      slug: reference.slug,
      title: "",
      description: "",
      examples: [],
      constraints: [],
      language: "python",
      starterCode: "",
    },
    attempts: [],
    status: "created",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveSession(session);

  await log(session, "created", "Created agent session");

  return session;
}

/* ============================================================================
 * 6. THE MAIN AGENT LOOP
 * ============================================================================
 *
 * This is the heart of the application.
 *
 * Notice that this is not:
 *
 *     scrape -> AI -> submit -> done
 *
 * It is:
 *
 *     capture
 *       ↓
 *     solve
 *       ↓
 *     submit
 *       ↓
 *     evaluate
 *       ↓
 *     either finish
 *       or feed failure back into the agent
 *       ↓
 *     repeat
 */

export async function runAgentSession(session: AgentSession): Promise<void> {
  await transition(session, { type: "capturing" });

  const captured = await captureProblem(session);

  const problem = await normalizeProblem(captured);

  await persistProblem(problem);

  session.problem = problem;
  session.status = "captured";

  await saveSession(session);

  await log(session, "captured", "Problem captured and normalized");

  const maxAttempts = 10;

  while (shouldRetry(session, maxAttempts)) {
    const attempt = await beginAttempt(session);

    await transition(session, { type: "solving" });

    const solution = await solveProblem(session.problem, session.attempts);

    validateSolution(solution, session.problem);

    await recordSolution(session, attempt, solution);

    await transition(session, { type: "submitting" });

    const submission = await submitSolution(session.problem, solution, attempt.number);

    await recordSubmission(session, attempt, submission);

    await transition(session, { type: "evaluating" });

    const result = await waitForSubmissionResult(submission);

    await recordSubmissionResult(session, attempt, result);

    if (isSuccessful(result)) {
      await finalizeSuccessfulSession(session, attempt);
      return;
    }

    await handleFailedAttempt(session, attempt, result);
  }

  await failSession(session, new Error("Maximum number of agent attempts reached"));
}

export function createId(): string {
  return crypto.randomUUID();
}
export function shouldRetry(session: AgentSession, maxAttempts: number): boolean {
  return session.attempts.length < maxAttempts;
}
export async function failSession(session: AgentSession, error: unknown): Promise<void> {
  session.status = "failed";
  session.updatedAt = Date.now();

  await saveSession(session);

  await log(
    session,
    "error",
    error instanceof Error ? error.message : "Agent session failed",
    // error,
  );
}
export async function transition(session: AgentSession, state: AgentState): Promise<void> {
  setAgentState(state);

  session.status = convertAgentStateToSessionStatus(state);
  session.updatedAt = Date.now();

  await saveSession(session);
  await log(session, state, `Transitioned to ${state}`);
}

export function convertAgentStateToSessionStatus(state: AgentState): AgentSessionStatus {
  switch (state.type) {
    case "inactive":
      return "cancelled";

    case "available":
      return "created";

    case "capturing":
      return "capturing";

    case "solving":
      return "solving";

    case "reviewing":
      return "solution-ready";

    case "submitting":
      return "submitting";

    case "evaluating":
      return "evaluating";

    case "retrying":
      return "retrying";

    case "complete":
      return "solved";

    case "error":
      return "failed";
  }
}

// export async function solveProblem(
// 	problem: Problem,
// 	previousAttempts: Attempt[],
// ): Promise<AgentSolution> {
// 	const request = buildInitialAgentRequest(problem, previousAttempts)
// 	const response = await requestAgentSolution(request)
// 	return extractAgentSolution(response)
// }

export async function solveProblem(
  _problem: Problem,
  _previousAttempts: Attempt[],
): Promise<AgentSolution> {
  throw new Error("Agent runtime not configured");
}
export function buildInitialAgentRequest(
  problem: Problem,
  previousAttempts: Attempt[],
): AgentRequest {
  return {};
}

export async function requestAgentSolution(request: AgentRequest): Promise<AgentResponse> {
  throw new Error("Agent runtime not configured");
}

export function extractAgentSolution(response: AgentResponse): AgentSolution {
  throw new Error("Agent response does not contain a solution");
}

export function validateSolution(solution: AgentSolution, problem: Problem): void {
  if (solution.language !== problem.language) {
    throw new Error(`Agent returned ${solution.language}, expected ${problem.language}`);
  }

  if (!solution.code.trim()) {
    throw new Error("Agent returned empty solution code");
  }

  if (!solution.explanation.trim()) {
    throw new Error("Agent returned no explanation");
  }

  if (!solution.complexity.time.trim()) {
    throw new Error("Agent returned no time complexity");
  }

  if (!solution.complexity.space.trim()) {
    throw new Error("Agent returned no space complexity");
  }
}
export async function recordSolution(
  session: AgentSession,
  attempt: Attempt,
  solution: AgentSolution,
): Promise<void> {
  attempt.solution = solution;
  session.updatedAt = Date.now();

  await saveSession(session);

  await log(
    session,
    "solving",
    `Recorded solution for attempt ${attempt.number}`,
    // solution,
  );
}
export async function submitSolution(
  problem: Problem,
  solution: AgentSolution,
  attemptNumber: number,
): Promise<Submission> {
  return {
    id: createId(),
    problemId: problem.id,
    attempt: attemptNumber,
    language: solution.language,
    code: solution.code,
    submittedAt: Date.now(),
  };
}
export async function recordSubmission(
  session: AgentSession,
  attempt: Attempt,
  submission: Submission,
): Promise<void> {
  attempt.submission = submission;
  session.updatedAt = Date.now();

  await saveSession(session);

  await log(
    session,
    "submitting",
    `Recorded submission ${submission.id}`,
    // submission,
  );
}
export async function waitForSubmissionResult(_submission: Submission): Promise<SubmissionResult> {
  throw new Error("Submission observation not implemented");
}
export async function recordSubmissionResult(
  session: AgentSession,
  attempt: Attempt,
  result: SubmissionResult,
): Promise<void> {
  attempt.result = result;
  attempt.completedAt = Date.now();
  session.updatedAt = Date.now();

  await saveSession(session);

  await log(
    session,
    "evaluating",
    `Submission result: ${result.status}`,
    // result,
  );
}
export function isSuccessful(result: SubmissionResult): boolean {
  return result.status === "accepted";
}
export async function finalizeSuccessfulSession(
  session: AgentSession,
  attempt: Attempt,
): Promise<void> {
  session.status = "solved";
  session.updatedAt = Date.now();

  async function completeAttempt(session: AgentSession, attempt: Attempt): Promise<void> {
    attempt.completedAt ??= Date.now();
    session.updatedAt = Date.now();

    await saveSession(session);
  }

  await saveSession(session);
  await log(session, "complete", `Problem solved on attempt ${attempt.number}`);

  await notifySuccess(session);
}

/* ============================================================================
 * 7. CAPTURE
 * ============================================================================
 */

export async function captureProblem(session: AgentSession): Promise<CapturedProblem> {
  await log(session, "capturing", "Requesting problem data from webpage");

  const tab = await getActiveTab();

  if (!tab) {
    throw new Error("No active tab");
  }

  const captured = await requestProblemCapture(tab);

  await log(
    session,
    "capturing",
    "Problem data received from webpage",
    // captured,
  );

  return captured;
}
export async function capturePageState() {}
export async function captureProblemTitle() {}
export async function captureProblemDescription() {}
export async function captureProblemExamples() {}
export async function captureProblemConstraints() {}
export async function captureStarterCode() {}
export async function captureSelectedLanguage() {}

/**
 * Ask content.ts to inspect the actual DOM.
 */
export async function requestProblemCapture(tab: BrowserTab): Promise<CapturedProblem> {
  /*
   * TODO:
   *
   * chrome.tabs.sendMessage(tab.id, {
   *   type: "CAPTURE_PROBLEM"
   * })
   *
   * content.ts will eventually perform the actual DOM extraction.
   */

  throw new Error("Not implemented");
}

/* ============================================================================
 * 8. NORMALIZATION
 * ============================================================================
 */

export async function normalizeProblem(captured: CapturedProblem): Promise<Problem> {
  return {
    id: createId(),

    source: "leetcode",

    url: captured.source.url,

    slug: captured.source.slug,

    title: captured.title,

    description: captured.description,

    examples: captured.examples,

    constraints: captured.constraints,

    language: captured.language,

    starterCode: captured.starterCode,
  };
}

/**
 * Eventually determine the language from the LeetCode UI.
 *
 * Until then, Python is the default.
 */
export function detectLanguage(_captured: CapturedProblem): ProgrammingLanguage {
  return "python";
}

export function normalizeExamples() {}
export function normalizeConstraints() {}
export function normalizeStarterCode() {}

/* ============================================================================
 * 9. PERSISTENCE
 * ============================================================================
 *
 * This is deliberately its own phase.
 *
 * We don't want:
 *
 *     website -> AI
 *
 * We want:
 *
 *     website -> our representation -> AI
 *
 * so the user owns the intermediate artifact.
 */

export async function initializeStorage(): Promise<void> {
  /*
   * TODO:
   *
   * Initialize IndexedDB / chrome.storage / local filesystem
   * / Estate connection.
   */
}

export async function persistProblem(problem: Problem): Promise<void> {
  /*
   * TODO:
   *
   * Save the normalized problem.
   *
   * Eventually this might:
   *
   *   1. Save locally.
   *   2. Send a copy to Estate.
   *   3. Index it.
   */
}

export async function persistSession(session: AgentSession): Promise<void> {}
export async function saveSession(session: AgentSession): Promise<void> {
  /*
   * TODO:
   *
   * Persist the complete agent session.
   */
}

/* ============================================================================
 * 10. ATTEMPTS
 * ============================================================================
 */

export async function beginAttempt(session: AgentSession): Promise<Attempt> {
  const attempt: Attempt = {
    number: session.attempts.length + 1,

    startedAt: Date.now(),
  };

  session.attempts.push(attempt);

  session.status = "solving";
  session.updatedAt = Date.now();

  await saveSession(session);

  await log(session, "solving", `Beginning attempt ${attempt.number}`);

  return attempt;
}

// export async function loadProblem(session: AgentSession): Promise<Attempt> {}
export async function loadProblem(session: AgentSession) {}
// export async function loadSession(session: AgentSession): Promise<Attempt> {}
export async function loadSession(session: AgentSession) {}

/* ============================================================================
 * 11. AGENT
 * ====*/

export async function completeAttempt(session: AgentSession, attempt: Attempt): Promise<void> {
  attempt.completedAt ??= Date.now();
  session.updatedAt = Date.now();

  await saveSession(session);
}

function buildRevisionRequest() {}
function requestAgentRevision() {}

export async function validateSolutionLanguage() {}
export async function validateSolutionCode() {}
export async function validateSolutionComplexity() {}
export async function validateSolutionComments() {}

export async function applySolution() {}
export async function prepareSolutionForEditor() {}
export async function writeCodeToEditor() {}

export async function observeSubmissionState() {}
export async function readSubmissionResult() {}
export async function classifySubmissionResult() {}

export async function handleFailedAttempt(
  session: AgentSession,
  attempt: Attempt,
  result: SubmissionResult,
): Promise<void> {
  if (!attempt.solution) {
    throw new Error(`Attempt ${attempt.number} failed without a recorded solution`);
  }

  if (!attempt.submission) {
    throw new Error(`Attempt ${attempt.number} failed without a recorded submission`);
  }

  attempt.result = result;

  attempt.feedback = {
    problem: session.problem,
    previousSolution: attempt.solution,
    submission: attempt.submission,
    result,
    previousAttempts: [...session.attempts],
  };

  session.updatedAt = Date.now();

  await saveSession(session);

  await log(
    session,
    "retrying",
    `Attempt ${attempt.number} failed with ${result.status}`,
    // result,
  );

  await transition(session, { type: "retrying" });
}
export async function buildAgentFeedback() {}
export async function diagnoseFailure() {}
export async function reviseSolution() {}
export async function notifySuccess(session: AgentSession) {}

export async function log(
  session: AgentSession,
  action: String | AgentState,
  details: String,
  // captured: CapturedProblem | unknown,
) {}
export async function appendLog() {}
