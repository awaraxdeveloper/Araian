import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  ShieldCheck,
  Building2,
  KeyRound,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Fallback companies guaranteed to show instantly
const FALLBACK_COMPANIES = [
  { id: "1", name: "Araian Honda Centre" },
  { id: "2", name: "Awais Autos" },
];

export default function LoginPage({ onLoginSuccess }) {
  const [companies, setCompanies] = useState(FALLBACK_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    FALLBACK_COMPANIES[0].id
  );
  const [selectedCompanyName, setSelectedCompanyName] = useState(
    FALLBACK_COMPANIES[0].name
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .order("name");
        if (!error && data && data.length > 0) {
          setCompanies(data);
          setSelectedCompanyId(data[0].id);
          setSelectedCompanyName(data[0].name);
        }
      } catch (err) {
        console.warn("Using fallback company list:", err);
      }
    }
    fetchCompanies();
  }, []);

  const handleSelectCompany = (comp) => {
    setSelectedCompanyId(comp.id);
    setSelectedCompanyName(comp.name);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Fetch user by username
      const { data: user, error: userErr } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("username", username.trim())
        .single();

      if (userErr || !user) {
        setError("User account not found.");
        setLoading(false);
        return;
      }

      // 2. Validate password
      if (user.password_hash !== password) {
        setError("Incorrect password.");
        setLoading(false);
        return;
      }

      // 3. Verify company alignment
      if (
        user.company_id &&
        user.company_id !== selectedCompanyId &&
        selectedCompanyId !== "1" &&
        selectedCompanyId !== "2"
      ) {
        setError(`This user belongs to a different company.`);
        setLoading(false);
        return;
      }

      onLoginSuccess({
        user: user,
        companyId: user.company_id || selectedCompanyId,
        companyName: selectedCompanyName,
        isAdmin: user.is_admin,
      });
    } catch (err) {
      setError("Database connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-red-600/10 border border-red-500/20 rounded-2xl text-red-500">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black tracking-wider text-white uppercase">
            Enterprise Portal
          </h1>
          <p className="text-xs text-neutral-400">
            Select target company and sign in
          </p>
        </div>

        {/* Company Toggle Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-red-500" />
            <span>Select Company</span>
          </label>

          <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
            {companies.map((comp) => {
              const active =
                selectedCompanyId === comp.id ||
                selectedCompanyName === comp.name;
              return (
                <button
                  key={comp.id || comp.name}
                  type="button"
                  onClick={() => handleSelectCompany(comp)}
                  className={`py-3 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border ${
                    active
                      ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/50"
                      : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900"
                  }`}
                >
                  {active && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{comp.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LoginForm */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl flex items-center space-x-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all duration-200 text-xs tracking-wider uppercase shadow-lg shadow-red-950/50 disabled:opacity-50 mt-2"
          >
            {loading
              ? "Authenticating..."
              : `Sign In to ${selectedCompanyName}`}
          </button>
        </form>
      </div>
    </div>
  );
}
