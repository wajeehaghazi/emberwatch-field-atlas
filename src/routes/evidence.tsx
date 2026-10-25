import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Fingerprint, Link2Off, RefreshCw, XCircle } from "lucide-react";
import { PanelHeader } from "@/components/fw/Shell";
import { useFW } from "@/lib/firewatch/store";
import { ALERTS, SEV_BG, SEV_TEXT, evidencePayload } from "@/lib/firewatch/data";
import { canonicalize, sha256Hex } from "@/lib/firewatch/hash";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence Integrity · FireWatch AI" },
      { name: "description", content: "Recompute and compare SHA-256 fingerprints of alert evidence payloads to detect tampering." },
      { property: "og:title", content: "Evidence Integrity · FireWatch AI" },
      { property: "og:description", content: "Deterministic payloads, SHA-256 fingerprints and MATCH / MISMATCH verification." },
    ],
  }),
  component: Evidence,
});

type Result = { ok: boolean; hash: string; at: string } | null;

function Evidence() {
  const fw = useFW();
  const list = useMemo(() => [...ALERTS].sort((a, b) => b.probability - a.probability), []);
  const a = list.find((x) => x.id === fw.selectedId) ?? list[0]!;
  const [recorded, setRecorded] = useState<Record<string, { hash: string; at: string }>>({});
  const [tamper, setTamper] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);

  const payload = useMemo(() => { const p = evidencePayload(a); return tamper ? { ...p, frp_mw: +(p.frp_mw * 0.6).toFixed(1) } : p; }, [a, tamper]);
  const canonical = canonicalize(payload);

  useEffect(() => {
    setResult(null); setTamper(false);
    if (recorded[a.id]) return;
    sha256Hex(canonicalize(evidencePayload(a))).then((hash) => setRecorded((r) => ({ ...r, [a.id]: { hash, at: `${a.acqDate}T${a.acqTime.slice(0, 2)}:${String(+a.acqTime.slice(2) + 9).padStart(2, "0")}:00Z` } })));
  }, [a.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const verify = async () => {
    setBusy(true);
    const hash = await sha256Hex(canonical);
    await new Promise((r) => setTimeout(r, 350));
    setResult({ ok: hash === recorded[a.id]?.hash, hash, at: new Date().toISOString().slice(0, 19) + "Z" });
    setBusy(false);
  };
  const rec = recorded[a.id];

  return (
    <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
      <section className="panel flex flex-col lg:h-[calc(100vh-6rem)]">
        <PanelHeader title="Evidence records" meta="Critical alerts first" />
        <div className="scroll-thin flex-1 overflow-y-auto">
          {list.map((x) => (
            <button key={x.id} onClick={() => fw.setSelectedId(x.id)} className={cn("relative flex w-full items-center gap-2.5 border-b border-border/60 px-3.5 py-2.5 text-left", x.id === a.id ? "bg-signal/[0.07]" : "hover:bg-accent/40")}>
              {x.id === a.id && <span className="absolute inset-y-0 left-0 w-[2px] bg-signal" />}
              <span className={cn("h-1.5 w-1.5 rounded-full", SEV_BG[x.severity])} />
              <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px]">{x.name}</span><span className="font-mono text-[10px] text-muted-foreground">{x.id}</span></span>
              <span className={cn("font-mono text-xs tnum", SEV_TEXT[x.severity])}>{x.probability.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="flex min-w-0 flex-col gap-3">
        <section className="panel p-5">
          <div className="flex flex-wrap items-start gap-6">
            <div className="min-w-0 flex-1">
              <div className="eyebrow flex items-center gap-1.5"><Fingerprint className="h-3 w-3" />Recorded fingerprint · SHA-256</div>
              <div className="mt-1 text-lg font-semibold">{a.id} <span className="font-normal text-muted-foreground">· {a.name}</span></div>
              <div className="mt-3 grid grid-cols-8 gap-1 font-mono text-[12px] text-signal sm:text-[13px]">
                {(rec?.hash ?? "".padEnd(64, "·")).match(/.{8}/g)!.map((c, i) => <span key={i} className="rounded-sm border border-signal/20 bg-signal/5 px-1 py-1 text-center tnum">{c}</span>)}
              </div>
              <div className="mt-2 font-mono text-[10px] text-muted-foreground">Recorded {rec?.at ?? "…"} · {canonical.length} bytes canonical JSON (sorted keys)</div>
            </div>
            <div className="w-full sm:w-64">
              <button onClick={verify} disabled={busy || !rec} className="flex w-full items-center justify-center gap-2 rounded-sm bg-signal px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />{busy ? "Recomputing…" : "Verify evidence"}
              </button>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-[11px] text-muted-foreground">
                <input type="checkbox" checked={tamper} onChange={(e) => { setTamper(e.target.checked); setResult(null); }} className="mt-0.5 accent-signal" />
                Simulate tampering (alter FRP in payload by −40%)
              </label>
            </div>
          </div>
          {result && (
            <div className={cn("mt-5 flex items-start gap-3 rounded-sm border p-4", result.ok ? "border-sev-low/50 bg-sev-low/[0.06]" : "border-sev-critical/50 bg-sev-critical/[0.06]")}>
              {result.ok ? <CheckCircle2 className="h-6 w-6 text-sev-low" /> : <XCircle className="h-6 w-6 text-sev-critical" />}
              <div className="min-w-0">
                <div className={cn("font-mono text-base font-bold tracking-widest", result.ok ? "text-sev-low" : "text-sev-critical")}>{result.ok ? "MATCH" : "MISMATCH"}</div>
                <div className="mt-1 break-all font-mono text-[10.5px] text-muted-foreground">recomputed {result.hash}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Verified {result.at} in this browser via Web Crypto. {result.ok ? "Payload is byte-identical to the recorded evidence." : "Payload differs from the recorded evidence — treat this alert as untrusted."}</div>
              </div>
            </div>
          )}
        </section>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="panel min-w-0">
            <PanelHeader title="Deterministic payload" meta={tamper ? "Modified — FRP altered" : "As recorded"} />
            <pre className="scroll-thin max-h-[420px] overflow-auto p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">{JSON.stringify(JSON.parse(canonical), null, 2)}</pre>
          </section>
          <section className="panel">
            <PanelHeader title="Integrity chain" />
            <ol className="space-y-3 p-4 text-[11.5px]">
              {[["1", "Evidence assembled", "FIRMS fields, weather, model output", true], ["2", "Canonicalised", "Keys sorted, JSON serialised", true], ["3", "SHA-256 computed", "Web Crypto · in-browser", true], ["4", "Recompute & compare", result ? (result.ok ? "MATCH" : "MISMATCH") : "Awaiting verification", !!result]].map(([n, t, s, done]) => (
                <li key={n as string} className="flex gap-3"><span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border font-mono text-[10px]", done ? "border-signal text-signal" : "text-muted-foreground")}>{n}</span><span><span className="block">{t}</span><span className="text-[10.5px] text-muted-foreground">{s}</span></span></li>
              ))}
              <li className="flex gap-3 opacity-70"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border text-muted-foreground"><Link2Off className="h-3 w-3" /></span><span><span className="block">Blockchain anchoring</span><span className="text-[10.5px] text-muted-foreground">Not connected. A local match is not proof of an on-chain record.</span></span></li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
