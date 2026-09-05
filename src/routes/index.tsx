import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Interview Cracker — Practise for the exact job" },
      {
        name: "description",
        content:
          "Paste a job description and get interviewed on what it actually asks for, with a spoken debrief at the end.",
      },
      { property: "og:title", content: "Interview Cracker" },
      {
        property: "og:description",
        content:
          "Practise the interview for the exact job. Five questions, spoken aloud, then a debrief.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

/* ---------------- Hardcoded data (fallbacks) ---------------- */

const QUESTIONS = [
  {
    id: 1,
    jdLine: "Build and own React components used across the product",
    question:
      "Tell me about a React component or small library you built that other people ended up reusing. What made it reusable?",
  },
  {
    id: 2,
    jdLine: "Strong grasp of hooks, state, and rendering performance",
    question:
      "A page you worked on was re-rendering too often and feeling sluggish. Walk me through how you found the cause and what you changed.",
  },
  {
    id: 3,
    jdLine: "TypeScript across the codebase, strict mode",
    question:
      "Describe a time TypeScript's type system actually saved you from a bug — and a time you had to fight it. What did you do?",
  },
  {
    id: 4,
    jdLine: "Work closely with designers on accessible UI",
    question:
      "How do you make sure the interfaces you build are accessible? Give me a concrete example of something you fixed or built with accessibility in mind.",
  },
  {
    id: 5,
    jdLine: "2+ years shipping production features end to end",
    question:
      "Pick a feature you shipped from idea to production. Where did it go wrong, and what did you personally do to get it over the line?",
  },
];

const DEBRIEF = [
  {
    question: QUESTIONS[0]!.question,
    jdLine: QUESTIONS[0]!.jdLine,
    said: "I built a data table for one project and some other teams copied it.",
    whyWeak:
      "It names an artefact but not the decisions: no API design, no documentation, no trade-offs. 'Copied it' suggests it spread by accident, not because you made it reusable.",
    stronger:
      "Name the component, the abstraction you chose (headless vs styled), how you versioned it, and one concrete adoption number — '4 teams, ~30 screens'. Show you designed for reuse on purpose.",
  },
  {
    question: QUESTIONS[1]!.question,
    jdLine: QUESTIONS[1]!.jdLine,
    said: "I added useMemo and useCallback in a few places and it got faster.",
    whyWeak:
      "This is the textbook guess-and-check answer. It skips measurement entirely, and scattered memoisation often makes performance worse. Interviewers hear 'I don't profile'.",
    stronger:
      "Lead with measurement: React DevTools Profiler, what was actually re-rendering, the root cause (e.g. a new object identity every render from context), then the fix and the before/after numbers.",
  },
  {
    question: QUESTIONS[2]!.question,
    jdLine: QUESTIONS[2]!.jdLine,
    said: "TypeScript catches undefined errors. Sometimes I just use 'any' when it's annoying.",
    whyWeak:
      "'undefined errors' is generic, and reaching for 'any' under strict mode is a red flag for a role that explicitly says strict TypeScript.",
    stronger:
      "Give one specific save (e.g. a discriminated union caught an unhandled API state at compile time) and one specific fight you resolved properly — generics, satisfies, or a type guard — never 'any'.",
  },
  {
    question: QUESTIONS[3]!.question,
    jdLine: QUESTIONS[3]!.jdLine,
    said: "I add alt text to images and make sure colours have enough contrast.",
    whyWeak:
      "Alt text and contrast are the minimum. Nothing about keyboard navigation, focus management, screen readers, or ARIA — which is where real accessibility work lives.",
    stronger:
      "Describe a full interaction: a modal or combobox you built with correct focus trapping, keyboard support, and aria attributes, ideally tested with an actual screen reader (VoiceOver/NVDA).",
  },
  {
    question: QUESTIONS[4]!.question,
    jdLine: QUESTIONS[4]!.jdLine,
    said: "We shipped a dashboard redesign. It was late because the APIs kept changing.",
    whyWeak:
      "The blame lands on 'the APIs'. There's no ownership, no decision you made, and no result. Interviewers want to hear what you did, not what happened to you.",
    stronger:
      "Structure it as situation → your decision → outcome: e.g. 'I proposed freezing the contract with a mock layer so frontend could ship on schedule; we launched 2 weeks later and adoption was X%.'",
  },
];

const PRIORITIES = [
  "Answer with measurements, not adjectives — profile first, then fix, then quote numbers.",
  "Replace generic claims with one specific story per question, with a decision you personally made.",
  "Cut blame words ('the APIs kept changing') and reframe every obstacle as an action you took.",
];

/* ---------------- Types & AI helper ---------------- */

type Persona = { name: string; title: string; manner: string };
type QuestionItem = { id: number; jdLine: string; question: string };
type DebriefData = {
  perAnswer: { jdRequirement: string; quote: string; whyWeak: string; strongerVersion: string }[];
  priorities: string[];
};

const DEFAULT_PERSONA: Persona = {
  name: "Meera Iyer",
  title: "Hiring Manager",
  manner: "Direct but warm.",
};

const HARDCODED_QUESTIONS = { persona: DEFAULT_PERSONA, questions: QUESTIONS };

const HARDCODED_DEBRIEF: DebriefData = {
  perAnswer: DEBRIEF.map((d) => ({
    jdRequirement: d.jdLine,
    quote: d.said,
    whyWeak: d.whyWeak,
    strongerVersion: d.stronger,
  })),
  priorities: PRIORITIES,
};

async function callAI(
  task: string,
  input: string,
  fallback: unknown
): Promise<{ data: any; source: string }> {
  try {
    const res = await fetch("/api/interview-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, input }),
    });
    if (!res.ok) return { data: fallback, source: "fallback" };
    const json = await res.json();
    if (!json || json.data == null) return { data: fallback, source: "fallback" };
    return { data: json.data, source: typeof json.source === "string" ? json.source : "live" };
  } catch {
    return { data: fallback, source: "fallback" };
  }
}

