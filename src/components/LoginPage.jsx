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

export default function LoginPage({ onLoginSuccess }) {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Fetch companies on mount
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .order("name");
        if (error) throw error;
        if (data && data.length > 0) {
          setCompanies(data);
          setSelectedCompany(data[0]);
        } else {
          // No companies found – show error
          setFetchError(true);
          setError("No companies found. Please contact support.");
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
        setFetchError(true);
        setError("Could not load company list. Please refresh.");
      }
    }
    fetchCompanies();
  }, []);

  const handleSelectCompany = (comp) => {
    setSelectedCompany(comp);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Ensure a company is selected
    if (!selectedCompany) {
      setError("Please select a company first.");
      setLoading(false);
      return;
    }

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

      // 3. (Optional) Restrict non‑admin users to their own company
      if (
        !user.is_admin &&
        user.company_id &&
        user.company_id !== selectedCompany.id
      ) {
        setError(`You are not authorised to manage ${selectedCompany.name}.`);
        setLoading(false);
        return;
      }

      // 4. Pass the **real UUID** from the selected company
      onLoginSuccess({
        user: user,
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        isAdmin: user.is_admin,
      });
    } catch (err) {
      setError("Database connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If fetch failed, show a retry button
  if (fetchError) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-sm text-neutral-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl text-xs transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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

        {/* Company Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-red-500" />
            <span>Select Company</span>
          </label>

          {companies.length === 0 ? (
            <div className="text-center py-4 text-neutral-500 text-xs">
              Loading companies...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
              {companies.map((comp) => {
                const active = selectedCompany?.id === comp.id;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => handleSelectCompany(comp)}
                    className={`py-3 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border ${
                      active
                        ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/50"
                        : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900"
                    }`}
                  >
                    {active && (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{comp.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
              Username
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full h-11 bg-neutral-950/80 border border-neutral-800 rounded-xl pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-11 bg-neutral-950/80 border border-neutral-800 rounded-xl pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-950/50 border border-red-800/60 rounded-xl flex items-center gap-2.5 text-xs text-red-400 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedCompany}
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all duration-200 text-xs tracking-wider uppercase shadow-lg shadow-red-950/60 disabled:opacity-50 mt-2 flex items-center justify-center cursor-pointer active:scale-[0.99]"
          >
            {loading
              ? "Authenticating..."
              : selectedCompany
              ? `Sign In to ${selectedCompany.name}`
              : "Select a company"}
          </button>
        </form>
      </div>
    </div>
  );
}
