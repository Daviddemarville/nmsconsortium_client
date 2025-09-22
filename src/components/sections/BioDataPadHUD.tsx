// src/components/layout/BioDataPadHUD.tsx
"use client";

import { useCallback } from "react";

type LoreEntry = {
  title: string;
  intro?: string;
  body: string;
  quote?: string;
};
type Meta = {
  appLabel?: string;
  version?: string;
  date?: string;
  from?: string;
  to?: string;
  subject?: string;
};

export default function BioDataPadHUD({
  data,
  meta = { appLabel: "DATAPAD", version: "v1.3" },
  width = 460,
  height = 700,
  tilt = true,
  sounds = true,
}: {
  data: LoreEntry;
  meta?: Meta;
  /** largeur/hauteur (px) du “device” */
  width?: number;
  height?: number;
  /** léger tilt 3D au hover */
  tilt?: boolean;
  /** sons UI (hover/click). Mettre à false pour couper le son. */
  sounds?: boolean;
}) {
  const size = { width: `${width}px`, height: `${height}px` };

  // --- Son (WebAudio) : safe (browser-only) & optionnel ---
  const playTone = useCallback(
    (freq = 880, dur = 0.05, gain = 0.06) => {
      if (!sounds) return;
      if (typeof window === "undefined") return;
      const W = globalThis as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctx = W.AudioContext ?? W.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      g.gain.value = gain;
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    },
    [sounds],
  );

  const onHoverBtn = useCallback(() => playTone(1200, 0.035, 0.05), [playTone]); // tick
  const onDownBtn = useCallback(() => playTone(320, 0.06, 0.07), [playTone]); // clack

  // Bouton latéral réutilisable (handlers attachés seulement si sounds=true)
  const SideBtn = ({ className = "" }: { className?: string }) => {
    const base =
      "absolute -right-2 w-2 rounded-r-md bg-gradient-to-b from-[#24303a] to-[#0f171d] " +
      "shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.6),0_0_10px_rgba(0,255,255,0.10)] " +
      "border-l border-[#162129] transition-all duration-150 " +
      "hover:from-[#2b3a46] hover:to-[#121b22] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-2px_5px_rgba(0,0,0,0.7),0_0_14px_rgba(34,211,238,0.18)] " +
      "active:translate-x-[1px] active:brightness-90";

    // si sounds=false on ne passe pas de handlers (évite toute erreur de sérialisation)
    return sounds ? (
      <div
        onMouseEnter={onHoverBtn}
        onMouseDown={onDownBtn}
        className={`${base} ${className}`}
        aria-hidden
      />
    ) : (
      <div className={`${base} ${className}`} aria-hidden />
    );
  };

  return (
    <div
      className={[
        "relative select-none",
        "rounded-[34px] bg-[#06090c]",
        "shadow-[0_28px_90px_rgba(0,255,255,0.10),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-2px_8px_rgba(0,0,0,0.7)]",
        "ring-1 ring-[#0e1a20]/40",
        tilt
          ? "rotate-[0.35deg] hover:rotate-[0.2deg] transition-transform duration-300"
          : "",
      ].join(" ")}
      style={size}
    >
      {/* Boutons latéraux (2 petits + 1 long) */}
      <SideBtn className="top-24 h-12" />
      <SideBtn className="top-36 h-12" />
      <SideBtn className="top-52 h-16" />

      {/* Caméra frontale */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-1.5 h-5 w-5 rounded-full bg-[#0b1116] shadow-[inset_0_0_6px_rgba(255,255,255,0.08),0_0_6px_rgba(0,255,255,0.25)]"
        aria-hidden
      >
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#07252a] to-[#0b1f27]" />
        <div className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-white/70" />
      </div>

      {/* Écran */}
      <div
        className={[
          "absolute inset-[14px] rounded-[26px]",
          "bg-gradient-to-b from-[#0b1217] to-black",
          "border-2 border-cyan-400/70",
          "shadow-[0_0_38px_rgba(34,211,238,0.5),inset_0_0_50px_rgba(0,0,0,0.75)]",
          "overflow-hidden",
        ].join(" ")}
      >
        {/* Header */}
        <div className="px-5 py-2 border-b border-cyan-400/55 flex items-center justify-between">
          <span className="font-mono text-cyan-300 tracking-widest">
            {meta.appLabel ?? "DATAPAD"}
          </span>
          <span className="font-mono text-[10px] text-cyan-500">
            {meta.version ?? "v1.3"}
          </span>
        </div>

        {/* Barre infos compacte */}
        {(meta.date || meta.from || meta.to || meta.subject) && (
          <div className="px-5 py-1.5 font-mono text-[11px] text-cyan-300/90 tracking-wide">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {meta.date && (
                <span>
                  <b className="text-cyan-400">DATE:</b> {meta.date}
                </span>
              )}
              {meta.subject && (
                <span className="truncate max-w-[55%]">
                  <b className="text-cyan-400">SUBJECT:</b> {meta.subject}
                </span>
              )}
              {meta.from && (
                <span className="truncate">
                  <b className="text-cyan-400">FROM:</b> {meta.from}
                </span>
              )}
              {meta.to && (
                <span className="truncate">
                  <b className="text-cyan-400">TO:</b> {meta.to}
                </span>
              )}
            </div>
            <div className="mt-2 h-px bg-cyan-400/25" />
          </div>
        )}

        {/* Rails (sans blur) */}
        <div
          className="absolute left-[18px] top-[68px] bottom-[60px] w-px bg-cyan-400/35"
          aria-hidden
        />
        <div
          className="absolute right-[18px] top-[68px] bottom-[60px] w-px bg-cyan-400/35"
          aria-hidden
        />

        {/* Contenu */}
        <div
          className={[
            "px-6 pb-4 font-mono leading-relaxed text-gray-200",
            "h-[calc(100%-112px)]",
            "overflow-y-auto datapad-scroll",
            "whitespace-pre-line break-words hyphens-auto",
            "[-webkit-mask-image:linear-gradient(180deg,transparent_0,black_18px,black_calc(100%-18px),transparent_100%)]",
            "[mask-image:linear-gradient(180deg,transparent_0,black_18px,black_calc(100%-18px),transparent_100%)]",
          ].join(" ")}
        >
          <h3 className="text-cyan-300 text-lg mb-3">{data.title}</h3>
          {data.intro && <p className="mb-3 text-gray-300/90">{data.intro}</p>}
          <p>{data.body}</p>
          {data.quote && (
            <div className="mt-4 border-l-4 border-cyan-400/70 pl-3 italic text-cyan-200">
              {data.quote}
            </div>
          )}
        </div>

        {/* Footer (pas de backdrop-blur) */}
        <div className="absolute left-0 right-0 bottom-0 px-5 py-2 border-t border-cyan-400/55 text-cyan-400 text-xs font-mono flex items-center justify-around bg-black/30">
          <span className="hover:text-cyan-300 cursor-pointer">⟵ BACK</span>
          <span className="hover:text-cyan-300 cursor-pointer">ⓘ INFO</span>
          <span className="hover:text-cyan-300 cursor-pointer">✉ CONTACT</span>
        </div>
      </div>

      {/* Vis */}
      {[
        "left-3 top-4",
        "right-3 top-4",
        "left-3 bottom-4",
        "right-3 bottom-4",
      ].map((pos) => (
        <span
          key={pos}
          className={`absolute ${pos} h-3.5 w-3.5 rounded-full bg-[#0e1419] shadow-[inset_0_0_3px_rgba(255,255,255,0.35)]`}
          aria-hidden
        />
      ))}
    </div>
  );
}