/* ---------------- Avatar ---------------- */

type AvatarState = "speaking" | "listening" | "thinking";

function Avatar({ state, name, title }: { state: AvatarState; name: string; title: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`relative rounded-full ${
          state === "speaking" ? "avatar-ring" : ""
        } ${state === "listening" ? "avatar-breathe" : ""}`}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          role="img"
          aria-label="Illustrated avatar of the interviewer"
          className="rounded-full bg-card"
        >
          {/* shoulders */}
          <path
            d="M25 140 C25 105 50 95 70 95 C90 95 115 105 115 140 Z"
            fill="#3b4252"
          />
          {/* neck */}
          <rect x="62" y="82" width="16" height="16" rx="6" fill="#e8b98d" />
          {/* head */}
          <circle cx="70" cy="58" r="32" fill="#f0c49b" />
          {/* hair */}
          <path
            d="M38 58 C36 30 56 20 70 20 C84 20 104 30 102 58 C100 44 88 36 70 36 C52 36 40 44 38 58 Z"
            fill="#2a2f3a"
          />
          {/* eyes */}
          <circle cx="58" cy="56" r="3.5" fill="#1c2333" />
          <circle cx="82" cy="56" r="3.5" fill="#1c2333" />
          {/* brows */}
          <path d="M52 48 Q58 45 64 48" stroke="#2a2f3a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M76 48 Q82 45 88 48" stroke="#2a2f3a" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* mouth */}
          {state === "speaking" ? (
            <ellipse className="avatar-mouth" cx="70" cy="74" rx="7" ry="4" fill="#8c4a3a" />
          ) : (
            <path d="M63 74 Q70 79 77 74" stroke="#8c4a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
        </svg>
        {state === "listening" && (
          <span
            className="absolute right-1 top-1 h-4 w-4 rounded-full bg-[#DC2626] rec-dot"
            aria-label="Recording"
          />
        )}
      </div>
      {state === "thinking" && (
        <div className="absolute -right-14 top-12 flex gap-1.5" aria-label="Thinking">
          <span className="think-dot h-2.5 w-2.5 rounded-full bg-muted-foreground" />
          <span className="think-dot h-2.5 w-2.5 rounded-full bg-muted-foreground [animation-delay:150ms]" />
          <span className="think-dot h-2.5 w-2.5 rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </div>
      )}
      <p className="mt-4 text-lg font-semibold text-foreground">{name}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

/* ---------------- Views ---------------- */

type View = "setup" | "preparing" | "interview" | "reviewing" | "result";

function Index() {
  const [view, setView] = useState<View>("setup");
  const [jd, setJd] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [avatarState, setAvatarState] = useState<AvatarState>("thinking");
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [reaction, setReaction] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [persona, setPersona] = useState<Persona>(DEFAULT_PERSONA);
  const [questions, setQuestions] = useState<QuestionItem[]>(QUESTIONS);
  const [debrief, setDebrief] = useState<DebriefData>(HARDCODED_DEBRIEF);
  const [demo, setDemo] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const retryRef = useRef(0);

  const question = questions[questionIndex];

  // Speak the question aloud whenever it appears.
  useEffect(() => {
    if (view !== "interview" || !question) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setAvatarState("listening");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(question.question);
    setAvatarState("speaking");
    utter.onend = () => setAvatarState("listening");
    utter.onerror = () => setAvatarState("listening");
    window.speechSynthesis.speak(utter);
    return () => window.speechSynthesis.cancel();
  }, [view, questionIndex, question]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const startInterview = async () => {
    setView("preparing");
    setAvatarState("thinking");
    const { data, source } = await callAI("questions", jd, HARDCODED_QUESTIONS);
    if (source === "fallback") setDemo(true);
    const qs: QuestionItem[] =
      Array.isArray(data?.questions) && data.questions.length > 0 ? data.questions : QUESTIONS;
    setQuestions(qs);
    setPersona(data?.persona ?? DEFAULT_PERSONA);
    setQuestionIndex(0);
    setView("interview");
  };

  const submitAnswer = async () => {
    if (busy || !answer.trim() || !question) return;
    const currentAnswer = answer;
    const currentQuestion = question.question;
    setAnswer("");
    setBusy(true);
    setAvatarState("thinking");
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    const input = JSON.stringify({
      jd,
      history: answers.map((a) => ({ question: a.question, answer: a.answer })),
      current: { question: currentQuestion, answer: currentAnswer },
    });
    const { data, source } = await callAI("reaction", input, {
      reaction: "Thank you, let's move on.",
      advance: true,
    });
    if (source === "fallback") setDemo(true);
    const text =
      typeof data?.reaction === "string" && data.reaction
        ? data.reaction
        : "Thank you, let's move on.";
    const shouldAdvance = data?.advance === false ? retryRef.current >= 1 : true;
    setReaction(text);

    const advance = async () => {
      setReaction(null);
      setBusy(false);
      if (data?.advance === false && retryRef.current < 1) {
        retryRef.current += 1;
        setRetryCount(retryRef.current);
        setAnswer("");
        setAvatarState("listening");
        return;
      }
      retryRef.current = 0;
      setRetryCount(0);
      const newAnswers = [...answers, { question: currentQuestion, answer: currentAnswer }];
      setAnswers(newAnswers);
      if (questionIndex + 1 >= questions.length) {
        setView("reviewing");
        setAvatarState("thinking");
        const res = await callAI(
          "debrief",
          JSON.stringify({ jd, transcript: newAnswers }),
          HARDCODED_DEBRIEF
        );
        if (res.source === "fallback") setDemo(true);
        setDebrief(
          res.data && Array.isArray(res.data.perAnswer) && Array.isArray(res.data.priorities)
            ? res.data
            : HARDCODED_DEBRIEF
        );
        setView("result");
      } else {
        setQuestionIndex((i) => i + 1);
      }
    };

    if ("speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(text);
      setAvatarState("speaking");
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        advance();
      };
      utter.onend = finish;
      utter.onerror = finish;
      window.speechSynthesis.speak(utter);
      // Safety net in case speech events never fire.
      timers.current.push(setTimeout(finish, 12000));
    } else {
      timers.current.push(setTimeout(advance, 1500));
    }
  };

  const startOver = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setJd("");
    setQuestionIndex(0);
    setAnswers([]);
    setAnswer("");
    setReaction(null);
    setBusy(false);
    setPersona(DEFAULT_PERSONA);
    setQuestions(QUESTIONS);
    setDebrief(HARDCODED_DEBRIEF);
    setDemo(false);
    setView("setup");
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {demo && (view === "interview" || view === "result" || view === "reviewing") && (
        <span className="fixed right-4 top-4 z-50 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-500">
          Demo response — live AI unavailable
        </span>
      )}

      {view === "setup" && (
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Practise the interview for this exact job.
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Paste the job description. You'll be interviewed on what it actually asks for.
          </p>
          <label htmlFor="jd" className="sr-only">
            Job description
          </label>
          <textarea
            id="jd"
            rows={12}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full job description here…"
            className="mt-8 w-full rounded-xl border border-input bg-card p-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            disabled={jd.trim().length <= 100}
            onClick={startInterview}
            className="mt-6 rounded-xl bg-[#DC2626] px-6 py-4 text-lg font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start interview
          </button>
          {jd.trim().length <= 100 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {Math.max(0, 101 - jd.trim().length)} more characters needed.
            </p>
          )}
        </main>
      )}

      {view === "preparing" && (
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-16">
          <Avatar state="thinking" name={DEFAULT_PERSONA.name} title={DEFAULT_PERSONA.title} />
          <p className="mt-8 text-lg text-muted-foreground">Reading the job description…</p>
        </main>
      )}

      {view === "interview" && question && (
        <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-10 px-6 py-12 md:grid-cols-[240px_1fr] md:items-center">
          <div className="flex justify-center md:justify-start">
            <Avatar state={avatarState} name={persona.name} title={persona.title} />
          </div>
          <section aria-live="polite">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Question {questionIndex + 1} of {questions.length}
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
              {question.question}
            </h2>
            <p className="mt-3 text-sm font-medium text-[#DC2626]">
              From the JD: {question.jdLine}
            </p>

            {reaction ? (
              <p className="mt-8 text-xl text-muted-foreground">{reaction}</p>
            ) : (
              <div className="mt-8">
                <label htmlFor="answer" className="mb-2 block text-base font-medium">
                  Your answer
                </label>
                <textarea
                  id="answer"
                  rows={6}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer as you would say it…"
                  className="w-full rounded-xl border border-input bg-card p-4 text-base leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={submitAnswer}
                    disabled={busy || !answer.trim()}
                    className="rounded-xl bg-[#DC2626] px-6 py-3 text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Submit answer
                  </button>
                  <button
                    disabled
                    title="Coming next"
                    className="cursor-not-allowed rounded-xl border border-input px-6 py-3 text-base text-muted-foreground opacity-50"
                  >
                    🎤 Speak instead (coming next)
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      )}

      {view === "reviewing" && (
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-16">
          <Avatar state="thinking" name={persona.name} title={persona.title} />
          <p className="mt-8 text-lg text-muted-foreground">Reviewing what you said…</p>
        </main>
      )}

      {view === "result" && (
        <main className="mx-auto w-full max-w-3xl px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your debrief</h1>
          <p className="mt-2 text-muted-foreground">
            {answers.length} answers reviewed against what the job description actually asked for.
          </p>

          <div className="mt-10 space-y-8">
            {debrief.perAnswer.map((d, i) => (
              <article key={i} className="rounded-2xl border border-border bg-card p-6">
                <span className="inline-block rounded-md bg-[#DC2626]/15 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[#DC2626]">
                  JD: {d.jdRequirement}
                </span>
                <h2 className="mt-3 text-xl font-semibold leading-snug">
                  {questions[i]?.question ?? answers[i]?.question ?? `Answer ${i + 1}`}
                </h2>
                <blockquote className="mt-4 border-l-2 border-border pl-4 italic text-muted-foreground">
                  “{d.quote}”
                </blockquote>
                <p className="mt-4 text-base leading-relaxed">
                  <span className="font-semibold">Why this was weak: </span>
                  {d.whyWeak}
                </p>
                <div className="mt-4 rounded-xl bg-secondary p-4">
                  <p className="text-base leading-relaxed">
                    <span className="font-semibold">Stronger version: </span>
                    {d.strongerVersion}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-12">
            <h2 className="text-2xl font-bold">Your top 3 priorities</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-6 text-lg leading-relaxed">
              {debrief.priorities.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          </section>

          <button
            onClick={startOver}
            className="mt-12 rounded-xl bg-[#DC2626] px-6 py-4 text-lg font-semibold text-white"
          >
            Start over
          </button>
        </main>
      )}
    </div>
  );
}
