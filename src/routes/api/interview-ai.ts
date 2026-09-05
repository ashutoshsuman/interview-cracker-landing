import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "openai/gpt-oss-120b";

const BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

const PROMPTS: Record<string, string> = {
  questions: `You are an experienced hiring manager preparing to interview a candidate for a specific role. You have the job description in front of you.

Read the job description and write exactly 5 interview questions that could ONLY have been written for this job. Every question must be traceable to a specific line in the JD.

Rules:

- Question 1 is a warm opener tied to the role's core responsibility.

- Questions 2-4 probe the hardest requirements: named technologies, scale, ownership, ambiguity, collaboration. At least one must ask for a concrete past example with an outcome.

- Question 5 is forward-looking: a realistic scenario the person would face in week one of this job.

- Never ask a generic question (tell me about yourself, what is your greatest weakness, why do you want this job).

- Each question is one or two sentences, spoken aloud, no preamble.

- For each question, quote the exact phrase from the JD it came from, verbatim, max 12 words.

- Also invent an interviewer persona that fits this company's tone from the JD: a name, a job title, and one line describing their manner.

Return ONLY valid JSON, no markdown fences, no other text:

{"persona":{"name":"","title":"","manner":""},"questions":[{"id":1,"jdLine":"","question":""}]}`,

  reaction: `You are an interviewer in the middle of a live interview. You can see everything that has been said so far in this conversation. The candidate has just finished answering the current question.

You will receive: the job description, every previous question and answer in order, and the current question and answer.

Say one short sentence back to them before moving on.

Rules:

- One sentence, max 18 words, spoken aloud.

- Reference something specific they actually said in the answer they just gave.

- If this answer contradicts, revises, or repeats something they said earlier in this interview, acknowledge that shift naturally. Examples of the shape: noting they have now added a detail they left out before, or noting they have changed their position from an earlier answer.

- If they gave a much stronger or much thinner answer than their previous ones, let that register in your tone without praising or criticising.

- Do not evaluate, score, correct, or hint at whether the answer was good.

- Never ask a follow-up question.

- If the answer is empty or nonsense, give a neutral acknowledgement and move on.

Return ONLY valid JSON: {"reaction":""}`,

  debrief: `You are an interview coach reviewing a transcript. The candidate answered 5 questions for a specific job. Your feedback must be evidence-based: every judgement must point at something they actually said.

For each of the 5 answers, produce:

- jdRequirement: the requirement from the job description this answer was testing, in under 8 words.

- quote: a VERBATIM sentence or fragment from the candidate's own answer, copied exactly, max 25 words. If the answer was empty or too short to quote, set quote to "" and say so in whyWeak.

- whyWeak: 1-2 sentences naming the specific failure. Use concrete diagnoses: no example given, example with no outcome or number, claim without evidence, vague ownership (we instead of I), rambling without structure, missed the requirement being tested. Never use empty adjectives like good or could be better.

- strongerVersion: 2-3 sentences rewriting their answer using only facts they themselves mentioned. Never invent achievements, employers, metrics or technologies they did not say. If they gave you nothing to work with, say what they would need to add instead.

Then give exactly 3 priorities: the highest-impact fixes before their real interview, each one sentence, ordered by impact, each referencing a pattern you saw across answers.

Be direct and specific. This person has an interview in three days and needs the truth. Do not give a score out of ten.

Return ONLY valid JSON, no markdown fences:

{"perAnswer":[{"jdRequirement":"","quote":"","whyWeak":"","strongerVersion":""}],"priorities":["","",""]}`,

};

const FALLBACK: Record<string, unknown> = {
  questions: {
    persona: { name: "Meera Iyer", title: "Hiring Manager", manner: "Direct but warm." },
    questions: [
      { id: 1, jdLine: "demo mode", question: "Walk me through a project you owned end to end." },
      { id: 2, jdLine: "demo mode", question: "Tell me about a time performance was a problem. What did you measure?" },
      { id: 3, jdLine: "demo mode", question: "Describe a disagreement with a teammate on a technical decision." },
      { id: 4, jdLine: "demo mode", question: "How do you decide what to test and what to skip?" },
      { id: 5, jdLine: "demo mode", question: "Week one, you inherit undocumented code. What do you do first?" },
    ],
  },
  reaction: { reaction: "Thank you, let's move on." },
  debrief: {
    perAnswer: [],
    priorities: [
      "Lead every answer with a concrete example, not a description of your approach.",
      "Attach a number or an outcome to each example you give.",
      "Say I when describing what you personally did.",
    ],
  },
};

function extractJson(text: string) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callModel(system: string, user: string, maxTokens: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env["GROQ_API_KEY"]}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const upstreamBody = await res.text();
      console.error(`interview-ai upstream error: status ${res.status}, body: ${upstreamBody}`);
      throw new Error(`upstream ${res.status}: ${upstreamBody}`);
    }
    const json = await res.json();
    return extractJson(json.choices?.[0]?.message?.content ?? "");
  } finally {
    clearTimeout(timer);
  }
}

async function handle(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let task = "questions";
  try {
    const body = await req.json();
    task = body.task;
    const input = body.input;
    const system = PROMPTS[task];
    if (!system) throw new Error("unknown task");
    const maxTokens = task === "reaction" ? 100 : task === "questions" ? 1500 : 3000;
    let data;
    try {
      data = await callModel(system, input, maxTokens);
    } catch (_e) {
      data = await callModel(system + "\n\nCRITICAL: output raw JSON only. No prose, no markdown.", input, maxTokens);
    }
    return new Response(JSON.stringify({ ok: true, data, source: "live" }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("interview-ai failed:", err);
    return new Response(JSON.stringify({ ok: true, data: FALLBACK[task] ?? {}, source: "fallback" }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
}

export const Route = createFileRoute("/api/interview-ai")({
  server: {
    handlers: {
      POST: ({ request }) => handle(request),
      OPTIONS: ({ request }) => handle(request),
    },
  },
});
