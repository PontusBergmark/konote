import { createFileRoute, Link } from "@tanstack/react-router";
import { brands } from "../data/brands";
import { attributes as allAttributes } from "../data/attributes";
import { currentScores } from "../data/scores";
import { coOccurrenceData } from "../data/cooccurrence";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Konote — How are LLMs positioning your brand?" },
      {
        name: "description",
        content:
          "See which brand associations stick, which are missing, and how your positioning holds up inside ChatGPT and Claude.",
      },
      { property: "og:title", content: "Konote — How are LLMs positioning your brand?" },
      {
        property: "og:description",
        content:
          "Track what LLMs associate with your brand. Validate it matches your positioning. Catch gaps before buyers do.",
      },
    ],
  }),
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <ProblemFraming />
        <ProductDemo />
        <HowItWorks />
        <UseCases />
        <FeatureGrid />
        <FAQ />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------------- Header ---------------- */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">Konote</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#use-cases" className="hover:text-foreground transition-colors">Use cases</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <Link
          to="/app"
          className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
        >
          Open app
        </Link>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-primary-foreground"
      style={{ backgroundColor: "var(--primary)" }}
      aria-hidden
    >
      K
    </span>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
            New: brand association tracking for LLMs
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
            How are LLMs positioning your brand?
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            See which associations stick, which are missing, and how your positioning holds up inside ChatGPT and Claude.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/app"
              className="inline-flex h-11 items-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              See it for your brand →
            </Link>
            <a
              href="#demo"
              className="inline-flex h-11 items-center rounded-md border border-border px-5 text-sm font-medium hover:bg-secondary"
            >
              Watch the demo
            </a>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Tracks <span className="text-foreground">ChatGPT</span> · <span className="text-foreground">Claude</span>
          </p>
        </div>

        {/* Hero visual */}
        <div className="mt-14">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

