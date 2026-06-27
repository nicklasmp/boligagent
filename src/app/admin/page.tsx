"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  name: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminPage() {
  const [adminPin, setAdminPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const [resetId, setResetId] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  const fetchUsers = useCallback(async (pin: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/users", { headers: { "x-admin-pin": pin } });
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  }, []);

  async function authenticate() {
    const res = await fetch("/api/admin/users", { headers: { "x-admin-pin": adminPin } });
    if (res.ok) {
      setAuthed(true);
      setAuthError("");
      setUsers(await res.json());
    } else {
      setAuthError("Forkert admin-PIN");
    }
  }

  async function createUser() {
    setCreating(true);
    setCreateMsg("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-pin": adminPin },
      body: JSON.stringify({ name: newName, pin: newPin }),
    });
    const data = await res.json();
    if (res.ok) {
      setCreateMsg("Bruger oprettet");
      setNewName("");
      setNewPin("");
      fetchUsers(adminPin);
    } else {
      setCreateMsg(data.error ?? "Fejl");
    }
    setCreating(false);
  }

  async function resetPinForUser() {
    setResetting(true);
    setResetMsg("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-pin": adminPin },
      body: JSON.stringify({ id: resetId, pin: resetPin }),
    });
    const data = await res.json();
    if (res.ok) {
      setResetMsg("PIN nulstillet");
      setResetPin("");
    } else {
      setResetMsg(data.error ?? "Fejl");
    }
    setResetting(false);
  }

  const inputStyle = {
    background: "#F0F5F3",
    border: "1px solid #DCE5E1",
    borderRadius: 12,
    padding: "10px 14px",
    color: "#0E1512",
    fontSize: 15,
    width: "100%",
    outline: "none",
  } as const;

  const btnPrimary = {
    background: "#0F4F3C",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
  } as const;

  const card = {
    background: "white",
    border: "1px solid #DCE5E1",
    borderRadius: 16,
    padding: "20px",
    marginBottom: 16,
  } as const;

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#F7FAF9] flex flex-col items-center justify-center px-6">
        <div style={{ ...card, width: "100%", maxWidth: 320 }}>
          <h1 className="text-[#0E1512] font-semibold text-lg mb-4">Admin</h1>
          <div className="flex flex-col gap-3">
            <input
              type="password"
              inputMode="numeric"
              placeholder="Admin-PIN"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && authenticate()}
              style={inputStyle}
            />
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <button onClick={authenticate} style={btnPrimary}>
              Log ind
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAF9] px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-[#0E1512] font-semibold text-xl mb-6">Admin</h1>

      {/* User list */}
      <div style={card}>
        <h2 className="text-[#0E1512] font-semibold mb-3">Brugere</h2>
        {loading ? (
          <p className="text-[#9AA7A1] text-sm">Henter...</p>
        ) : users.length === 0 ? (
          <p className="text-[#9AA7A1] text-sm">Ingen brugere endnu</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2 border-b border-[#F0F5F3] last:border-0">
                <div>
                  <span className="text-[#0E1512] font-medium">{u.name}</span>
                  <span className="text-[#9AA7A1] text-xs ml-2">{formatDate(u.created_at)}</span>
                </div>
                <button
                  onClick={() => setResetId(u.id)}
                  className="text-xs text-[#6B7A74] hover:text-[#0F4F3C] transition-colors"
                >
                  Nulstil PIN
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create user */}
      <div style={card}>
        <h2 className="text-[#0E1512] font-semibold mb-3">Opret bruger</h2>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Navn (fx Mor)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            inputMode="numeric"
            placeholder="PIN (4 cifre)"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
            style={inputStyle}
          />
          {createMsg && (
            <p className={`text-sm ${createMsg === "Bruger oprettet" ? "text-green-700" : "text-red-600"}`}>
              {createMsg}
            </p>
          )}
          <button onClick={createUser} disabled={creating || !newName || newPin.length !== 4} style={{ ...btnPrimary, opacity: (!newName || newPin.length !== 4) ? 0.5 : 1 }}>
            {creating ? "Opretter..." : "Opret bruger"}
          </button>
        </div>
      </div>

      {/* Reset PIN */}
      {resetId && (
        <div style={card}>
          <h2 className="text-[#0E1512] font-semibold mb-1">Nulstil PIN</h2>
          <p className="text-[#6B7A74] text-sm mb-3">
            {users.find((u) => u.id === resetId)?.name}
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              inputMode="numeric"
              placeholder="Ny PIN (4 cifre)"
              maxLength={4}
              value={resetPin}
              onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={resetPinForUser}
              disabled={resetting || resetPin.length !== 4}
              style={{ ...btnPrimary, opacity: resetPin.length !== 4 ? 0.5 : 1 }}
            >
              {resetting ? "..." : "Gem"}
            </button>
          </div>
          {resetMsg && (
            <p className={`text-sm mt-2 ${resetMsg === "PIN nulstillet" ? "text-green-700" : "text-red-600"}`}>
              {resetMsg}
            </p>
          )}
          <button
            onClick={() => { setResetId(""); setResetPin(""); setResetMsg(""); }}
            className="text-xs text-[#9AA7A1] mt-3 hover:text-[#6B7A74] transition-colors"
          >
            Annuller
          </button>
        </div>
      )}
    </div>
  );
}
