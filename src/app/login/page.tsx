"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function PinDots({ length }: { length: number }) {
  return (
    <div className="flex gap-4 justify-center">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-full transition-colors duration-150"
          style={{ background: i < length ? "#0F4F3C" : "#DCE5E1" }}
        />
      ))}
    </div>
  );
}

function NumPad({ onDigit, onDelete }: { onDigit: (d: string) => void; onDelete: () => void }) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
      {keys.map((k, i) => {
        if (k === "") return <div key={i} />;
        const isDelete = k === "⌫";
        return (
          <button
            key={k}
            onPointerDown={(e) => {
              e.preventDefault();
              isDelete ? onDelete() : onDigit(k);
            }}
            className="h-16 rounded-2xl text-xl font-semibold transition-colors select-none"
            style={{
              background: isDelete ? "transparent" : "#F0F5F3",
              color: isDelete ? "#6B7A74" : "#0E1512",
              border: isDelete ? "none" : "1px solid #DCE5E1",
            }}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<string[]>([]);
  const [step, setStep] = useState<"pick" | "pin">("pick");
  const [selectedUser, setSelectedUser] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  function pickUser(name: string) {
    setSelectedUser(name);
    setPin("");
    setError("");
    setStep("pin");
  }

  function addDigit(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError("");
    if (next.length === 4) submitPin(next);
  }

  function deleteDigit() {
    setPin((p) => p.slice(0, -1));
    setError("");
  }

  async function submitPin(p: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedUser, pin: p }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Forkert PIN, prøv igen");
        setPin("");
      }
    } catch {
      setError("Noget gik galt");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAF9] flex flex-col items-center justify-center px-6" style={{ paddingTop: "env(safe-area-inset-top)" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#0F4F3C", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 120 120" fill="none">
            <path d="M22 54 60 20l38 34v44a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V54Z" stroke="#52E3A0" strokeWidth="11" strokeLinejoin="round" />
            <text x="60" y="91" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="56" fill="white">B</text>
          </svg>
        </div>
        <span className="text-[#0E1512] font-semibold text-xl tracking-tight">Boligagent</span>
      </div>

      {step === "pick" && (
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <p className="text-[#6B7A74] text-base">Hvem er du?</p>
          <div className="flex flex-col gap-3 w-full">
            {users.length === 0 ? (
              <div className="h-16 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#DCE5E1] border-t-[#0F4F3C] rounded-full animate-spin" />
              </div>
            ) : (
              users.map((name) => (
                <button
                  key={name}
                  onClick={() => pickUser(name)}
                  className="w-full h-16 rounded-2xl text-lg font-semibold transition-colors"
                  style={{ background: "#0F4F3C", color: "white" }}
                >
                  {name}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {step === "pin" && (
        <div className="flex flex-col items-center gap-8 w-full max-w-xs">
          <div className="text-center">
            <p className="text-[#0E1512] font-semibold text-lg">{selectedUser}</p>
            <p className="text-[#6B7A74] text-sm mt-1">Indtast din PIN</p>
          </div>

          <PinDots length={pin.length} />

          {error && (
            <p className="text-sm font-medium" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}

          {loading ? (
            <div className="h-16 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#DCE5E1] border-t-[#0F4F3C] rounded-full animate-spin" />
            </div>
          ) : (
            <NumPad onDigit={addDigit} onDelete={deleteDigit} />
          )}

          <button
            onClick={() => setStep("pick")}
            className="text-sm text-[#9AA7A1] hover:text-[#6B7A74] transition-colors"
          >
            ← Skift bruger
          </button>
        </div>
      )}
    </div>
  );
}
