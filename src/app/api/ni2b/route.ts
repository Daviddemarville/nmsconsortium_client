// src/app/api/ni2b/route.ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

type Ni2bMeta = {
  title?: string;
  description_md?: string;
  signature?: string;
  balance_auec?: number | null;
  updated_at?: string | null;
  portrait_url?: string;
  vault_image_url?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dataUrl = url.searchParams.get("dataUrl") || "/data/ni2b_meta.json";
  const allowDebug = process.env.NODE_ENV !== "production";
  const debug = allowDebug && url.searchParams.get("debug") === "1";

  // ENV (prioritaires)
  const SHEET_ID = process.env.NI2B_SHEET_ID;
  const GID = process.env.NI2B_SHEET_GID;
  const BAL_RANGE = process.env.NI2B_BALANCE_RANGE;
  const UPD_RANGE = process.env.NI2B_UPDATED_RANGE;

  try {
    // 1) Métadonnées locales (titre, texte, visuels…)
    const filePath = path.join(
      process.cwd(),
      "public",
      dataUrl.replace(/^\/+/, ""),
    );
    const raw = await readFile(filePath, "utf-8");
    const meta = JSON.parse(raw) as Ni2bMeta;

    // 2) Valeurs dynamiques (balance/date) via Google Sheet
    let balance = meta.balance_auec ?? null;
    let updatedISO = meta.updated_at ?? null;

    const dbg: Record<string, unknown> = {};
    let usedSheet = false;

    if (SHEET_ID && GID && BAL_RANGE && UPD_RANGE) {
      try {
        const bal = await fetchGvizSingleCell({
          id: SHEET_ID,
          gid: GID,
          cell: BAL_RANGE,
          debug,
        });
        const upd = await fetchGvizSingleCell({
          id: SHEET_ID,
          gid: GID,
          cell: UPD_RANGE,
          debug,
        });

        if (debug) {
          dbg.balance_fetch = bal.debug;
          dbg.updated_fetch = upd.debug;
        }

        const balNum = parseNumberLoose(bal.value);
        if (typeof balNum === "number" && Number.isFinite(balNum)) {
          balance = balNum;
          usedSheet = true;
        }
        const updISO = toISODateLoose(upd.value);
        if (updISO) {
          updatedISO = updISO;
          usedSheet = true;
        }
      } catch (e) {
        if (debug) dbg.sheet_error = (e as Error).message ?? String(e);
        // fallback JSON conservé
      }
    }

    const merged = {
      ...meta,
      balance_auec: balance ?? 0,
      updated_at: updatedISO ?? meta.updated_at ?? "",
      source: usedSheet
        ? meta.balance_auec != null || meta.updated_at
          ? "mixed"
          : "sheet"
        : "fallback",
      ...(debug ? { __debug: dbg } : {}),
    };

    return NextResponse.json(merged, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "NI2B fetch error" },
      { status: 500 },
    );
  }
}

/* ================= Helpers ================= */

async function fetchGvizSingleCell(opts: {
  id: string;
  cell: string;
  gid?: string | number;
  debug?: boolean;
}): Promise<{ value: string; debug?: Record<string, unknown> }> {
  const { id, cell, gid, debug } = opts;
  const base = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq?tqx=out:json`;
  const qp = `${base}&gid=${encodeURIComponent(String(gid ?? ""))}&range=${encodeURIComponent(cell)}`;

  const resp = await fetch(qp, { cache: "no-store" });
  if (!resp.ok) throw new Error(`Sheet HTTP ${resp.status}`);
  const text = await resp.text();

  const start = text.indexOf("setResponse(");
  if (start === -1) throw new Error("gviz wrapper not found");
  const open = start + "setResponse(".length;
  const end = text.lastIndexOf(")");
  if (end === -1 || end <= open) throw new Error("gviz wrapper malformed");
  const jsonText = text.slice(open, end);

  const data = JSON.parse(jsonText) as {
    table?: { rows?: Array<{ c: Array<{ v?: unknown; f?: unknown } | null> }> };
  };

  const cellObj = data?.table?.rows?.[0]?.c?.[0];
  if (!cellObj) throw new Error("Empty cell");
  const v = cellObj.v ?? cellObj.f;
  if (v == null) throw new Error("Null cell");

  return {
    value: String(v),
    ...(debug
      ? {
          debug: {
            url: qp,
            rawType: typeof v,
            rawValue: v,
            snippet: text.slice(0, 160) + (text.length > 160 ? "…" : ""),
          },
        }
      : {}),
  };
}

function parseNumberLoose(val: string): number | null {
  const s = val.replace(/\s/g, "").replace(/\u202f/g, "");
  const looksNum =
    /^[-+]?\d{1,3}([.,]?\d{3})*([.,]\d+)?$/.test(s) ||
    /^[-+]?\d+([.,]\d+)?$/.test(s) ||
    /^[\d.]+e[-+]?\d+$/i.test(s);
  const normalized = looksNum
    ? s
        .replace(/\.(?=\d{3}\b)/g, "")
        .replace(/,(?=\d{3}\b)/g, "")
        .replace(",", ".")
    : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function toISODateLoose(val: string): string | null {
  const m1 = val.match(
    /^Date\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+),\s*(\d+),\s*(\d+))?\)$/,
  );
  if (m1) {
    const [, y, m, d, hh = "0", mi = "0", ss = "0"] = m1;
    const js = new Date(Date.UTC(+y, +m, +d, +hh, +mi, +ss)); // gviz: mois 0-based
    return js.toISOString();
  }
  if (/^\d+(\.\d+)?$/.test(val)) {
    const serial = Number(val);
    if (Number.isFinite(serial)) {
      const base = Date.UTC(1899, 11, 30);
      const ms = Math.round(serial * 86400000);
      return new Date(base + ms).toISOString();
    }
  }
  const d1 = new Date(val);
  if (!Number.isNaN(d1.getTime())) return d1.toISOString();
  const m2 = val.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[ T](\d{1,2}):(\d{2}))?$/,
  );
  if (m2) {
    const [, dd, mm, yyyy, hh = "00", mi = "00"] = m2;
    const y = Number(yyyy.length === 2 ? `20${yyyy}` : yyyy);
    const js = new Date(
      Date.UTC(y, Number(mm) - 1, Number(dd), Number(hh), Number(mi)),
    );
    return js.toISOString();
  }
  return null;
}
