/*
 * LeetCode AI Agent
 *
 * This file intentionally describes the entire lifecycle of the extension
 * before implementing the individual mechanisms.
 *
 * The goal is to be able to read this file top-to-bottom and understand
 * what the product does.
 *
 * High-level lifecycle:
 *
 *   Browser
 *      │
 *      ▼
 *   detect LeetCode
 *      │
 *      ▼
 *   activate agent
 *      │
 *      ▼
 *   capture problem
 *      │
 *      ▼
 *   normalize problem
 *      │
 *      ▼
 *   persist problem
 *      │
 *      ▼
 *   create agent session
 *      │
 *      ▼
 *   ask agent to solve
 *      │
 *      ▼
 *   receive solution
 *      │
 *      ▼
 *   validate solution
 *      │
 *      ▼
 *   apply solution
 *      │
 *      ▼
 *   submit
 *      │
 *      ▼
 *   observe result
 *      │
 *      ├─────────────── success ──────────────► finalize
 *      │
 *      └─────────────── failure
 *                       │
 *                       ▼
 *                 record failure
 *                       │
 *                       ▼
 *                 give result to agent
 *                       │
 *                       ▼
 *                    retry
 *                       │
 *                       └───────────────┐
 *                                       │
 *                       ◄───────────────┘
 *
 * The actual browser, storage, networking, AI, and DOM implementations
 * should be filled in behind these functions later.
 */

/* ============================================================================
 * 1. DOMAIN TYPES
 * ============================================================================
 *
 * These types are the boundaries between phases of the system.
 *
 * If these types feel wrong, we should fix them before implementing internals.
 */

/**
 * A browser tab that may contain a problem.
 */
export interface BrowserTab {
	id: number
	url: string
	title: string
}

/**
 * The minimum information we need to identify a LeetCode problem.
 */
export interface ProblemReference {
	url: string
	slug: string
}

/**
 * The raw information captured from the webpage.
 *
 * This is deliberately separate from `Problem`.
 *
 * The webpage is not our canonical representation.
 */
export interface CapturedProblem {
	source: ProblemReference

	title: string

	description: string

	examples: ProblemExample[]

	constraints: string[]

	starterCode: string

	language: ProgrammingLanguage

	rawHtml?: string
}

export interface ProblemExample {
	input: string
	output: string
	explanation?: string
}

/**
 * The language selected by the user on LeetCode.
 *
 * Python is our fallback until we implement language detection.
 */
export type ProgrammingLanguage =
	| 'python'
	| 'javascript'
	| 'typescript'
	| 'java'
	| 'cpp'
	| 'c'
	| 'csharp'
	| 'go'
	| 'rust'
	| 'kotlin'
	| 'swift'
	| 'ruby'
	| 'php'
	| 'other'

/**
 * The normalized problem we give to the agent.
 *
 * This should eventually become the stable protocol between the
 * browser extension and Estate / local agents / cloud agents.
 */
export interface Problem {
	id: string

	source: 'leetcode'

	url: string

	slug: string

	title: string

	description: string

	examples: ProblemExample[]

	constraints: string[]

	language: ProgrammingLanguage

	starterCode: string
}

/**
 * What the AI agent returns.
 */
export interface AgentSolution {
	language: ProgrammingLanguage

	code: string

	explanation: string

	complexity: ComplexityAnalysis

	comments: string[]

	confidence?: number
}

export interface ComplexityAnalysis {
	time: string
	space: string
}

/**
 * A submission attempt.
 */
export interface Submission {
	id: string

	problemId: string

	attempt: number

	language: ProgrammingLanguage

	code: string

	submittedAt: number
}

/**
 * What LeetCode tells us after submission.
 */
export type SubmissionResult =
	| {
			status: 'accepted'

			runtime?: string

			memory?: string
	  }
	| {
			status: 'wrong-answer'

			message?: string

			testCase?: string

			expected?: string

			actual?: string
	  }
	| {
			status: 'compile-error'

			message: string
	  }
	| {
			status: 'runtime-error'

			message: string
	  }
	| {
			status: 'timeout'

			message?: string
	  }
	| {
			status: 'unknown'

			message?: string
	  }

/**
 * Everything the agent knows about the current attempt.
 *
 * This is important.
 *
 * We don't want:
 *
 *   solve -> submit -> forget
 *
 * We want an evolving record of the work.
 */
export interface Attempt {
	number: number

	solution?: AgentSolution

	submission?: Submission

	result?: SubmissionResult

	feedback?: AgentFeedback

	startedAt: number

	completedAt?: number
}

/**
 * Information given back to the agent after an unsuccessful attempt.
 */
export interface AgentFeedback {
	problem: Problem

	previousSolution: AgentSolution

	submission: Submission

	result: SubmissionResult

	previousAttempts: Attempt[]
}

/**
 * The complete persistent session.
 */
export interface AgentSession {
	id: string

	problem: Problem

	attempts: Attempt[]

	status: AgentSessionStatus

	createdAt: number

	updatedAt: number
}

export type AgentSessionStatus =
	| 'created'
	| 'capturing'
	| 'captured'
	| 'solving'
	| 'solution-ready'
	| 'submitting'
	| 'evaluating'
	| 'retrying'
	| 'solved'
	| 'failed'
	| 'cancelled'

/**
 * Persistent log entry.
 */
export interface AgentLogEntry {
	timestamp: number

	sessionId: string

	attempt: number

	phase: AgentState

	message: string

	data?: unknown
}

export interface BrowserObservation {
	url: string
	title: string
	page: PageState
	problem?: Problem
	editor?: EditorState
	submission?: SubmissionResult
}

export interface PageState {}
export interface EditorState {}

export type InactiveState = {
	type: 'inactive'
}

export type AvailableState = {
	type: 'available'
}

export type CapturingState = {
	type: 'capturing'
}

export type SolvingState = {
	type: 'solving'
}

export type SubmittingState = {
	type: 'submitting'
}

export type ReviewingState = {
	type: 'reviewing'
}

export type EvaluatingState = {
	type: 'evaluating'
}

export type RetryingState = {
	type: 'retrying'
}

export type CompleteState = {
	type: 'complete'
}

export type ErrorState = {
	type: 'error'
}

/**
 * What the extension currently believes is happening.
 *
 * This is intentionally explicit instead of deriving everything
 * from arbitrary booleans.
 */
export type AgentState =
	| InactiveState
	| AvailableState
	| CapturingState
	| SolvingState
	| SubmittingState
	| EvaluatingState
	| RetryingState
	| ReviewingState
	| CompleteState
	| ErrorState

export type AgentAction =
	| { type: 'write-code'; code: string }
	| { type: 'submit' }
	| { type: 'navigate'; url: string }
	| { type: 'wait' }
	| { type: 'stop'; reason: string }

export interface AgentRuntime {
	solve(request: AgentRequest): Promise<AgentResponse>
	revise(request: RevisionRequest): Promise<AgentResponse>
}

export type AgentRequest = {}
export type AgentResponse = {}
export type RevisionRequest = {}
