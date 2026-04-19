import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
          List<span style={{ color: "var(--primary)" }}>Everywhere</span>
        </h1>
        <p className="text-xl mb-8" style={{ color: "var(--muted-foreground)" }}>
          Submit your startup to 1000+ directories automatically.
          Crawl, extract, generate, and submit — all in one pipeline.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            Get Started
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 rounded-lg font-semibold border"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Sign Up
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: "24+", label: "Directories" },
            { num: "4", label: "Submission Modes" },
            { num: "20x", label: "Parallel Workers" },
            { num: "Auto", label: "Weekly Updates" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{s.num}</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
