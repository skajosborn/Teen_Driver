import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      title: "Safety-First Filters",
      description:
        "Set the crash-test ratings, advanced driver assistance features, and insurance thresholds you expect.",
    },
    {
      title: "Smart Budget Guardrails",
      description:
        "Dial in purchase price, monthly payment, and maintenance costs to stay in your comfort zone.",
    },
    {
      title: "Family Fit Factors",
      description:
        "Prioritize seating, cargo needs, mileage, and style so your teen loves the car—and you love the decision.",
    },
  ];

  const steps = [
    {
      label: "Tell us what matters",
      detail:
        "Share your safety must-haves, budget range, driving habits, and any red lines.",
    },
    {
      label: "We scout the market",
      detail:
        "Our agentic engine scans dealer lots, certified pre-owned inventory, and owner-reported data.",
    },
    {
      label: "Review your short list",
      detail:
        "Get a concise report with pros/cons, negotiation insights, and next steps for each match.",
    },
  ];

  const faqs = [
    {
      question: "How accurate are the recommendations?",
      answer:
        "We combine federal safety data, insurance studies, and live inventory feeds to surface cars that match your exact criteria.",
    },
    {
      question: "Can I refine the list after the first run?",
      answer:
        "Absolutely. Adjust any parameter and regenerate in seconds—your history and notes stay synced.",
    },
    {
      question: "Does this replace talking to a dealer?",
      answer:
        "Think of Teen Driver as your research partner. We prep you with the right questions, offers, and confidence before you walk into a showroom.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-400/30 blur-3xl" />
          <div className="absolute right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
        </div>

        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/90 text-lg font-semibold text-slate-950 shadow-lg shadow-sky-500/30">
              TD
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Teen Driver</p>
              <p className="text-sm text-slate-300">
                Confidence for parents. Excitement for teens.
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a className="transition-colors hover:text-white" href="#features">
              Features
            </a>
            <a className="transition-colors hover:text-white" href="#how-it-works">
              How it works
            </a>
            <a className="transition-colors hover:text-white" href="#faq">
              FAQ
            </a>
            <Link
              className="rounded-full bg-white px-4 py-2 font-semibold text-slate-950 transition hover:bg-slate-100"
              href="/quiz"
            >
              Get started
            </Link>
          </div>
        </header>

        <main className="mx-auto flex max-w-6xl flex-col gap-24 px-6 pb-24 pt-10 sm:px-10 lg:flex-row lg:items-start">
          <section className="flex-1 space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 shadow-lg shadow-sky-500/20 backdrop-blur">
              Trusted by 2,500+ cautious parents
            </span>
            <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl shadow-slate-950/40">
              <Image
                src="/car6.jpg"
                alt="Illustration of a modern family car dashboard and safety tech"
                width={1200}
                height={620}
                className="h-auto w-full object-cover"
                priority
              />
              <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-slate-950/70 px-6 py-4 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Personalized Car Concierge
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  Every recommendation is tuned to your family&apos;s non-negotiables.
                </p>
              </div>
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Match the perfect first car for your teen—without second guessing.
            </h1>
            <p className="text-lg text-slate-300 sm:text-xl">
              Tell us the safety standards, budget guardrails, and lifestyle fit your
              family expects. Our agentic car concierge surfaces a personalized short
              list, complete with negotiation insights and readiness tips for your teen.
            </p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/quiz"
                className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 hover:shadow-sky-400/40"
              >
                Build my teen&apos;s shortlist
              </Link>
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-slate-200 transition hover:text-white"
              >
                See how it works →
              </a>
            </div>

            <div
              id="features"
              className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:grid-cols-3"
            >
              {features.map((feature) => (
                <div key={feature.title} className="space-y-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/70 text-sky-400">
                    ●
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside
            id="get-started"
            className="w-full max-w-md shrink-0 space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-slate-900/40 backdrop-blur-lg"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">
                Describe your ideal car in 90 seconds
              </h2>
              <p className="text-sm text-slate-200">
                The more you share, the smarter your shortlist becomes. We never sell or
                share your data.
              </p>
            </div>
            <form className="space-y-5">
              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                  Budget range
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min ($)"
                    className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  />
                  <input
                    type="number"
                    placeholder="Max ($)"
                    className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                  Safety priorities
                </span>
                <select className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40">
                  <option>Top-tier crash ratings (NHTSA & IIHS)</option>
                  <option>Advanced driver assistance features</option>
                  <option>Teen driver monitoring technology</option>
                  <option>Insurance-friendly models</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                  Daily driving needs
                </span>
                <select className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40">
                  <option>Commute & school drop-offs</option>
                  <option>Weekend adventures & hobbies</option>
                  <option>Shared family vehicle</option>
                  <option>Learning and practice only</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                  Must-have features
                </span>
                <textarea
                  rows={3}
                  placeholder="Blind-spot alerts, Apple CarPlay, AWD, etc."
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                />
              </label>

              <button
                type="button"
                className="w-full rounded-full bg-white py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-900/30 transition hover:bg-slate-100"
              >
                Generate my custom list
              </button>
            </form>
            <p className="text-xs text-slate-300">
              Response time: under 3 minutes during business hours.
            </p>
          </aside>
        </main>
      </div>

      <section
        id="how-it-works"
        className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-24 sm:px-10"
      >
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">
          How Teen Driver guides your decision
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.label}
              className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40"
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-sky-400">
                Step {index + 1}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-white">{step.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.detail}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900 to-slate-900/70 p-8 sm:grid-cols-3">
          <div>
            <p className="text-4xl font-semibold text-white">92%</p>
            <p className="mt-2 text-sm text-slate-300">
              of parents felt more confident negotiating after using Teen Driver.
            </p>
          </div>
          <div>
            <p className="text-4xl font-semibold text-white">3.5 hrs</p>
            <p className="mt-2 text-sm text-slate-300">
              average research time saved per family in the first week.
            </p>
          </div>
          <div>
            <p className="text-4xl font-semibold text-white">4.9 ★</p>
            <p className="mt-2 text-sm text-slate-300">
              satisfaction across concierge calls and shortlist reports.
            </p>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="mx-auto max-w-6xl space-y-8 px-6 pb-24 sm:px-10"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              FAQs for vigilant parents
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Straight answers to the most common questions we hear.
            </p>
          </div>
          <a
            href="mailto:hello@teendriver.ai"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white hover:text-white"
          >
            Still curious? Email us →
          </a>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40"
            >
              <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
              <p className="text-sm leading-relaxed text-slate-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p>© {new Date().getFullYear()} Teen Driver. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a className="transition hover:text-white" href="#">
              Privacy
            </a>
            <a className="transition hover:text-white" href="#">
              Terms
            </a>
            <a className="transition hover:text-white" href="#">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
