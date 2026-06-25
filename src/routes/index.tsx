import { createFileRoute } from "@tanstack/react-router";
import heroTower from "@/assets/hero-tower.jpg";
import { ArrowUpRight, Building2, FileSignature, ShieldCheck, Vote, PieChart, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TBS Meridian Realities — Private Investment Collective" },
      { name: "description", content: "A members-only collective sourcing institutional-grade real estate and private deals." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Marquee />
      <Model />
      <Portfolio />
      <Governance />
      <Membership />
      <Footer />
    </div>
  );
}

function Nav() {
  const links = ["About", "Investment Model", "Portfolio", "Membership", "FAQ"];
  return (
    <header className="absolute top-0 left-0 right-0 z-30">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 text-cream">
          <MeridianMark className="h-7 w-7 text-gold" />
          <span className="font-serif text-xl tracking-tight">TBS Meridian</span>
        </a>
        <nav className="hidden md:flex items-center gap-9 text-sm text-cream/75">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-gold transition-colors">{l}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href="#login" className="hidden sm:inline text-sm text-cream/75 hover:text-gold transition-colors">Member login</a>
          <a href="#apply" className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-medium text-navy-ink hover:bg-gold-soft transition-colors">
            Apply <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

function MeridianMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <circle cx="16" cy="16" r="14.5" stroke="currentColor" strokeWidth="1" />
      <path d="M16 1.5V30.5M1.5 16H30.5" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      <path d="M16 8L22 24H10L16 8Z" fill="currentColor" />
    </svg>
  );
}

