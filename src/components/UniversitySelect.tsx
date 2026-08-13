"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filterUniversities } from "@/lib/nigerian-universities";

export function UniversitySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = useMemo(() => filterUniversities(query), [query]);
  const exact = matches.some((name) => name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={rootRef} className="relative text-left">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search Nigerian universities"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        className="w-full cursor-text rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-sky/30 focus:border-sky focus:ring-2"
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-line bg-white py-1 text-left shadow-md"
        >
          {!query.trim() && matches.length > 0 ? (
            <li className="px-4 py-1.5 text-xs text-muted">
              {matches.length} NUC-recognised universities — type to filter
            </li>
          ) : null}
          {matches.map((name) => (
            <li key={name}>
              <button
                type="button"
                role="option"
                aria-selected={value === name}
                className={`w-full cursor-pointer px-4 py-2.5 text-left text-sm hover:bg-sky-soft ${
                  value === name ? "bg-sky-soft font-medium text-navy" : "text-ink"
                }`}
                onClick={() => {
                  onChange(name);
                  setQuery(name);
                  setOpen(false);
                }}
              >
                {name}
              </button>
            </li>
          ))}
          {query.trim() && !exact ? (
            <li>
              <button
                type="button"
                className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-muted hover:bg-sky-soft"
                onClick={() => {
                  onChange(query.trim());
                  setOpen(false);
                }}
              >
                Use “{query.trim()}”
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
