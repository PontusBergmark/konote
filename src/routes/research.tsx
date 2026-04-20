import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

type ResearchModel = "claude" | "gpt-4o";
type ResearchResult = {
  run: number;
  model: "Claude" | "GPT-4o";
  prompt: string;
  response: string;
};

const MODELS: ResearchModel[] = ["claude", "gpt-4o"];

const runResearchPrompt = createServerFn({ method: "POST" })
  .inputValidator((data: { prompt: string; run: number; model: ResearchModel }) => data)
  .handler(async ({ data }): Promise<ResearchResult> => {
    const response =
      data.model === "claude" ? await callClaude(data.prompt) : await callGpt4o(data.prompt);

    return {
      run: data.run,
      model: data.model === "claude" ? "Claude" : "GPT-4o",
      prompt: data.prompt,
      response,
    };
  });

async function callClaude(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "Error: ANTHROPIC_API_KEY is not configured.";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return `Error: Claude request failed (${res.status}).`;
    const json = (await res.json()) as { content?: Array<{ text?: string }> };
    return json.content?.map((part) => part.text ?? "").join("\n").trim() || "";
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : "Claude request failed."}`;
  }
}

async function callGpt4o(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "Error: OPENAI_API_KEY is not configured.";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return `Error: GPT-4o request failed (${res.status}).`;
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : "GPT-4o request failed."}`;
  }
}

function toCsv(rows: ResearchResult[]) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [
    ["run", "model", "prompt", "response"].map(escape).join(","),
    ...rows.map((row) => [row.run, row.model, row.prompt, row.response].map(escape).join(",")),
  ].join("\n");
}

export const Route = createFileRoute("/research")({
  component: ResearchPage,
  head: () => ({
    meta: [
      { title: "Research Runner — Konote" },
      { name: "description", content: "Internal prompt runner for collecting model responses." },
    ],
  }),
});

function ResearchPage() {
  const runPrompt = useServerFn(runResearchPrompt);
  const [promptText, setPromptText] = useState("");
  const [runs, setRuns] = useState(5);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [completed, setCompleted] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const prompts = useMemo(
    () => promptText.split("\n").map((line) => line.trim()).filter(Boolean),
    [promptText],
  );
  const total = prompts.length * Math.max(1, runs) * MODELS.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleRun = async () => {
    if (prompts.length === 0 || isRunning) return;
    setResults([]);
    setCompleted(0);
    setIsRunning(true);

    for (let run = 1; run <= Math.max(1, runs); run += 1) {
      for (const prompt of prompts) {
        await Promise.all(
          MODELS.map(async (model) => {
            const result = await runPrompt({ data: { prompt, run, model } });
            setResults((current) => [...current, result]);
            setCompleted((current) => current + 1);
          }),
        );
      }
    }

    setIsRunning(false);
  };

  const handleDownload = () => {
    const blob = new Blob([toCsv(results)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "research-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Internal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Research runner</h1>
        </div>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Prompts
              <Textarea
                value={promptText}
                onChange={(event) => setPromptText(event.target.value)}
                placeholder="Paste one prompt per line"
                className="min-h-56 resize-y font-mono text-sm"
              />
            </label>

            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-2 text-sm font-medium">
                Runs per prompt
                <input
                  type="number"
                  min={1}
                  value={runs}
                  onChange={(event) => setRuns(Math.max(1, Number(event.target.value) || 1))}
                  className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </label>
              <Button onClick={handleRun} disabled={isRunning || prompts.length === 0}>
                {isRunning ? "Running…" : "Run"}
              </Button>
              <Button variant="outline" onClick={handleDownload} disabled={results.length === 0 || isRunning}>
                Export CSV
              </Button>
              <span className="text-sm text-muted-foreground">
                {completed}/{total || 0} responses
              </span>
            </div>

            {isRunning && <Progress value={progress} aria-label="Research run progress" />}
          </div>
        </section>

        {results.length > 0 && (
          <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3 text-sm font-medium">Results</div>
            <div className="max-h-[520px] divide-y divide-border overflow-auto">
              {results.map((result, index) => (
                <article key={`${result.run}-${result.model}-${index}`} className="grid gap-2 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Run {result.run}</span>
                    <span>·</span>
                    <span>{result.model}</span>
                  </div>
                  <p className="font-medium">{result.prompt}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{result.response}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}