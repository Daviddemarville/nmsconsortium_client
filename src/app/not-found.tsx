"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#030b15] text-white">
      <div className="w-[500px] border border-[#0d1b2a] bg-[#0a0f1a] p-6 shadow-xl">
        <div className="border-b border-[#1c2a3a] pb-3 mb-3 text-sm font-mono">
          ERROR - Disconnection (CODE 30000)
        </div>

        <div className="space-y-2 text-sm font-sans">
          <p className="text-[#d1d5db]">Connection Lost:</p>
          <p className="text-[#9ca3af]">
            Connection to the server was lost unexpectedly.
          </p>
          <p className="text-[#9ca3af]">
            If the problem persists please check the internet connection.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-6 py-1.5 border border-[#2563eb] text-[#60a5fa] hover:bg-[#1e3a8a] hover:text-white transition font-semibold"
          >
            OK
          </button>
        </div>
      </div>
      {/* Clin d’œil humoristique */}
      <p className="mt-16 text-center text-sm text-gray-400 italic">
        Non, on déconne 😉 c’est juste une erreur 404.
        <br />
        La page que tu cherches n’existe pas (ou plus)!
      </p>
    </main>
  );
}
