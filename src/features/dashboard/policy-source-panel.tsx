"use client";

import { ExternalLink, ShieldCheck } from "lucide-react";
import type { PolicySource } from "../../lib/policies/kr/2026";

type PolicySourcePanelProps = {
  title: string;
  verifiedAt: string;
  sources: readonly PolicySource[];
  notes: readonly string[];
};

export function PolicySourcePanel({ title, verifiedAt, sources, notes }: PolicySourcePanelProps) {
  return (
    <section aria-label={title} className="rounded-[22px] border border-[var(--wallet-line)] bg-white px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black text-[var(--wallet-primary-strong)]">공식 기준</p>
          <h3 className="mt-1 text-base font-black text-[var(--wallet-ink)]">{title}</h3>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--wallet-mint-soft)] px-3 py-2 text-xs font-black text-[#087a63]">
          <ShieldCheck aria-hidden="true" size={14} />
          {verifiedAt} 확인
        </span>
      </div>
      <ul className="mt-3 grid gap-2 text-xs font-bold text-[var(--wallet-muted)]">
        {notes.map((note) => (
          <li className="rounded-2xl bg-[var(--wallet-surface-tint)] px-3 py-2 leading-5" key={note}>{note}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        {sources.map((source) => (
          <a
            className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-2xl bg-[var(--wallet-primary-soft)] px-3 text-xs font-black text-[var(--wallet-primary-strong)] hover:bg-[#dfeafe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
            href={source.url}
            key={source.url}
            rel="noreferrer"
            target="_blank"
          >
            <span className="truncate">{source.title}</span>
            <ExternalLink aria-hidden="true" className="shrink-0" size={13} />
          </a>
        ))}
      </div>
    </section>
  );
}
