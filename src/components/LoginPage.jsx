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
  ChevronRight,
} from "lucide-react";

export default function LoginPage({ onLoginSuccess }) {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

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
        user,
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
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-6 bg-black">
        <div className="w-full max-w-sm bg-[#1C1C1E] border border-white/[0.08] rounded-[20px] p-8 text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-[14px] bg-[#FF453A]/10 border border-[#FF453A]/25 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-[#FF453A]" />
          </div>
          <p className="text-[16px] text-white/80">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-12 bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] hover:from-[#9B7EFF] hover:to-[#7C5CFF] text-white font-semibold rounded-[14px] transition-colors active:scale-[0.98] text-[16px]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-black flex flex-col lg:flex-row">
      {/* FORM COLUMN */}
      <div className="w-full lg:w-1/2 flex-1 flex items-center justify-center p-6 relative overflow-y-auto">
        <div className="w-full max-w-sm space-y-8 py-4">
          {/* Brand */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-[18px] bg-[#1C1C1E] border border-white/[0.08] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-[#7C5CFF]" />
            </div>
            <div>
              <h1 className="text-[26px] sm:text-[22px] font-bold tracking-tight text-white">
                Welcome back
              </h1>
              <p className="text-[15px] sm:text-[13px] text-white/50 mt-1">
                Sign in to continue to HONDA Portal
              </p>
            </div>
          </div>

          {/* Company picker */}
          <div className="space-y-2.5">
            <p className="text-[12px] sm:text-[11px] font-semibold text-white/40 uppercase tracking-[0.14em] px-1">
              Company
            </p>
            {isFetching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-[14px] overflow-hidden divide-y divide-white/[0.05]">
                {companies.map((comp) => {
                  const active = selectedCompany?.id === comp.id;
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => setSelectedCompany(comp)}
                      className="w-full px-4 py-4 sm:py-3.5 flex items-center justify-between text-left transition-colors hover:bg-white/[0.03] active:bg-white/[0.06]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 sm:w-9 sm:h-9 rounded-[10px] flex items-center justify-center shrink-0 ${
                            active
                              ? "bg-[#7C5CFF]/15 border border-[#7C5CFF]/30"
                              : "bg-white/[0.05] border border-white/[0.08]"
                          }`}
                        >
                          <Building2
                            className={`w-[18px] h-[18px] ${
                              active ? "text-[#7C5CFF]" : "text-white/40"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[16px] sm:text-[15px] font-medium truncate ${
                            active ? "text-white" : "text-white/70"
                          }`}
                        >
                          {comp.name}
                        </span>
                      </div>
                      {active ? (
                        <CheckCircle2 className="w-5 h-5 text-[#7C5CFF] shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/20 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Credentials */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-[14px] overflow-hidden divide-y divide-white/[0.05]">
              <div className="relative">
                <User className="w-[18px] h-[18px] text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full h-[54px] bg-transparent pl-11 pr-4 text-[16px] text-white placeholder-white/30 focus:outline-none"
                />
              </div>
              <div className="relative">
                <KeyRound className="w-[18px] h-[18px] text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-[54px] bg-transparent pl-11 pr-4 text-[16px] text-white placeholder-white/30 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-[#FF453A]/10 border border-[#FF453A]/25 rounded-[14px]">
                <AlertCircle className="w-4 h-4 text-[#FF453A] shrink-0 mt-0.5" />
                <span className="text-[14px] sm:text-[13px] text-[#FF6961]">
                  {error}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedCompany}
              className="w-full h-[52px] bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] hover:from-[#9B7EFF] hover:to-[#7C5CFF] disabled:bg-white/[0.06] disabled:text-white/30 text-white font-semibold rounded-[14px] text-[16px] transition-all disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          <p className="text-center text-[12px] text-white/30">
            Protected · Enterprise-grade security
          </p>
        </div>
      </div>

      {/* HERO (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0B] relative overflow-hidden items-center justify-center p-12 border-l border-white/[0.05]">
        <div className="absolute inset-0 opacity-[0.18]">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#7C5CFF] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#7C5CFF] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-md">
          <div className="inline-flex p-2">
            <img
              src="/logo.svg"
              alt="Company Logo"
              className="w-[120px] h-[120px] object-contain"
            />
          </div>

          <div>
            <h2 className="text-[28px] font-bold text-white tracking-tight leading-tight">
              Attendance &amp; Payroll
            </h2>
            <p className="text-[14px] text-white/50 mt-3 leading-relaxed">
              Manage your workforce effortlessly. Track daily attendance,
              generate reports, and handle payroll — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/[0.06]">
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="w-10 h-10 rounded-[12px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <Users className="w-[18px] h-[18px] text-[#7C5CFF]" />
              </div>
              <span className="text-[11px] font-medium text-white/50">
                Employees
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="w-10 h-10 rounded-[12px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <Clock className="w-[18px] h-[18px] text-[#30D158]" />
              </div>
              <span className="text-[11px] font-medium text-white/50">
                Attendance
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="w-10 h-10 rounded-[12px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <BarChart3 className="w-[18px] h-[18px] text-[#0A84FF]" />
              </div>
              <span className="text-[11px] font-medium text-white/50">
                Reports
              </span>
            </div>
          </div>

          <p className="text-[12px] text-white/30 pt-2">
            &copy; 2026 HONDA Portal · Secured &amp; Reliable
          </p>
        </div>
      </div>
    </div>
  );
}
