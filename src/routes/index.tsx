import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import tbsLogo from "@/assets/tbs-logo.jpeg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TBS Meridian Realities — The Billionaire Standard" },
      {
        name: "description",
        content:
          "A disciplined member institution pooling capital to acquire income-generating real estate, hotel units, condominiums, and other cash-flow assets.",
      },
      { property: "og:title", content: "TBS Meridian Realities" },
      {
        property: "og:description",
        content:
          "A disciplined member institution pooling capital to acquire income-generating real estate and cash-flow assets.",
      },
      { property: "og:image", content: tbsLogo.url },
    ],
  }),
  component: Home,
});

const nav = [
  { href: "#about", label: "About" },
  { href: "#model", label: "Investment Model" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#members", label: "Members" },
  { href: "#membership", label: "Membership" },
  { href: "#faq", label: "FAQ" },
] as const;

function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <Hero />
        <About />
        <WhyCollective />
        <InvestmentModel />
        <Portfolio />
        <Members />
        <Leadership />
        <Membership />
        <FAQ />
        <PortalSummary />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/[0.06] backdrop-blur-xl" : "border-b border-transparent"
      }`}
      style={{
        background: scrolled
          ? "color-mix(in oklab, var(--navy-ink) 88%, transparent)"
          : "var(--gradient-navy)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 text-navy-foreground">
        <a href="#top" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/95 p-1 shadow-[var(--shadow-glow)]">
            <img src={tbsLogo.url} alt="TBS Meridian Realities" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-[0.25em]">TBS</div>
            <div className="text-[10px] font-medium tracking-[0.25em] text-gold/90">MERIDIAN REALITIES</div>
          </div>
        </a>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-navy-foreground/75 transition-colors hover:text-gold">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#membership"
            className="hidden rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-navy-foreground/90 transition-colors hover:border-gold hover:text-gold md:inline-flex"
          >
            Login
          </a>
          <a
            href="#membership"
            className="rounded-md px-4 py-2 text-sm font-semibold text-navy-ink transition-transform hover:-translate-y-px"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            Apply
          </a>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-navy-foreground md:hidden"
          >
            <span className="text-base">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-white/[0.06] bg-navy-ink/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 text-sm">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-navy-foreground/80 hover:bg-white/[0.05] hover:text-gold"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden text-navy-foreground" style={{ background: "var(--gradient-navy)" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 15%, var(--gold) 0%, transparent 40%), radial-gradient(circle at 15% 85%, oklch(0.4 0.08 255) 0%, transparent 45%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--navy-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--navy-foreground) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-24 md:grid-cols-2 md:py-32">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Private Investment Association
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">
            TBS Meridian Realities,
            <span className="block bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-gold)" }}>
              The Billionaire Standard.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-navy-muted md:text-lg">
            A disciplined member institution pooling capital to acquire income-generating real estate, hotel units,
            condominiums, and other cash-flow assets.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#membership"
              className="rounded-md px-6 py-3 text-sm font-semibold text-navy-ink transition-transform hover:-translate-y-px"
              style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
            >
              Apply for Membership →
            </a>
            <a
              href="#model"
              className="rounded-md border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-navy-foreground backdrop-blur transition-colors hover:border-gold hover:text-gold"
            >
              How it works
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-navy-muted">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Audited governance
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              KYC verified members
            </div>
          </div>
        </div>
        <div
          className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-sm"
          style={{ boxShadow: "var(--shadow-elegant)" }}
        >
          <div
            className="pointer-events-none absolute -right-px -top-px h-24 w-24 rounded-bl-2xl rounded-tr-2xl opacity-30"
            style={{ background: "var(--gradient-gold)" }}
          />
          <div className="relative text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Founding Structure</div>
          <div className="relative mt-6 grid grid-cols-2 gap-6">
            <Stat value="25" label="Founding slots" />
            <Stat value="5" label="Max slots per member" />
            <Stat value="1:1" label="Slot to vote" />
            <Stat value="70%+" label="Decision thresholds" />
          </div>
          <div className="relative my-7 h-px w-full bg-white/[0.06]" />
          <p className="relative text-sm leading-relaxed text-navy-muted">
            More slots create more economic participation and more voting rights. Critical decisions require higher
            approval thresholds.
          </p>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-navy-foreground">{value}</div>
      <div className="mt-1 text-xs text-navy-muted">{label}</div>
    </div>
  );
}

function SectionBand({ id, tone = "cream", children }: { id?: string; tone?: "cream" | "white" | "navy"; children: ReactNode }) {
  const style: React.CSSProperties = tone === "navy" ? { background: "var(--gradient-navy)" } : {};
  const toneClass =
    tone === "navy" ? "text-navy-foreground" : tone === "white" ? "bg-white text-foreground" : "bg-cream text-foreground";
  return (
    <section id={id} className={`relative overflow-hidden ${toneClass}`} style={style}>
      {tone === "navy" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle at 90% 50%, var(--gold) 0%, transparent 40%)" }}
        />
      )}
      <div className="relative mx-auto max-w-7xl px-6 py-24">{children}</div>
    </section>
  );
}

function Card({ eyebrow, title, children }: { eyebrow?: string; title?: ReactNode; children?: ReactNode }) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-white p-7 transition-all hover:-translate-y-1 hover:border-gold/40"
      style={{ boxShadow: "var(--shadow-elegant)" }}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 transition-opacity group-hover:opacity-20"
        style={{ background: "var(--gradient-gold)" }}
      />
      {eyebrow && (
        <div className="relative mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{eyebrow}</div>
      )}
      {title && <h3 className="relative text-lg font-semibold text-foreground">{title}</h3>}
      {children && <div className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>}
    </div>
  );
}

function About() {
  return (
    <SectionBand id="about" tone="cream">
      <h2 className="text-3xl font-bold tracking-tight">What TBS is</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        TBS is a private association for members who want structured, collective access to income-producing assets with
        clear governance and documented decision-making.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <Card eyebrow="Collective capital" title="Pooled">
          Members combine capital to access larger assets than most could acquire alone.
        </Card>
        <Card eyebrow="Asset focus" title="Cash flow">
          Daily and monthly income potential leads the investment screen.
        </Card>
        <Card eyebrow="Governance" title="Weighted">
          One slot carries one vote, and critical matters require supermajority support.
        </Card>
      </div>
    </SectionBand>
  );
}

function WhyCollective() {
  return (
    <SectionBand tone="white">
      <h2 className="text-3xl font-bold tracking-tight">Why collective capital matters</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        A disciplined pool allows members to review larger hotel, condominium, and commercial assets with shared due
        diligence, shared records, and shared governance.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <Card title="Access stronger assets">
          TBS keeps the structure simple: capital participation, voting power, and economic rights are connected to the
          slots members hold.
        </Card>
        <Card title="Share review discipline">
          Every opportunity follows the same review path so members evaluate deals against consistent standards.
        </Card>
        <Card title="Align rights to capital">
          Voting and profit participation scale with slot ownership, keeping incentives aligned with contribution.
        </Card>
      </div>
    </SectionBand>
  );
}

const governanceRules: [string, string][] = [
  ["Economic rights", "Based on slots held by each member"],
  ["Voting rights", "1 slot = 1 vote"],
  ["New slot creation", "Requires member approval"],
  ["Critical decisions", "Require supermajority approval"],
  ["Member admission", "Requires approval"],
];

function InvestmentModel() {
  return (
    <SectionBand id="model" tone="cream">
      <div className="text-xs font-semibold tracking-[0.25em] text-gold">INVESTMENT MODEL</div>
      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
        Slots connect capital, economics, and voting rights.
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        During the founding phase, members acquire slots. Each slot carries economic rights and one vote. Members may
        own multiple slots, with a maximum of five founding slots per member.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Card>Members pool capital to access larger real estate, hotel unit, condominium, and commercial income assets.</Card>
        <Card>More slots create more voting rights and more economic participation.</Card>
        <Card>Standard investment decisions require 70% approval; governance changes require 80% approval.</Card>
        <Card>No dead assets are pursued unless members approve a clear strategic reason.</Card>
      </div>
      <div className="mt-10 overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy text-navy-foreground">
            <tr>
              <th className="px-6 py-4 font-semibold">Governance item</th>
              <th className="px-6 py-4 font-semibold">Rule</th>
            </tr>
          </thead>
          <tbody>
            {governanceRules.map(([item, rule]) => (
              <tr key={item} className="border-t border-border">
                <td className="px-6 py-4 font-semibold text-foreground">{item}</td>
                <td className="px-6 py-4 text-muted-foreground">{rule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionBand>
  );
}

type Asset = {
  name: string;
  location: string;
  badge: string;
  tone: "success" | "warning" | "neutral";
  description: string;
  type: string;
  value: string;
  income: string;
  allocation: string;
};

const assets: Asset[] = [
  {
    name: "Pieme Hotel Residence Units",
    location: "Busukuma, Uganda",
    badge: "UNDER REVIEW",
    tone: "warning",
    description: "Two hotel residence units offered for member review through a strategic partner opportunity.",
    type: "Hotel units",
    value: "$200,000",
    income: "Daily hospitality income",
    allocation: "12%",
  },
  {
    name: "Kulambiro Condominiums",
    location: "Kampala, Uganda",
    badge: "VALUE ENHANCEMENT",
    tone: "success",
    description: "Condominium assets connected to the Pieme offer as a bonus value enhancement.",
    type: "Condominiums",
    value: "$80,000",
    income: "Monthly rental income",
    allocation: "12%",
  },
  {
    name: "Future Uganda Property 1",
    location: "Uganda",
    badge: "TARGET PIPELINE",
    tone: "neutral",
    description: "Future domestic property target selected for cash-flow potential and member review.",
    type: "Commercial income asset",
    value: "TBD",
    income: "Monthly tenant income",
    allocation: "Pending approval",
  },
  {
    name: "Future Uganda Property 2",
    location: "Uganda",
    badge: "TARGET PIPELINE",
    tone: "neutral",
    description: "Prospective asset for the next phase of the portfolio.",
    type: "Mixed-use property",
    value: "TBD",
    income: "Daily or monthly cash flow",
    allocation: "Pending approval",
  },
];

function badgeClass(t: Asset["tone"]) {
  if (t === "success") return "bg-status-success text-status-success-foreground";
  if (t === "warning") return "bg-status-warning text-status-warning-foreground";
  return "bg-muted text-muted-foreground";
}

function Portfolio() {
  const categories = ["Current assets", "Assets under review", "Future target assets", "Partner-backed opportunities"];
  return (
    <SectionBand id="portfolio" tone="white">
      <div className="text-xs font-semibold tracking-[0.25em] text-gold">PORTFOLIO</div>
      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
        Income assets under ownership, review, and future targeting.
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Placeholder portfolio data shows current priorities, assets under review, and future acquisition directions.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {categories.map((c) => (
          <div key={c} className="rounded-xl border border-border bg-cream px-5 py-4 text-sm font-semibold text-foreground">
            {c}
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {assets.map((a) => (
          <div key={a.name} className="rounded-xl border border-border bg-white p-6" style={{ boxShadow: "var(--shadow-elegant)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{a.name}</h3>
                <div className="mt-1 text-sm text-muted-foreground">{a.location}</div>
              </div>
              <span className={`rounded-md px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${badgeClass(a.tone)}`}>
                {a.badge}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{a.description}</p>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Asset type</div>
                <div className="font-semibold text-foreground">{a.type}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Asset value</div>
                <div className="font-semibold text-foreground">{a.value}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Income type</div>
                <div className="font-semibold text-foreground">{a.income}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Member allocation</div>
                <div className="font-semibold text-foreground">{a.allocation}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionBand>
  );
}

function MemberCard({
  initials,
  name,
  slots,
  voting,
  country,
  status,
  statusTone,
}: {
  initials: string;
  name: string;
  slots: string;
  voting: string;
  country: string;
  status: string;
  statusTone: "success" | "warning";
}) {
  const toneClass =
    statusTone === "success"
      ? "bg-status-success text-status-success-foreground"
      : "bg-status-warning text-status-warning-foreground";
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-xs font-semibold text-gold">
          {initials}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{name}</div>
          <div className="text-xs text-gold">Founding Slot Holder</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground">Slots</div>
          <div className="font-semibold text-foreground">{slots}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Voting power</div>
          <div className="font-semibold text-foreground">{voting}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Country</div>
          <div className="font-semibold text-foreground">{country}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Status</div>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${toneClass}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}

function Members() {
  return (
    <SectionBand id="members" tone="cream">
      <h2 className="text-3xl font-bold tracking-tight">Founding members</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Member visibility helps the association stay organized while preserving a private, professional tone. Slot
        ownership determines economic rights and voting power.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MemberCard initials="FM" name="Founding Member" slots="3" voting="12%" country="Uganda" status="KYC Verified" statusTone="success" />
        <MemberCard initials="M2" name="Member Two" slots="2" voting="8%" country="Uganda" status="Member Review" statusTone="warning" />
        <MemberCard initials="M3" name="Member Three" slots="1" voting="4%" country="Kenya" status="Documents Pending" statusTone="warning" />
        <MemberCard initials="M4" name="Member Four" slots="1" voting="4%" country="Uganda" status="KYC Verified" statusTone="success" />
      </div>
    </SectionBand>
  );
}

function LeaderCard({ initials, name, role, children }: { initials: string; name: string; role: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-6" style={{ boxShadow: "var(--shadow-elegant)" }}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-xs font-semibold text-gold">
          {initials}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{name}</div>
          <div className="text-xs text-gold">{role}</div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function Leadership() {
  return (
    <SectionBand tone="white">
      <h2 className="text-3xl font-bold tracking-tight">Leadership structure</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Leadership roles support governance, asset review, treasury discipline, and member reporting. Members retain
        control through voting.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <LeaderCard initials="CP" name="Chairperson" role="Governance Lead">
          Coordinates member resolutions, governance standards, and meeting discipline.
        </LeaderCard>
        <LeaderCard initials="IC" name="Investment Committee Lead" role="Asset Review">
          Leads asset screening, partner review, risk notes, and investment recommendation packs.
        </LeaderCard>
        <LeaderCard initials="TL" name="Treasury Lead" role="Capital and Reporting">
          Tracks member commitments, distributions, financial reports, and reconciliation workflows.
        </LeaderCard>
      </div>
    </SectionBand>
  );
}

const memberRights: [string, string][] = [
  ["Founding slots", "25 founding slots are available. One member may own up to five slots during the founding phase."],
  ["Member rights", "Slots carry economic participation in profits and documented voting power."],
  ["Voting rights", "One slot equals one vote. More slots mean more voting power."],
  ["Profit participation", "Profit participation is based on the number of slots held."],
  ["Confidentiality", "Members must respect confidential partner, asset, and financial information."],
  ["NDA requirement", "Sensitive deal room materials require NDA acceptance before full access."],
];

function Membership() {
  return (
    <section id="membership" className="relative overflow-hidden text-navy-foreground" style={{ background: "var(--gradient-navy)" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1]"
        style={{ backgroundImage: "radial-gradient(circle at 80% 30%, var(--gold) 0%, transparent 45%)" }}
      />
      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="text-xs font-semibold tracking-[0.25em] text-gold">MEMBERSHIP</div>
        <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Founding membership is slot-based and governance-led.
        </h2>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-navy-muted">
          Members receive economic rights, voting rights, document access, and reporting according to the association
          structure.
        </p>
        <a
          href="#apply"
          className="mt-8 inline-block rounded-md px-6 py-3 text-sm font-semibold text-navy-ink transition-transform hover:-translate-y-px"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          Apply for a founding slot →
        </a>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {memberRights.map(([t, d]) => (
            <div key={t} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-navy-foreground">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-muted">{d}</p>
            </div>
          ))}
        </div>

        <form
          id="apply"
          onSubmit={(e) => e.preventDefault()}
          className="mt-14 grid max-w-3xl gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm sm:grid-cols-2"
        >
          <input
            type="text"
            placeholder="Full name"
            className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-navy-foreground placeholder:text-navy-muted focus:border-gold focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-navy-foreground placeholder:text-navy-muted focus:border-gold focus:outline-none"
          />
          <input
            type="text"
            placeholder="Country"
            className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-navy-foreground placeholder:text-navy-muted focus:border-gold focus:outline-none"
          />
          <input
            type="text"
            placeholder="Slots requested (1–5)"
            className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-navy-foreground placeholder:text-navy-muted focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="sm:col-span-2 rounded-md px-6 py-3 text-sm font-semibold text-navy-ink transition-transform hover:-translate-y-px"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            Submit application
          </button>
        </form>
      </div>
    </section>
  );
}

const faqs: [string, string][] = [
  ["What is a founding slot?", "A founding slot is a unit of participation in TBS. It carries one vote and a proportional share of economic rights during the founding phase."],
  ["How many slots can one member hold?", "Members may hold up to five founding slots while the founding phase is open."],
  ["How are decisions made?", "Standard investment decisions require 70% approval. Governance changes require 80% approval. Each slot equals one vote."],
  ["Are sensitive deal materials protected?", "Yes. Deal room materials require NDA acceptance before full access, and members are bound by confidentiality."],
  ["What types of assets does TBS target?", "Income-generating real estate, hotel units, condominiums, and commercial properties with daily or monthly cash flow."],
];

function FAQ() {
  return (
    <SectionBand id="faq" tone="cream">
      <h2 className="text-3xl font-bold tracking-tight">Frequently asked</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Common questions about membership, governance, and how the association operates.
      </p>
      <div className="mt-10 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
        {faqs.map(([q, a]) => (
          <details key={q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-foreground">
              {q}
              <span className="text-gold transition-transform group-open:rotate-45 text-xl leading-none">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </SectionBand>
  );
}

function PortalSummary() {
  return (
    <SectionBand tone="navy">
      <h2 className="text-3xl font-bold tracking-tight text-navy-foreground">Member portal summary</h2>
      <p className="mt-3 max-w-2xl text-sm text-navy-muted">
        The member portal centralizes portfolio records, deal review, weighted voting, documents, reports,
        announcements, and profile information.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {["Dashboard and portfolio snapshot", "Deal room with NDA controls", "Weighted voting and document center"].map((t) => (
          <div key={t} className="rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-navy-foreground">
            {t}
          </div>
        ))}
      </div>
    </SectionBand>
  );
}

function Footer() {
  return (
    <footer className="relative text-navy-foreground" style={{ background: "var(--gradient-navy)" }}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }}
      />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/95 p-1">
                <img src={tbsLogo.url} alt="TBS Meridian Realities" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-sm font-bold tracking-[0.25em]">TBS</div>
                <div className="text-[10px] font-medium tracking-[0.25em] text-gold/90">MERIDIAN REALITIES</div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-navy-muted">
              A private investment association focused on disciplined ownership of income-generating assets.
            </p>
          </div>
          {[
            ["Explore", [["#about", "About"], ["#portfolio", "Portfolio"], ["#faq", "FAQ"]]],
            ["Association", [["#about", "About"], ["#members", "Members"], ["#membership", "Apply"]]],
            ["Members", [["#model", "Investment Model"], ["#membership", "Membership"], ["#membership", "Login"]]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">{title as string}</div>
              <ul className="mt-4 space-y-3 text-sm">
                {(links as [string, string][]).map(([href, label]) => (
                  <li key={label}>
                    <a href={href} className="text-navy-foreground/75 transition-colors hover:text-gold">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center text-xs text-navy-muted md:flex-row md:text-left">
          <div>© {new Date().getFullYear()} TBS Meridian Realities. Private association.</div>
          <div>Data shown is mocked for preview. No investment solicitation is made by this interface.</div>
        </div>
      </div>
    </footer>
  );
}
