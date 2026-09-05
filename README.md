# Interview Cracker

**Practise the interview for this exact job.** Paste a job description, get interviewed on what it actually asks for, and hear what was weak in your own words.

🔗 **Live:** https://interview-cracker.lovable.app
📦 **Repo:** https://github.com/ashutoshsuman/interview-cracker-landing
👤 **Team 6 — Ashutosh Suman (solo)**

---

## The problem

Freshers and job switchers prepare for interviews by *reading* questions instead of *answering* them. The first time they speak under pressure is in the real interview. And every role asks for something different — the job description already says what, but generic question lists ignore it.

The feedback loop is broken at both ends: preparation is silent and generic, and rejection arrives with no explanation. The candidate never hears themselves, and nobody tells them what was actually weak.

## Target user

A final-year student or a two-year job switcher with an interview in three days, alone at a laptop, with the JD open in another tab. Not a recruiter, not a coach — the candidate.

## Solution

Paste a JD → be interviewed by a person on screen who asks questions drawn from that JD, one at a time → receive a debrief that quotes your own sentences back and explains why each was weak.

## Core workflow

1. Paste the full job description.
2. The AI reads it and generates five role-specific questions plus an interviewer persona whose name, title and manner fit the company's tone.
3. The interviewer appears, speaks each question aloud, and shows the exact JD phrase that question came from.
4. You answer by voice or by typing. One question at a time — no skipping ahead, no going back, no seeing what's coming.
5. After each answer the interviewer reacts to what you actually said. If you didn't understand, she rephrases and waits. If you decline, she acknowledges it and moves on.
6. At the end, a debrief maps each answer to a JD requirement, quotes your own words, names the specific failure, and rewrites the answer using only what you said.

## Features

- **JD-traceable questions** — every question displays the verbatim JD line it came from.
- **A persona derived from the JD** — the interviewer's name, title and manner change with the role and company tone.
- **Voice or typed answers** — speech-to-text streams into an editable box; typing always works.
- **Context-aware reactions** — the full conversation so far is sent on every turn, so the interviewer notices when you revise, contradict or dodge.
- **Stay-on-question logic** — the model decides whether to advance or rephrase, with a forced advance on the second attempt.
- **Evidence-based debrief** — verbatim quotes and specific diagnoses instead of a score out of ten.

## Technology

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + TanStack + Tailwind + shadcn/ui |
| Server | TanStack server route (`src/routes/api/interview-ai.ts`) |
| Model | `openai/gpt-oss-120b` — **open-weights**, served via Groq |
| Voice out | Browser SpeechSynthesis API |
| Voice in | Browser Web Speech API (SpeechRecognition) |
| Build & host | Lovable + Lovable Cloud |
| State | React state only — no database |

## AI usage

Three calls, each with a purpose-built system prompt:

1. **Questions** — reads the JD, returns five questions with their source lines plus an interviewer persona.
2. **Reaction** — receives the JD, the full conversation history and the current answer; returns one spoken line plus an `advance` boolean deciding whether to move on or rephrase.
3. **Debrief** — receives the JD and the full transcript; returns per-answer analysis with verbatim quotes, and three priorities.

**Why AI and not templates:** a template can swap a job title into a fixed question list. It cannot read a JD and ask about *that company's* roadmap, and it cannot quote a candidate's own sentence back and explain why it was weak.

**When it fails:** every call is wrapped in a never-fail path. Invalid JSON triggers one retry with a stricter instruction; any further failure returns a hardcoded demo response with `source: "fallback"`, and the UI shows an amber "Demo response — live AI unavailable" badge. The interview never breaks for the user. Requests time out at 25 seconds.

## Real vs Dummy

| Feature | Status | Note |
|---|---|---|
| JD → 5 role-specific questions | **REAL** | Live model call, questions differ per JD |
| Interviewer persona from JD | **REAL** | Name, title and manner generated per JD |
| Question read aloud | **REAL** | Browser SpeechSynthesis |
| Voice answer input | **REAL** | Web Speech API, Chrome desktop; typing is the universal fallback |
| Reaction to each answer | **REAL** | Full conversation history sent every turn |
| Stay-on-question / advance decision | **REAL** | Model-decided, force-advance on second attempt |
| Final debrief with quotes | **REAL** | Live model call over the full transcript |
| Interviewer face | **ILLUSTRATED** | Animated SVG with speaking / listening / thinking states — not generated video |
| Demo fallback responses | **HARDCODED** | Only fires when the model call fails; amber badge makes it visible |
| Accounts / login | **NOT BUILT** | Deliberate — no login wall |
| Saved history | **NOT BUILT** | Deliberate — refreshing clears the session |
| Local open-weights deployment | **NOT BUILT** | Same model family runs via Ollama locally; not wired in the time available |

## How to run

```bash
git clone https://github.com/ashutoshsuman/interview-cracker-landing.git
cd interview-cracker-landing
npm install
```

Create a `.env` file with a Groq API key (free tier is sufficient):

```
GROQ_API_KEY=gsk_your_key_here
```

```bash
npm run dev
```

The key is read server-side only in `src/routes/api/interview-ai.ts` and is never exposed to the browser. Without a key the app still runs end to end on its demo fallback responses and shows the amber badge.

## Known limitations

- Speech recognition depends on the browser; reliable in Chrome desktop, unreliable on Firefox and some iOS versions. Typed input is always available.
- Five questions per session, fixed. No difficulty setting or round type.
- Nothing persists — refreshing the page ends the session.
- The debrief quality depends on the candidate giving something quotable; very short answers produce thinner analysis.
- Questions can occasionally draw on the same JD line twice.
- No accessibility audit was possible in four hours.

## What I'd build next

Session history so a candidate can see whether they improved between attempts; a second round with follow-up probing on the weakest answer; and a local open-weights mode via Ollama so answers never leave the device.

## Key decisions

See [DECISIONS.md](https://github.com/ashutoshsuman/interview-cracker-landing/blob/main/DICISIONS.md) for what was chosen, what was rejected, and why.

---

Built in four hours on 5 September 2026 for the I Build It With AI Championship, Bengaluru.
