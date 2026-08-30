"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown } from "@/components/session/icons";
import type { ModelOption } from "@/app/api/models/route";
import {
  DEFAULT_MODEL,
  modelServerSnapshot,
  modelSnapshot,
  setSavedModel,
  subscribeModel,
} from "@/lib/model-prefs";

/**
 * Picks the OpenRouter model every conversation and assessment runs on, from
 * the catalog `/api/models` proxies (the key is server-only, so the browser
 * can't ask OpenRouter itself). The choice is persisted on-device by
 * model-prefs.ts and read at send time by VoiceChat and useSession.
 *
 * Deliberately not a native <select>: the catalog is hundreds of models, so it
 * needs a search box. Filtering is a case-insensitive substring match on id and
 * name — no fuzzy-match dependency, matching how small the dependency list is
 * kept.
 *
 * Every failure degrades to "the default model, unfiltered": the catalog is
 * fetched lazily on first open, and if that fails the picker still renders the
 * stored selection and stays usable — nothing here can block the page.
 */
export default function ModelPicker() {
  const selected = useSyncExternalStore(subscribeModel, modelSnapshot, modelServerSnapshot);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [models, setModels] = useState<ModelOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Fetched from the open handler, not an effect: opening is the event that
  // needs the catalog, and the home page shouldn't pay for a round trip nobody
  // asked for. Once loaded (or failed) it isn't fetched again.
  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/models");
      if (!res.ok) throw new Error(`/api/models failed (${res.status})`);
      const data = await res.json();
      setModels(Array.isArray(data.models) ? (data.models as ModelOption[]) : []);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const openPanel = () => {
    setOpen(true);
    if (models === null && !loading) void loadModels();
  };

  // Esc closes wherever focus is; a click outside closes too.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const select = (id: string) => {
    setSavedModel(id);
    close();
  };

  const q = query.trim().toLowerCase();
  const matches = (models ?? []).filter(
    (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
  );

  // Until (or unless) the catalog loads, the raw id is the label.
  const label = models?.find((m) => m.id === selected)?.name ?? selected;

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => (open ? close() : openPanel())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Model: ${label}`}
        className="inline-flex max-w-full items-center gap-2 rounded-full border border-edge bg-chip px-4 py-1.5 font-sans text-[12px] font-medium text-ink-muted transition hover:border-cognac/40 hover:text-cognac-text focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
      >
        <span className="uppercase tracking-[0.18em] text-faint">Model</span>
        <span className="truncate text-ink-soft">{label}</span>
        <ChevronDown size={12} className="text-faint" />
      </button>

      {open && (
        <div
          className="absolute left-1/2 z-50 mt-2 w-[min(22rem,80vw)] -translate-x-1/2 overflow-hidden rounded-[10px] border border-edge bg-frame text-left"
          style={{ boxShadow: "0 24px 60px rgba(60,40,20,.22)" }}
        >
          <div className="border-b border-section bg-raised p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models…"
              aria-label="Search models"
              className="w-full rounded-[7px] border border-edge bg-chip px-3 py-1.5 font-sans text-[13px] text-ink-soft placeholder:text-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
            />
          </div>

          <div role="listbox" aria-label="Models" className="max-h-72 overflow-y-auto py-1">
            {loading && (
              <div className="px-3 py-3 font-sans text-[12px] text-faint">Loading models…</div>
            )}

            {!loading && failed && (
              <div className="px-3 py-3 font-sans text-[12px] text-faint">
                Could not load the model list. Staying on{" "}
                <span className="text-ink-soft">{selected}</span>.
              </div>
            )}

            {!loading && !failed && matches.length === 0 && (
              <div className="px-3 py-3 font-sans text-[12px] text-faint">
                {models?.length ? `No models match “${query.trim()}”.` : "No models available."}
              </div>
            )}

            {matches.map((m) => {
              const isSelected = m.id === selected;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => select(m.id)}
                  className={`block w-full px-3 py-2 text-left transition hover:bg-chip focus:outline-none focus-visible:bg-chip ${
                    isSelected ? "bg-chip" : ""
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="truncate font-sans text-[13px] text-ink-soft">{m.name}</span>
                    {m.id === DEFAULT_MODEL && (
                      <span className="shrink-0 font-sans text-[10px] uppercase tracking-[0.18em] text-faint">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="truncate font-sans text-[11px] text-faint">{m.id}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
