"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import { Toaster, toast } from "sonner";

const TOPICS = [
  "Demande concernant le site",
  "Intégration à la corpo",
  "Informations sur la corpo",
  "Diplomatie / Relations inter-corpo",
  "Partenariat / Médias",
];

export default function ContactForm() {
  const [form, setForm] = useState({
    player_pseudo: "",
    reply_email: "",
    topic: TOPICS[0],
    message: "",
    consent: false,
    // Honeypot (doit rester vide)
    nickname: "",
  });
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!form.player_pseudo.trim()) return "Le pseudo est requis.";
    if (!form.reply_email.trim()) return "L'adresse e-mail est requise.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.reply_email)) return "E-mail invalide.";
    if (!form.message.trim() || form.message.trim().length < 10)
      return "Message trop court (10 caractères min).";
    if (!form.consent) return "Vous devez consentir à la conservation de vos informations.";
    if (form.nickname.trim() !== "") return "Anti-spam déclenché.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(null);
    setErr(null);

    const v = validate();
    if (v) {
      setErr(v);
      toast.error(v);
      return;
    }

    setSending(true);
    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_CONTACT!;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;
      const autoId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_AUTOREPLY;
      const time = new Date().toLocaleString("fr-FR");

      const sendContact = emailjs.send(
        serviceId,
        templateId,
        {
          // Doivent matcher le template "Contact Us"
          name: form.player_pseudo, // {{name}}
          email: form.reply_email,  // {{email}}
          title: form.topic,        // {{title}}
          message: form.message,    // {{message}}
          time,                     // {{time}}
          // Optionnels si ajoutés dans le template
          consent: form.consent ? "yes" : "no",
          page_url: typeof window !== "undefined" ? window.location.href : "",
        },
        { publicKey }
      );

      const sendAuto =
        autoId
          ? emailjs.send(
              serviceId,
              autoId,
              {
                // Doivent matcher le template "Auto-Reply"
                name: form.player_pseudo || "Pilote",
                email: form.reply_email, // To Email = {{email}}
                title: form.topic,
                time,
              },
              { publicKey }
            )
          : Promise.resolve();

      // Belle notif centralisée
      await toast.promise(Promise.all([sendContact, sendAuto]), {
        loading: "Envoi en cours…",
        success:
          autoId
            ? "Message envoyé. Un accusé de réception vous a été envoyé."
            : "Message envoyé. Merci pour votre prise de contact !",
        error: "Échec d’envoi. Réessaie dans quelques minutes.",
      });

      setOk("Message envoyé.");
      setForm({
        player_pseudo: "",
        reply_email: "",
        topic: TOPICS[0],
        message: "",
        consent: false,
        nickname: "",
      });
    } catch (e: any) {
      const msg = "Échec d’envoi. Réessaie dans quelques minutes.";
      setErr(msg);
      toast.error(msg);
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="container flex flex-col md:flex-row mx-auto px-4 py-8 gap-4">
      {/* Toaster local à la page (tu peux le déplacer dans app/layout si tu veux global) */}
      <Toaster position="top-center" richColors closeButton />

      <form onSubmit={handleSubmit} className="bg-black/30 rounded-xl max-w-xl mx-auto space-y-4">
        {/* On garde ok/err pour éventuel fallback debug, mais les toasts sont la source principale */}
        {ok && <p className="sr-only">{ok}</p>}
        {err && <p className="sr-only">{err}</p>}

        {/* Honeypot */}
        <input
          type="text"
          name="nickname"
          value={form.nickname}
          onChange={onChange}
          className="hidden"
          autoComplete="off"
          tabIndex={-1}
        />

        <div>
          <label className="block text-sm mb-1">Pseudo du joueur</label>
          <input
            name="player_pseudo"
            value={form.player_pseudo}
            onChange={onChange}
            required
            className="w-full rounded border px-3 py-2 bg-transparent"
            placeholder="Pseudo IG ou Discord"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Adresse e-mail</label>
          <input
            type="email"
            name="reply_email"
            value={form.reply_email}
            onChange={onChange}
            required
            className="w-full rounded border px-3 py-2 bg-transparent"
            placeholder="ex: pilote@nms.org"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Sujet</label>
          <select
            name="topic"
            value={form.topic}
            onChange={onChange}
            className="w-full rounded border px-3 py-2 bg-neutral-800 text-white"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t} className="bg-neutral-900 text-white">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Message</label>
          <textarea
            name="message"
            value={form.message}
            onChange={onChange}
            required
            minLength={10}
            rows={6}
            className="w-full rounded border px-3 py-2 bg-transparent"
            placeholder="Explique ta demande…"
          />
          <p className="text-xs opacity-70 mt-1">Min. 10 caractères</p>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            name="consent"
            checked={form.consent}
            onChange={onChange}
            className="mt-1"
            required
          />
          <p className="text-sm">
            J’autorise le NEMESIS Consortium à conserver ces informations pour traiter ma demande.
          </p>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="rounded-2xl px-4 py-2 border hover:opacity-90 disabled:opacity-60"
        >
          {sending ? "Envoi…" : "Envoyer"}
        </button>

        <p className="text-xs opacity-70">
          Conformément au RGPD, vous pouvez demander la suppression de vos données à tout moment.
        </p>
      </form>
      <div className="bg-black/30 flex flex-col justify-center items-center rounded-xl w-full md:w-1/2 max-w-xl mx-auto space-y-4">
        <h2 className="text-center text-2xl mt-6">Nemesis Consortium</h2>
        <p className="text-sm text-center">
          Aera  18, Immeuble Gold Star. 555, business Road
        </p>
        <p className="text-lg text-center">
          Planete Arccorp
        </p>
        <p className="text-lg text-center">
          Systeme Stanton
        </p>
      </div>
    </section>
  );
}
