import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Interview Cracker" },
      { name: "description", content: "Interview Cracker — building, check back soon." },
      { property: "og:title", content: "Interview Cracker" },
      { property: "og:description", content: "Interview Cracker — building, check back soon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Interview Cracker" },
      { name: "twitter:description", content: "Interview Cracker — building, check back soon." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Interview Cracker
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Building — check back soon
        </p>
      </header>
      <footer className="absolute bottom-8 text-sm text-muted-foreground">
        September 5, 2026
      </footer>
    </div>
  );
}
