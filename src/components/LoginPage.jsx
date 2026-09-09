import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  ShieldCheck,
  Building2,
  KeyRound,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BarChart3,
  Clock,
  Users,
} from "lucide-react";

export default function LoginPage({ onLoginSuccess }) {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [isFetching, setIsFetching] = useState(true); // for loading state

  useEffect(() => {
    async function fetchCompanies() {
      setIsFetching(true);
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
          setFetchError(true);
          setError("No companies found. Please contact support.");
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
        setFetchError(true);
        setError("Could not load company list. Please refresh.");
      } finally {
        setIsFetching(false);
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

    if (!selectedCompany) {
      setError("Please select a company first.");
      setLoading(false);
      return;
    }

    try {
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

      if (user.password_hash !== password) {
        setError("Incorrect password.");
        setLoading(false);
        return;
      }

      if (
        !user.is_admin &&
        user.company_id &&
        user.company_id !== selectedCompany.id
      ) {
        setError(`You are not authorised to manage ${selectedCompany.name}.`);
        setLoading(false);
        return;
      }

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

  if (fetchError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-neutral-950">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-sm text-neutral-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex">
      {/* LEFT: Login Form – modern, clean, no glass */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md space-y-6">
          {/* Brand */}
          <div className="flex items-center space-x-3 my-[40px]">
            <div className="p-2.5 bg-red-600/10 rounded-xl text-red-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">HONDA Portal</h1>
              <p className="text-xs text-neutral-400">Secure sign‑in</p>
            </div>
          </div>

          {/* Company Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-red-500" />
              <span>Company</span>
            </label>

            {isFetching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 bg-neutral-900/60 p-1 rounded-xl border border-neutral-800">
                {companies.map((comp) => {
                  const active = selectedCompany?.id === comp.id;
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => handleSelectCompany(comp)}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-1.5 border ${
                        active
                          ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/40"
                          : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                      }`}
                    >
                      {active && <CheckCircle2 className="w-4 h-4 shrink-0" />}
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
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full h-11 bg-neutral-900/80 border border-neutral-800 rounded-xl pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 bg-neutral-900/80 border border-neutral-800 rounded-xl pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedCompany}
              className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-red-950/40 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span>
                  {selectedCompany
                    ? `Sign in to ${selectedCompany.name}`
                    : "Select a company"}
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-[15px] text-neutral-500">
            Protected · Enterprise‑grade security
          </p>
        </div>
      </div>

      {/* RIGHT: Hero / Branding – updated copy */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neutral-900 via-neutral-950 to-red-950/20 relative overflow-hidden items-center justify-center p-12">
        {/* Abstract shapes */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-red-600 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-600 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/20 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-8 max-w-md">
          {/* Big logo / icon */}
          <div className="inline-flex p-2 ">
            <img
              src="/logo.svg" // relative to public folder
              alt="Company Logo"
              className="w-[140px] h-[140px] object-contain"
            />
          </div>

          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">
              Attendance &amp; Payroll
            </h2>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
              Manage your workforce effortlessly. Track daily attendance,
              generate reports, and handle payroll – all in one place.
            </p>
          </div>

          {/* Feature icons */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-800/50">
            <div className="flex flex-col items-center space-y-1">
              <div className="p-2 bg-neutral-900/80 rounded-xl border border-neutral-800/50 text-red-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-neutral-400">
                Employees
              </span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <div className="p-2 bg-neutral-900/80 rounded-xl border border-neutral-800/50 text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-neutral-400">
                Attendance
              </span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <div className="p-2 bg-neutral-900/80 rounded-xl border border-neutral-800/50 text-blue-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-neutral-400">
                Reports
              </span>
            </div>
          </div>

          <p className="text-[15px] text-neutral-500 mt-4">
            &copy; 2026 HONDA Portal · Secured &amp; Reliable
          </p>
        </div>
      </div>
    </div>
  );
}
