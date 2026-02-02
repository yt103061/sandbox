"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

interface Client {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = () => {
    setIsLoading(true);
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => setClients(data.clients ?? []))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreate = () => {
    if (!name) return;
    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, company }),
    }).then(() => {
      setName("");
      setEmail("");
      setCompany("");
      fetchClients();
    });
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">クライアント</h1>
        <p className="mt-2 text-sm text-slate-500">
          クライアント情報を一元管理します。
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">新規追加</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="名前"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="メール"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="会社名"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>
        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
          onClick={handleCreate}
          type="button"
        >
          追加
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">一覧</h2>
        {isLoading ? (
          <div className="mt-4">
            <LoadingSpinner />
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 text-sm text-slate-600">
            {clients.map((client) => (
              <li key={client.id} className="rounded-lg border border-slate-100 p-3">
                <p className="font-semibold text-slate-900">{client.name}</p>
                <p>{client.company ?? "-"}</p>
                <p>{client.email ?? "-"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