function Hero() {
  return (
    <section id="top" className="relative isolate min-h-[100vh] bg-navy-ink text-cream overflow-hidden">
      <img
        src={heroTower}
        alt="Modernist tower at dusk"
        width={1600}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-ink via-navy-ink/85 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-ink via-transparent to-navy-ink/40" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pt-40 pb-24 lg:pt-48 lg:pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-cream/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cream/70 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Private collective — Vol. XII
          </div>
          <h1 className="mt-7 font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.02] text-cream">
            Institutional deals,<br />
            <span className="italic text-gold">collectively underwritten.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg text-cream/75 leading-relaxed">
            TBS Meridian Realities is a members-only investment collective. We source institutional-grade real estate
            and private deals, structure them transparently, and let members allocate by conviction.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#apply" className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-navy-ink hover:bg-gold-soft transition-colors">
              Request membership <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href="#investment-model" className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-6 py-3 text-sm text-cream/90 hover:border-gold hover:text-gold transition-colors">
              How it works
            </a>
          </div>
        </div>

        <dl className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 border-t border-cream/10 pt-12">
          {[
            { k: "$1.84B", v: "Aggregate deal flow underwritten" },
            { k: "47", v: "Closed transactions since 2018" },
            { k: "312", v: "Members across three chapters" },
            { k: "14.6%", v: "Net IRR, vintage 2019–2024" },
          ].map((s) => (
            <div key={s.v}>
              <dt className="font-serif text-4xl text-gold num">{s.k}</dt>
              <dd className="mt-2 text-sm text-cream/65 leading-snug max-w-[14ch]">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Hines", "Tishman Speyer", "Brookfield", "Related", "Greystar", "Oaktree", "BentallGreenOak", "KKR Real Estate"];
  return (
    <section className="border-y border-border bg-secondary/60 py-8 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 flex flex-wrap items-center gap-x-12 gap-y-3 text-sm text-muted-foreground">
        <span className="text-xs uppercase tracking-[0.18em] text-foreground/60">Co-invested alongside</span>
        {items.map((i) => (
          <span key={i} className="font-serif text-lg text-foreground/70">{i}</span>
        ))}
      </div>
    </section>
  );
}

function Model() {
  const steps = [
    { icon: Building2, t: "Sourcing", d: "Our investment committee screens 200+ opportunities annually from a closed broker network. Less than 4% reach members." },
    { icon: FileSignature, t: "Underwriting", d: "Each deal ships with a full memorandum, sponsor diligence, and third-party valuation before any vote is opened." },
    { icon: Vote, t: "Member vote", d: "Members vote to admit a deal to the platform. A 60% threshold across quorum-eligible members is required." },
    { icon: PieChart, t: "Allocation", d: "Members request slots; pro-rata fills are approved by managers and committed on-chain to a deal-specific SPV." },
    { icon: ShieldCheck, t: "Governance", d: "Every signature, vote, and allocation is recorded to an immutable audit trail visible to all members." },
    { icon: Users, t: "Exit & distribution", d: "Distributions flow back through the SPV. Performance is benchmarked against NCREIF and reported quarterly." },
  ];
  return (
    <section id="investment-model" className="py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">The investment model</p>
            <h2 className="mt-4 font-serif text-4xl lg:text-5xl leading-tight">
              A deal lifecycle designed for <span className="italic text-gold">accountability</span>, not velocity.
            </h2>
          </div>
          <p className="lg:col-span-6 lg:col-start-7 text-base text-muted-foreground leading-relaxed">
            We don't run a fund. We run a process. Six stages stand between an opportunity and your capital — each one
            documented, voted on, and auditable from the member portal.
          </p>
        </div>

        <ol className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
          {steps.map((s, i) => (
            <li key={s.t} className="group bg-card p-8 lg:p-10 hover:bg-secondary/50 transition-colors">
              <div className="flex items-start justify-between">
                <s.icon className="h-6 w-6 text-gold" strokeWidth={1.5} />
                <span className="font-serif text-sm text-muted-foreground num">0{i + 1}</span>
              </div>
              <h3 className="mt-8 font-serif text-2xl">{s.t}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Portfolio() {
  const deals = [
    { name: "Cedar & Vine", loc: "Austin, TX", type: "Multifamily — 312 units", commit: "$48.2M", irr: "16.4%", status: "Closed" },
    { name: "Meridian One", loc: "Chicago, IL", type: "Class-A Office repositioning", commit: "$112.0M", irr: "12.1%", status: "Hold" },
    { name: "Atlas Logistics Park", loc: "Phoenix, AZ", type: "Industrial — 1.4M sqft", commit: "$76.5M", irr: "18.9%", status: "Closed" },
    { name: "Harbor 38", loc: "Brooklyn, NY", type: "Mixed-use development", commit: "$94.8M", irr: "Targeting 15%", status: "Open vote" },
    { name: "Pinecrest Senior Living", loc: "Denver, CO", type: "Specialty residential", commit: "$31.4M", irr: "13.7%", status: "Closed" },
  ];
  return (
    <section id="portfolio" className="bg-navy text-cream py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cream/55">Selected portfolio</p>
            <h2 className="mt-4 font-serif text-4xl lg:text-5xl leading-tight max-w-2xl">
              A record of <span className="italic text-gold">underwritten conviction.</span>
            </h2>
          </div>
          <a href="#portfolio" className="text-sm text-gold hover:text-gold-soft inline-flex items-center gap-1.5">
            Full portfolio in member portal <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-14 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.15em] text-cream/50 border-b border-cream/15">
                <th className="py-4 pr-6 font-normal">Asset</th>
                <th className="py-4 pr-6 font-normal">Location</th>
                <th className="py-4 pr-6 font-normal">Strategy</th>
                <th className="py-4 pr-6 font-normal text-right">Commitment</th>
                <th className="py-4 pr-6 font-normal text-right">IRR</th>
                <th className="py-4 font-normal text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/10">
              {deals.map((d) => (
                <tr key={d.name} className="hover:bg-cream/[0.03] transition-colors">
                  <td className="py-5 pr-6 font-serif text-lg">{d.name}</td>
                  <td className="py-5 pr-6 text-cream/70">{d.loc}</td>
                  <td className="py-5 pr-6 text-cream/70">{d.type}</td>
                  <td className="py-5 pr-6 text-right num text-cream/90">{d.commit}</td>
                  <td className="py-5 pr-6 text-right num text-gold">{d.irr}</td>
                  <td className="py-5 text-right">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                      d.status === "Open vote" ? "bg-gold/15 text-gold" : "bg-cream/10 text-cream/70"
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />{d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Governance() {
  return (
    <section id="about" className="py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Governance</p>
          <h2 className="mt-4 font-serif text-4xl lg:text-5xl leading-tight">
            Every decision leaves a <span className="italic text-gold">trace.</span>
          </h2>
          <p className="mt-6 text-base text-muted-foreground leading-relaxed">
            Roles, votes, signatures, and capital movements are governed by a per-chapter permission model and recorded
            to an immutable audit log. Managers can act, members can verify, and system administrators can prove it —
            without anyone seeing the keys.
          </p>
          <ul className="mt-10 space-y-5">
            {[
              ["System admin", "Global oversight across every chapter and group."],
              ["Manager", "Approves applications, publishes deals, commits allocations."],
              ["Member", "Votes, signs, allocates, and reads their portfolio."],
            ].map(([r, d]) => (
              <li key={r} className="flex gap-4 border-t border-border pt-5">
                <span className="font-serif text-base text-gold w-32 shrink-0">{r}</span>
                <span className="text-sm text-muted-foreground">{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative">
          <div className="rounded-xl border border-border bg-card shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--navy-ink)_25%,transparent)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-5 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-gold" />
                Audit trail — Meridian One
              </div>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Live</span>
            </div>
            <ol className="divide-y divide-border text-sm">
              {[
                ["09:42", "Vote opened by L. Okafor", "Manager · Chicago"],
                ["10:18", "Memorandum v3 signed", "S. Mehta · Member"],
                ["11:05", "Slot request: $250,000", "J. Kowalski · Member"],
                ["12:30", "Allocation approved", "Committee · 4 of 5"],
                ["14:11", "Capital committed to SPV-019", "Treasury"],
              ].map(([t, e, who]) => (
                <li key={t + e} className="px-5 py-4 flex items-start gap-4">
                  <span className="num text-xs text-muted-foreground w-12 pt-0.5">{t}</span>
                  <div className="flex-1">
                    <p className="text-foreground">{e}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{who}</p>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-gold mt-2" />
                </li>
              ))}
            </ol>
          </div>
        </figure>
      </div>
    </section>
  );
}

function Membership() {
  return (
    <section id="membership" className="relative isolate bg-navy-ink text-cream py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-20 [background:radial-gradient(60%_60%_at_70%_30%,var(--gold)_0%,transparent_60%)]" />
      <div className="mx-auto max-w-5xl px-6 lg:px-10 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-cream/55">Membership</p>
        <h2 id="apply" className="mt-4 font-serif text-4xl lg:text-6xl leading-tight">
          Membership is by <span className="italic text-gold">introduction.</span>
        </h2>
        <p className="mt-6 max-w-2xl mx-auto text-base text-cream/75 leading-relaxed">
          New chapters open twice a year. Applications require sponsorship from an existing member or partner firm,
          accredited investor verification, and a 30-minute call with the chapter's lead manager.
        </p>

        <div className="mt-12 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
          {[
            ["01", "Sponsorship", "Introduced by a member or partner."],
            ["02", "Verification", "Accreditation & KYC review."],
            ["03", "Onboarding", "Chapter call, signed framework."],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-lg border border-cream/15 bg-cream/[0.03] p-6">
              <span className="font-serif text-2xl text-gold num">{n}</span>
              <h4 className="mt-4 font-serif text-lg">{t}</h4>
              <p className="mt-2 text-sm text-cream/65">{d}</p>
            </div>
          ))}
        </div>

        <form className="mt-14 max-w-xl mx-auto flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="you@firm.com"
            className="flex-1 rounded-full border border-cream/20 bg-cream/[0.04] px-5 py-3 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:border-gold transition-colors"
          />
          <button className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-navy-ink hover:bg-gold-soft transition-colors">
            Request introduction
          </button>
        </form>
        <p className="mt-4 text-xs text-cream/45">We review applications within five business days.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-navy text-cream/70 border-t border-cream/10">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 text-cream">
            <MeridianMark className="h-6 w-6 text-gold" />
            <span className="font-serif text-lg">TBS Meridian</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed max-w-xs">
            A private collective for institutional real estate and private deals. Est. 2018.
          </p>
        </div>
        {[
          ["Collective", ["About", "Investment model", "Portfolio", "Partners"]],
          ["Members", ["Login", "Documents", "Voting", "Reports"]],
          ["Office", ["Chicago — HQ", "New York", "Austin", "contact@tbsmeridian.com"]],
        ].map(([title, items]) => (
          <div key={title as string}>
            <h5 className="text-xs uppercase tracking-[0.18em] text-cream/50">{title as string}</h5>
            <ul className="mt-5 space-y-3 text-sm">
              {(items as string[]).map((i) => (
                <li key={i}><a href="#" className="hover:text-gold transition-colors">{i}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-cream/50">
          <p>© {new Date().getFullYear()} TBS Meridian Realities, LLC. All rights reserved.</p>
          <p>Securities offered through private placement to accredited investors only.</p>
        </div>
      </div>
    </footer>
  );
}
