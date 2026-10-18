# Intent: User-Owned Web Data & AI Agent Chrome Extension

## Author

Loi Tran, Independent Developer

September 20, 2026

## Problem

Much of the information people interact with on the web is controlled entirely by the website or platform providing it. Users may be able to view, search, or interact with their own data, but they often do not have a reliable, durable copy of that information under their own control.

Platform behavior can change over time. Features can disappear, historical data can become difficult or impossible to access, interfaces can be redesigned, retention policies can change, APIs can become restricted, or a platform may simply provide a worse experience than it previously did.

For example, a user may want to build a personal history of the videos they have watched on YouTube. The platform may expose a watch-history interface, but that interface does not necessarily provide a complete or convenient historical record. A user with many years of activity may discover that scrolling through the available history does not expose everything they know they have watched.

The same underlying problem exists in many other contexts: information that is useful to the user exists temporarily or indirectly inside a website, but the user has no independent representation of it.

The initial use case for this project is solving LeetCode problems with an AI agent. A browser extension can observe the problem a user is currently working on, extract the relevant information, send it to an AI agent, receive a solution, and interact with the page on the user's behalf.

However, the extension should not be designed as a single-purpose LeetCode automation tool. The LeetCode workflow is the initial proving ground for a broader system that can capture, structure, retain, and act on information encountered by the user on the web.

The fundamental problem is therefore:

**Users should be able to build their own durable layer of information and automation around the web applications they use, rather than having their history, context, and workflows exist exclusively inside those applications.**

## Proposed Outcome

Build a Chrome extension that acts as a user-controlled bridge between web applications, locally stored information, AI agents, and eventually the user's Estate environment.

The first concrete workflow will be an AI-assisted LeetCode solver:

1. Detect the LeetCode problem the user is viewing.
2. Extract the important problem information, including the title, description, examples, constraints, starter code, language, and relevant page state.
3. Convert the page into a structured representation owned by the extension rather than relying on the site's HTML as the permanent representation.
4. Send that representation to an AI agent, initially through a local service or API.
5. Receive a structured solution from the agent.
6. Apply the solution to the appropriate editor on the page.
7. Eventually submit the solution and observe the result.
8. If the solution fails, allow the agent to inspect the result, revise the solution, and continue the workflow.

The important architectural goal is that **the extracted problem data should not disappear after the interaction ends**.

The extension should be capable of retaining useful user-owned representations of information it encounters. This creates the foundation for future capabilities such as:

- A local history of LeetCode problems encountered by the user.
- Searching previously encountered problems independently of LeetCode's interface.
- Storing solutions, attempts, agent conversations, and submission results.
- Sending captured information into Estate for indexing and long-term organization.
- Allowing Estate or another local agent to reason over accumulated information.
- Building personal histories of activity on other websites.
- Preserving information that may become difficult to retrieve from a platform later.
- Creating user-controlled datasets from web activity rather than relying exclusively on platform-provided history.
- Reconstructing useful context even when a website changes its UI, search functionality, history interface, pricing, retention behavior, or API availability.

The extension should therefore be thought of as a **browser-side acquisition and interaction layer**, while Estate can eventually become the user's local knowledge, storage, indexing, and agent layer.

Conceptually:

```text
                    Web
                     │
        ┌────────────┼────────────┐
        │            │            │
    LeetCode      YouTube      Other Sites
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
              Chrome Extension
                     │
          ┌──────────┴──────────┐
          │                     │
       Capture               Act
          │                     │
          ▼                     ▼
    Structured Data        Web Automation
          │
          ▼
    Local Storage / Estate
          │
          ▼
      AI Agent(s)
          │
          ▼
   Search / Reason / Act
```

The extension should make it possible to progressively move from:

**"Use an AI to solve this webpage."**

toward:

**"This browser is continuously building a user-owned, structured representation of the information I care about, and my local tools and agents can use it."**

## Constraints & Boundaries

- The initial implementation must remain a Chrome extension and should use standard Chrome extension APIs wherever practical.
- The first demonstrable workflow should be LeetCode problem extraction → AI solution → browser interaction.
- The extension must not become tightly coupled to the AI provider. The agent should be replaceable, including a local Estate-backed agent and external APIs.
- Webpage-specific logic should be isolated from the general extension/agent architecture so additional websites can be supported later.
- Captured information should have a structured representation independent of the source website's DOM.
- The architecture should allow captured data to be persisted locally rather than treating the source website as the canonical storage location.
- Local persistence should be designed so that the project can eventually integrate with Estate without requiring the browser extension to be rewritten.
- The system should prefer user-owned copies of useful information where technically and legally appropriate, while respecting website terms, authentication boundaries, privacy expectations, and applicable laws.
- The extension should request the minimum browser permissions necessary for each capability rather than beginning with unrestricted access to every website.
- The AI/agent interface should use an explicit, structured protocol rather than passing arbitrary webpag
