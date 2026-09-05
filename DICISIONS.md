# Decisions

What I chose, what I rejected, and why. Written during the build, not after.

---

## Decision: Illustrated interviewer, not generated video
**Chose:** animated SVG avatar with speaking / listening / thinking states plus browser speech.
**Rejected:** avatar-video APIs.
**Because:** the brief asks for an interviewer who *asks and reacts*, not a photoreal face. Video generation adds an integration, per-call latency and a cost meter to the one moment that must not stall on stage.
**Cost accepted:** it looks illustrated rather than real. The reaction logic carries the realism instead.

## Decision: No database
**Chose:** React state for the whole session.
**Rejected:** Supabase tables for transcripts and history.
**Because:** nothing in the demo needs to survive a refresh. Persistence would have cost schema, wiring and RLS debugging for zero visible value in a four-hour build.
**Cost accepted:** refreshing loses the session. Documented as a limitation.

## Decision: No authentication
**Chose:** anonymous, single-session use.
**Rejected:** accounts and saved profiles.
**Because:** a login wall in front of a demo is explicitly disallowed, and auth is a classic hackathon time sink.

## Decision: Open-weights model
**Chose:** `openai/gpt-oss-120b` served via Groq.
**Rejected:** a closed frontier API as the primary path; and local Ollama as the primary path.
**Because:** open weights were worth extra credit and the hosted route keeps the public URL working for anyone, on mobile data, without my laptop. A local model cannot serve a public demo.
**Cost accepted:** the local-device mode remained unbuilt.

## Decision: Mock the whole flow before wiring any AI
**Chose:** built all three screens with hardcoded questions and a hardcoded debrief first, published, then swapped in live calls one at a time.
**Rejected:** building against the live API from the start.
**Because:** it guaranteed a working deployed product early, and it produced the fallback data as a by-product rather than as an afterthought.

## Decision: Never-fail AI path
**Chose:** retry once on invalid JSON, then return hardcoded demo data with `source: "fallback"` and an amber badge — always HTTP 200.
**Rejected:** surfacing errors to the user.
**Because:** an interview that stops mid-question is worse than an interview with a canned line. The badge keeps it honest rather than hiding the degradation.
**Proved useful twice:** a retired model ID returned 404, and a token cap starved the reaction call. The user-facing app never broke during either.

## Decision: Send the whole conversation on every turn
**Chose:** JD + all previous Q&A + current answer passed to each reaction call.
**Rejected:** sending only the latest answer.
**Because:** it lets the interviewer notice contradictions and revisions across the interview. Costs a few hundred tokens per turn and removes the need for a separate follow-up engine.

## Decision: The model decides whether to advance
**Chose:** the reaction call returns an `advance` boolean; the frontend forces advance on the second attempt.
**Rejected:** always advancing after any input.
**Because:** always advancing made it feel like a form. A candidate who says "I didn't understand" deserves a rephrase; a candidate who says "I don't know" deserves grace and a move on. The forced advance stops an infinite loop on stage.

## Decision: Pre-generate all five questions at the start
**Chose:** one call at JD paste, questions held in state.
**Rejected:** generating each question live between answers.
**Because:** "no skipping ahead, no seeing what's coming" is enforced by the UI, not by withholding generation — and it removes four chances for the demo to stall mid-interview.

## Decision: Show the JD line under every question
**Chose:** a visible "From the JD:" label carrying the verbatim source phrase.
**Rejected:** trusting that the questions look role-specific.
**Because:** it makes the JD-to-question link provable at a glance instead of a claim.

## Decision: Evidence over scores
**Chose:** per-answer verbatim quotes, a named failure, and a rewrite built only from what the candidate said.
**Rejected:** a score out of ten and a competency radar chart.
**Because:** a number tells you nothing about what to change before Thursday. This was where the differentiation budget went.

## Decision: Voice input built last
**Chose:** typed answers first, speech-to-text added once the whole flow was live and stable.
**Rejected:** building voice input early.
**Because:** the premise of the problem is answering out loud, so it mattered — but it depends on browser support and mic permissions, so it could not be allowed to block the core flow.
**Cost accepted:** browser-dependent; typing is always available.