function HeroPreview() {
  const brand = brands.find((b) => b.id === "hubspot")!;
  const scores = currentScores.scores[brand.id];
  const intended = allAttributes.slice(0, 5).map((a) => ({
    name: a.name,
    score: scores[a.id] ?? 0,
  }));
  const top = [...intended].sort((a, b) => b.score - a.score);

  return (
    <div className="relative">
      <div className="absolute inset-x-8 -top-6 h-12 rounded-3xl bg-primary/10 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        {/* fake window chrome */}
        <div className="flex items-center gap-1.5 border-b border-border bg-secondary/40 px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="ml-3 text-[11px] text-muted-foreground">konote.app · {brand.name} · Overview</span>
        </div>
        <div className="p-6">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            LLMs associate {brand.name} most with
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <h3 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--primary)" }}>
              {top[0].name}
            </h3>
            <span className="text-sm tabular-nums text-muted-foreground">{top[0].score}</span>
            <span className="rounded border border-primary/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-primary">
              intended
            </span>
          </div>
          <div className="mt-5 divide-y divide-border">
            {top.slice(1).map((a, i) => {
              const pct = (a.score / top[0].score) * 100;
              return (
                <div key={a.name} className="flex items-center gap-4 py-2.5">
                  <span className="w-4 text-[10px] tabular-nums text-muted-foreground">{i + 2}</span>
                  <span className="w-40 truncate text-sm text-foreground">{a.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: brand.color }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{a.score}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Problem ---------------- */

function ProblemFraming() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          LLMs are shaping brand positioning — whether you're tracking it or not.
        </h2>
        <div className="mt-6 space-y-4 text-base text-muted-foreground md:text-lg">
          <p>
            Buyers use them to explore categories, compare options, and evaluate specific brands. In doing so, these
            models form associations, assign attributes, and frame competitive relationships.
          </p>
          <p className="text-foreground">
            That's positioning. And most teams have no visibility into it.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Demo ---------------- */

function ProductDemo() {
  const brand = brands.find((b) => b.id === "hubspot")!;
  const scores = currentScores.scores[brand.id];
  const intended = allAttributes.map((a) => ({
    id: a.id,
    name: a.name,
    score: scores[a.id] ?? 0,
  }));
  const co = coOccurrenceData[brand.id]
    .filter((c) => c.type === "Concept" || c.type === "Category")
    .slice(0, 4);

  function statusOf(score: number) {
    if (score >= 65) return { label: "Strong", tone: "text-primary" };
    if (score >= 40) return { label: "Moderate", tone: "text-foreground" };
    if (score >= 15) return { label: "Weak", tone: "text-muted-foreground" };
    return { label: "Absent", tone: "text-muted-foreground" };
  }

  return (
    <section id="demo" className="border-b border-border bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Live preview</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            See how your brand is being positioned.
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Explore which associations stick, which are absent, and where competitors are bleeding into your space.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border bg-background/40 px-4 py-2.5">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Fresh</span>
              <span>· {brand.name} · scanned 3 min ago</span>
            </div>
            <span className="text-[11px] text-muted-foreground">Sample data</span>
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            {/* Left: intended landing */}
            <div className="border-b border-border p-6 md:border-b-0 md:border-r">
              <h3 className="text-sm font-medium">Are your intended associations landing?</h3>
              <div className="mt-4 divide-y divide-border">
                {intended.map((a) => {
                  const s = statusOf(a.score);
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-medium">{a.name}</span>
                          <span className="rounded border border-primary/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-primary">
                            intended
                          </span>
                        </div>
                        <p className={`mt-0.5 text-[11px] ${s.tone}`}>
                          {s.label} association
                        </p>
                      </div>
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${a.score}%`, backgroundColor: brand.color }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-medium tabular-nums">{a.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: discovered + competitors */}
            <div className="p-6">
              <h3 className="text-sm font-medium">Also associated with</h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Concepts LLMs surfaced that you didn't claim.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {co.map((c) => (
                  <span
                    key={c.entity}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs"
                  >
                    <span className="font-medium">{c.entity}</span>
                    <span className="rounded border border-border px-1 py-px text-[9px] uppercase tracking-wide text-muted-foreground">
                      {c.type.toLowerCase()}
                    </span>
                  </span>
                ))}
              </div>

              <h3 className="mt-7 text-sm font-medium">Competitors in your space</h3>
              <div className="mt-3 space-y-2">
                {brands
                  .filter((b) => b.id !== brand.id)
                  .slice(0, 3)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="text-xs font-medium">{b.name}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Overlap on {Math.floor(2 + Math.random() * 2)} attributes
                      </span>
                    </div>
                  ))}
              </div>

              <Link
                to="/app"
                className="mt-6 inline-flex text-xs font-medium text-primary hover:underline"
              >
                Open the full app →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Define your positioning",
      body: "Specify the concepts, attributes, and associations that reflect your intended positioning.",
    },
    {
      n: "02",
      title: "Analyse LLM behaviour",
      body: "Structured prompts designed to mimic real buyer questions, run across ChatGPT and Claude.",
    },
    {
      n: "03",
      title: "Spot the gaps",
      body: "Where your positioning lands, where it doesn't, and what's showing up instead.",
    },
  ];
  return (
    <section id="how-it-works" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Three steps to see what LLMs say about you.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card p-6">
              <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Use cases ---------------- */

function UseCases() {
  const cases = [
    {
      title: "Brand & marketing teams",
      body: "Validate whether your intended positioning is reflected in how LLMs actually represent you.",
    },
    {
      title: "Product marketers",
      body: "See how your category associations and competitive positioning are being framed to buyers.",
    },
    {
      title: "Agencies",
      body: "Show clients where their positioning lands — and where it breaks down — inside generated responses.",
    },
    {
      title: "Founders",
      body: "Understand what attributes and associations surface when an LLM is asked about your company.",
    },
  ];
  return (
    <section id="use-cases" className="border-b border-border bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Who it's for</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Built for the people who own positioning.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {cases.map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold tracking-tight">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Feature grid ---------------- */

function FeatureGrid() {
  const features = [
    "Which attributes and concepts are consistently associated with your brand",
    "Which intended associations are absent or weak",
    "Where competitor positioning overlaps with yours",
    "How strongly your key associations come through relative to alternatives",
    "Whether your positioning is consistent across ChatGPT and Claude",
  ];
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">What you can measure</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Five questions Konote answers.
          </h2>
        </div>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-3 bg-card p-6"
            >
              <span
                className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-primary-foreground"
                style={{ backgroundColor: "var(--primary)" }}
              >
                {i + 1}
              </span>
              <p className="text-sm">{f}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

function FAQ() {
  const faqs = [
    {
      q: "What's the methodology?",
      a: "Structured prompts designed to mimic real buyer questions. We look at which associations and attributes consistently attach to your brand across models — and which don't.",
    },
    {
      q: "Is this statistically valid?",
      a: "No, and that's not the point. It's not a survey or a benchmark. It's a structured read on how LLMs form and reflect brand associations under consistent conditions.",
    },
    {
      q: "How is this different from SEO or share of voice tools?",
      a: "Those track traffic, rankings, and mentions. This is about which associations and attributes LLMs attach to your brand inside generated answers — a layer those tools don't reach.",
    },
    {
      q: "Does this replace my existing analytics?",
      a: "No. It sits underneath them. Different question, different layer.",
    },
    {
      q: "Is there a free plan?",
      a: "Yes. Run a limited number of queries to see how it works before committing.",
    },
  ];
  return (
    <section id="faq" className="border-b border-border">
      <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">FAQ</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Questions, answered.
        </h2>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-base font-medium">{f.q}</span>
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCTA() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-6 py-24 md:py-32 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
          Your positioning exists inside these models — whether you're tracking it or not.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">Now you can see it.</p>
        <Link
          to="/app"
          className="mt-8 inline-flex h-12 items-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Open app →
        </Link>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

function SiteFooter() {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-xs text-muted-foreground md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-medium text-foreground">Konote</span>
          <span>· © {new Date().getFullYear()}</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
