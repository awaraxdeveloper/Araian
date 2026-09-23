import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  User,
  Phone,
  MapPin,
  Bike,
  Wrench,
  Star,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  LogOut,
  Sparkles,
  ChevronDown,
  Clock,
  X,
} from "lucide-react";

const TOTAL_STEPS = 12;

const emptyForm = {
  customerId: null,
  name: "",
  mobile: "",
  areaId: "",
  areaOther: "",
  address: "",
  bikeRegNo: "",
  bikeModelId: "",
  bikeYear: "",
  workers: [],
  attention: "",
  computerDiagnosis: "",
  computerRpmCheck: "",
  rStaff: 0,
  rService: 0,
  rExplain: 0,
  rFacility: 0,
  rWait: 0,
  rOverall: 0,
  recommendation: "",
  comment: "",
};

const fieldBase =
  "w-full h-11 rounded-xl bg-white/[0.035] border border-white/[0.08] text-[15px] text-white placeholder-white/30 " +
  "backdrop-blur-xl focus:outline-none focus:bg-white/[0.05] focus:border-red-500/60 focus:ring-2 focus:ring-red-500/15 " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors";

const fieldIcon =
  "w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none";

function relTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-[10.5px] font-semibold text-white/50 uppercase tracking-[0.14em] mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex justify-center gap-1 py-5">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value >= n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1.5 transition-transform duration-150 active:scale-90 cursor-pointer"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={`w-11 h-11 transition-colors ${
                active
                  ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.45)]"
                  : "text-white/15"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function ChoiceButtons({ options, value, onChange }) {
  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full px-4 py-4 rounded-xl text-[15px] font-semibold text-center flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer border ${
              active
                ? "bg-red-600/15 border-red-500/50 text-white shadow-[0_0_24px_-8px_rgba(220,38,38,0.5)]"
                : "bg-white/[0.03] border-white/[0.08] text-white/85 hover:bg-white/[0.05] hover:border-white/[0.14]"
            }`}
          >
            <span>{opt.label}</span>
            {active && (
              <CheckCircle2 className="w-5 h-5 text-red-400 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function GlassSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <FieldLabel required={required}>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${fieldBase} px-3.5 text-left flex items-center justify-between gap-2 cursor-pointer`}
      >
        <span
          className={`truncate ${
            current ? "text-[15px] text-white" : "text-[15px] text-white/30"
          }`}
        >
          {current ? current.label : placeholder || "Select…"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="absolute z-30 w-full mt-1.5 backdrop-blur-2xl bg-neutral-900/95 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-white/40">No options</p>
          ) : (
            options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3.5 py-3 text-[15px] transition-colors cursor-pointer border-b border-white/[0.04] last:border-0 ${
                  o.value === value
                    ? "text-red-400 font-semibold bg-white/[0.02]"
                    : "text-white/85 hover:bg-white/[0.05]"
                }`}
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AutoSuggestInput({
  label,
  icon: Icon,
  value,
  onChange,
  suggestions,
  onSelect,
  placeholder,
  required,
  type = "text",
  inputMode,
  maxLength,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        {Icon && <Icon className={fieldIcon} />}
        <input
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`${fieldBase} ${Icon ? "pl-9" : "pl-3.5"} pr-3.5`}
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 w-full mt-1.5 backdrop-blur-2xl bg-neutral-900/95 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(s);
                setOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.05] border-b border-white/[0.04] last:border-0 transition-colors cursor-pointer"
            >
              <p className="text-[15px] font-medium text-white truncate">
                {s.primary}
              </p>
              {s.secondary && (
                <p className="text-xs text-white/40 truncate mt-0.5">
                  {s.secondary}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkerMultiSelect({ workers, value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  const selected = workers.filter((w) => value.includes(w.id));

  return (
    <div ref={wrapRef} className="relative">
      <FieldLabel required>
        Work By
        <span className="text-white/30 normal-case font-normal ml-1 tracking-normal">
          (one or more)
        </span>
      </FieldLabel>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${fieldBase} px-3.5 min-h-11 h-auto py-2.5 text-left flex items-center gap-2 flex-wrap cursor-pointer`}
      >
        <Wrench className="w-4 h-4 text-white/40 shrink-0" />
        {selected.length === 0 ? (
          <span className="text-[15px] text-white/30">Select workers…</span>
        ) : (
          selected.map((w) => (
            <span
              key={w.id}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-600/15 border border-red-500/30 text-red-300"
            >
              {w.name}
            </span>
          ))
        )}
      </button>
      {open && (
        <div className="absolute z-30 w-full mt-1.5 backdrop-blur-2xl bg-neutral-900/95 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 max-h-60 overflow-y-auto">
          {workers.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-white/40">
              No workers configured.
            </p>
          ) : (
            workers.map((w) => {
              const on = value.includes(w.id);
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => toggle(w.id)}
                  className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-white/[0.05] border-b border-white/[0.04] last:border-0 transition-colors cursor-pointer"
                >
                  <span className="text-[15px] text-white">{w.name}</span>
                  {on && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="p-1.5 rounded-lg bg-red-500/12 border border-red-500/20">
        <Icon className="w-3.5 h-3.5 text-red-400" />
      </div>
      <span className="text-[10.5px] font-semibold text-white/50 uppercase tracking-[0.16em]">
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-white/[0.08] to-transparent" />
    </div>
  );
}

export default function FeedbackFlow({
  companyId,
  companyName,
  currentUser,
  onLogout,
  onExit,
}) {
  const [view, setView] = useState("home");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [toast, setToast] = useState(null);

  const [drafts, setDrafts] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const [areas, setAreas] = useState([]);
  const [bikeModels, setBikeModels] = useState([]);
  const [bikeYears, setBikeYears] = useState([]);
  const [workers, setWorkers] = useState([]);

  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [mobileSuggestions, setMobileSuggestions] = useState([]);
  const [bikeSuggestions, setBikeSuggestions] = useState([]);

  const triggerToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const [a, m, y, w] = await Promise.all([
        supabase
          .from("fb_areas")
          .select("id,name")
          .eq("company_id", companyId)
          .eq("active", true)
          .order("sort_order"),
        supabase
          .from("fb_bike_models")
          .select("id,name")
          .eq("company_id", companyId)
          .eq("active", true)
          .order("sort_order"),
        supabase
          .from("fb_bike_years")
          .select("year")
          .eq("company_id", companyId)
          .eq("active", true)
          .order("year", { ascending: false }),
        supabase
          .from("employees")
          .select("id,name")
          .eq("company_id", companyId)
          .eq("is_manager", false)
          .eq("is_active", true)
          .order("name"),
      ]);
      setAreas(a.data || []);
      setBikeModels(m.data || []);
      setBikeYears((y.data || []).map((r) => r.year));
      setWorkers(w.data || []);
    })();
  }, [companyId]);

  const loadTodayCount = async () => {
    if (!companyId || !currentUser?.id) return;
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();
    const { count } = await supabase
      .from("fb_responses")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("taken_by_user_id", currentUser.id)
      .gte("created_at", start);
    setTodayCount(count || 0);
  };

  const loadDrafts = async () => {
    if (!companyId || !currentUser?.id) return;
    const { data } = await supabase
      .from("fb_drafts")
      .select("*")
      .eq("company_id", companyId)
      .eq("user_id", currentUser.id)
      .order("updated_at", { ascending: false });
    setDrafts(data || []);
  };

  useEffect(() => {
    if (view === "home") {
      loadTodayCount();
      loadDrafts();
    }
  }, [view, companyId, currentUser?.id]);

  // Autosave: create new or update existing draft
  useEffect(() => {
    if (!draftLoaded || view !== "flow") return;
    const hasContent =
      form.name?.trim() ||
      form.mobile ||
      form.bikeRegNo ||
      form.attention ||
      form.rStaff > 0;
    if (!hasContent && step === 1) return;

    const t = setTimeout(async () => {
      if (draftId) {
        await supabase
          .from("fb_drafts")
          .update({
            form_data: form,
            current_step: step,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draftId);
      } else {
        const { data } = await supabase
          .from("fb_drafts")
          .insert({
            company_id: companyId,
            user_id: currentUser.id,
            form_data: form,
            current_step: step,
          })
          .select("id")
          .single();
        if (data) setDraftId(data.id);
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, step, draftLoaded, view, companyId, currentUser?.id, draftId]);

  // Autosuggest effects
  useEffect(() => {
    const q = form.name.trim();
    if (q.length < 2) return setNameSuggestions([]);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("fb_customers")
        .select("id,name,mobile,area_id,address")
        .eq("company_id", companyId)
        .ilike("name", `%${q}%`)
        .limit(8);
      setNameSuggestions(
        (data || []).map((c) => ({
          id: c.id,
          primary: c.name,
          secondary: c.mobile,
          name: c.name,
          mobile: c.mobile,
          area_id: c.area_id,
          address: c.address,
        }))
      );
    }, 250);
    return () => clearTimeout(t);
  }, [form.name, companyId]);

  useEffect(() => {
    const q = form.mobile.replace(/\D/g, "");
    if (q.length < 3) return setMobileSuggestions([]);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("fb_customers")
        .select("id,name,mobile,area_id,address")
        .eq("company_id", companyId)
        .ilike("mobile", `%${q}%`)
        .limit(8);
      setMobileSuggestions(
        (data || []).map((c) => ({
          id: c.id,
          primary: c.mobile,
          secondary: c.name,
          name: c.name,
          mobile: c.mobile,
          area_id: c.area_id,
          address: c.address,
        }))
      );
    }, 250);
    return () => clearTimeout(t);
  }, [form.mobile, companyId]);

  useEffect(() => {
    const q = form.bikeRegNo.trim();
    if (q.length < 2) return setBikeSuggestions([]);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("fb_responses")
        .select(
          "bike_reg_no,bike_model_id,bike_year,customer_id,fb_customers(name,mobile,area_id,address)"
        )
        .eq("company_id", companyId)
        .ilike("bike_reg_no", `${q}%`)
        .order("created_at", { ascending: false })
        .limit(8);
      const seen = new Set();
      const dedup = [];
      (data || []).forEach((r) => {
        if (seen.has(r.bike_reg_no)) return;
        seen.add(r.bike_reg_no);
        dedup.push({
          bike_reg_no: r.bike_reg_no,
          bike_model_id: r.bike_model_id,
          bike_year: r.bike_year,
          customer: r.fb_customers,
        });
      });
      setBikeSuggestions(
        dedup.map((r) => ({
          id: r.bike_reg_no,
          primary: r.bike_reg_no,
          secondary: r.customer?.name
            ? `${r.customer.name} · ${r.customer.mobile || ""}`
            : "",
          bike_model_id: r.bike_model_id,
          bike_year: r.bike_year,
          customer: r.customer,
        }))
      );
    }, 250);
    return () => clearTimeout(t);
  }, [form.bikeRegNo, companyId]);

  const applyCustomerSuggestion = async (s) => {
    setForm((prev) => ({
      ...prev,
      customerId: s.id,
      name: s.name || prev.name,
      mobile: s.mobile || prev.mobile,
      areaId: s.area_id || prev.areaId,
      address: s.address || prev.address,
    }));

    const { data } = await supabase
      .from("fb_responses")
      .select("bike_reg_no, bike_model_id, bike_year")
      .eq("company_id", companyId)
      .eq("customer_id", s.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setForm((prev) => ({
        ...prev,
        bikeRegNo: prev.bikeRegNo || data.bike_reg_no || "",
        bikeModelId: prev.bikeModelId || data.bike_model_id || "",
        bikeYear: prev.bikeYear || String(data.bike_year || ""),
      }));
    }

    triggerToast(`Loaded ${s.name || s.mobile}'s record`);
  };

  const applyBikeSuggestion = (s) => {
    setForm((prev) => ({
      ...prev,
      bikeRegNo: s.bike_reg_no,
      bikeModelId: s.bike_model_id || prev.bikeModelId,
      bikeYear: s.bike_year || prev.bikeYear,
      name: prev.name || s.customer?.name || "",
      mobile: prev.mobile || s.customer?.mobile || "",
      areaId: prev.areaId || s.customer?.area_id || "",
      address: prev.address || s.customer?.address || "",
    }));
    triggerToast("Bike details pre-filled");
  };

  const stepValid = () => {
    switch (step) {
      case 1:
        return (
          form.name.trim().length > 1 &&
          form.mobile.replace(/\D/g, "").length >= 10 &&
          form.areaId &&
          form.bikeRegNo.trim().length >= 3 &&
          form.bikeModelId &&
          form.bikeYear &&
          form.workers.length > 0
        );
      case 2:
        return !!form.attention;
      case 3:
        return !!form.computerDiagnosis;
      case 4:
        return !!form.computerRpmCheck;
      case 5:
        return form.rStaff > 0;
      case 6:
        return form.rService > 0;
      case 7:
        return form.rExplain > 0;
      case 8:
        return form.rFacility > 0;
      case 9:
        return form.rWait > 0;
      case 10:
        return form.rOverall > 0;
      case 11:
        return !!form.recommendation;
      case 12:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!stepValid()) {
      triggerToast("Please complete this step first.", "error");
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step === 1) {
      setView("home");
      return;
    }
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let customerId = form.customerId;
      if (!customerId) {
        const { data: newCust, error: custErr } = await supabase
          .from("fb_customers")
          .insert({
            company_id: companyId,
            name: form.name.trim(),
            mobile: form.mobile.replace(/\D/g, ""),
            area_id: form.areaId || null,
            area_other_text: form.areaOther.trim() || null,
            address: form.address.trim() || null,
          })
          .select("id")
          .single();
        if (custErr) throw custErr;
        customerId = newCust.id;
      }

      const { data: resp, error: respErr } = await supabase
        .from("fb_responses")
        .insert({
          company_id: companyId,
          customer_id: customerId,
          bike_reg_no: form.bikeRegNo.trim().toUpperCase(),
          bike_model_id: form.bikeModelId,
          bike_year: Number(form.bikeYear),
          taken_by_user_id: currentUser.id,
          taken_by_name:
            currentUser.full_name || currentUser.username || "Staff",
          attention_given: form.attention,
          computer_diagnosis: form.computerDiagnosis,
          computer_rpm_check: form.computerRpmCheck,
          rating_staff_behaviour: form.rStaff,
          rating_service_quality: form.rService,
          rating_work_explanation: form.rExplain,
          rating_workshop_facility: form.rFacility,
          rating_waiting_time: form.rWait,
          rating_overall: form.rOverall,
          recommendation: form.recommendation,
          comment: form.comment.trim() || null,
        })
        .select("id")
        .single();
      if (respErr) throw respErr;

      if (form.workers.length) {
        const rows = form.workers.map((wid) => ({
          response_id: resp.id,
          worker_id: wid,
        }));
        const { error: wErr } = await supabase
          .from("fb_response_workers")
          .insert(rows);
        if (wErr) throw wErr;
      }

      // Only clear THIS draft (the one being submitted)
      if (draftId) {
        await supabase.from("fb_drafts").delete().eq("id", draftId);
      }

      setDraftId(null);
      setForm(emptyForm);
      setStep(1);
      setDraftLoaded(false);
      setView("thanks");
    } catch (err) {
      triggerToast(`Save failed: ${err.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startNewFeedback = () => {
    setForm(emptyForm);
    setStep(1);
    setDraftId(null);
    setView("flow");
    setDraftLoaded(true);
  };

  const continueDraft = (d) => {
    setForm({ ...emptyForm, ...(d.form_data || {}) });
    setStep(d.current_step || 1);
    setDraftId(d.id);
    setView("flow");
    setDraftLoaded(true);
  };

  const removeDraft = async (id, e) => {
    e?.stopPropagation();
    await supabase.from("fb_drafts").delete().eq("id", id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    if (draftId === id) setDraftId(null);
    triggerToast("Pending removed");
  };

  // Shell back-arrow behavior:
  //  - on home view: exits to main panel
  //  - elsewhere: returns to the feedback home view
  const handleHeaderBack = () => {
    if (view === "home") {
      if (onExit) onExit();
    } else {
      setView("home");
    }
  };

  // ---------- render ----------

  if (view === "home") {
    return (
      <Shell
        title={companyName}
        subtitle="Customer Feedback"
        onLogout={onLogout}
        onBack={handleHeaderBack}
      >
        <div className="space-y-5">
          {/* Today card */}
          <div className="relative rounded-2xl overflow-hidden bg-white/[0.035] border border-white/[0.08] backdrop-blur-xl p-5">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-red-300/90 uppercase tracking-[0.18em]">
                  Today's Feedback
                </p>
                <p className="text-5xl font-black text-white mt-2 tabular-nums leading-none">
                  {todayCount}
                </p>
                <p className="text-xs text-white/40 mt-2">
                  recorded by you today
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                <Sparkles className="w-6 h-6 text-red-300" />
              </div>
            </div>
          </div>

          {/* New Feedback — always visible */}
          <button
            type="button"
            onClick={startNewFeedback}
            className="w-full p-5 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 border border-red-500/40 flex items-center justify-between transition-all active:scale-[0.98] shadow-[0_12px_32px_-12px_rgba(220,38,38,0.55)] cursor-pointer"
          >
            <div className="text-left">
              <p className="text-[10px] font-semibold text-red-100/90 uppercase tracking-[0.18em]">
                Start
              </p>
              <p className="text-xl font-black text-white mt-0.5">
                New Feedback
              </p>
              <p className="text-xs text-red-100/70 mt-1">
                12 quick questions · ~3 min
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.12] border border-white/[0.15]">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Pending drafts */}
          {drafts.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold text-amber-300/90 uppercase tracking-[0.2em]">
                  Pending · {drafts.length}
                </p>
              </div>
              {drafts.map((d) => {
                const name = d.form_data?.name?.trim();
                const sub = name || d.form_data?.mobile || "Untitled";
                return (
                  <div
                    key={d.id}
                    className="relative rounded-2xl bg-gradient-to-br from-amber-600/12 to-amber-500/5 border border-amber-500/30 flex items-stretch overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => continueDraft(d)}
                      className="flex-1 p-4 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer min-w-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 shrink-0">
                          <Clock className="w-5 h-5 text-amber-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold text-white truncate">
                            {sub}
                          </p>
                          <p className="text-xs text-white/50 mt-0.5 truncate">
                            Step {d.current_step} of {TOTAL_STEPS}
                            {d.updated_at ? ` · ${relTime(d.updated_at)}` : ""}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-300 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => removeDraft(d.id, e)}
                      className="px-3 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors cursor-pointer border-l border-amber-500/20"
                      aria-label="Remove pending"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Shell>
    );
  }

  if (view === "thanks") {
    return (
      <Shell
        title={companyName}
        subtitle="Feedback complete"
        onLogout={onLogout}
        onBack={handleHeaderBack}
      >
        <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">
          <div className="p-5 rounded-full bg-emerald-500/10 border border-emerald-400/25">
            <CheckCircle2 className="w-14 h-14 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">شکریہ!</h2>
            <p className="text-sm text-white/55 mt-2 max-w-xs leading-relaxed">
              آپ کا فیڈبیک ہمارے لیے بہت اہم ہے۔
            </p>
          </div>
          <button
            type="button"
            onClick={startNewFeedback}
            className="w-full py-3.5 rounded-xl bg-gradient-to-br from-red-600 to-red-700 border border-red-500/40 font-bold text-white text-[15px] shadow-[0_12px_32px_-12px_rgba(220,38,38,0.55)] transition-all active:scale-[0.98] cursor-pointer"
          >
            + New Feedback
          </button>
          <button
            type="button"
            onClick={() => setView("home")}
            className="text-xs font-semibold text-white/40 hover:text-white/80 transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title={companyName}
      subtitle="Customer Feedback"
      onLogout={onLogout}
      onBack={handleHeaderBack}
      progress={(step / TOTAL_STEPS) * 100}
      step={step}
      total={TOTAL_STEPS}
    >
      <div className="space-y-5 pb-4">
        {step === 1 && (
          <StepCustomer
            form={form}
            setField={setField}
            areas={areas}
            bikeModels={bikeModels}
            bikeYears={bikeYears}
            workers={workers}
            nameSuggestions={nameSuggestions}
            mobileSuggestions={mobileSuggestions}
            bikeSuggestions={bikeSuggestions}
            onPickName={applyCustomerSuggestion}
            onPickMobile={applyCustomerSuggestion}
            onPickBike={applyBikeSuggestion}
          />
        )}

        {step === 2 && (
          <StepQuestion
            title="ورکشاپ آنے پر کیا آپ کو فوراً توجہ دی گئی اور آپ سے بائیک کے کام کے بارے میں پوچھا گیا؟"
            hint="Were you attended to right away?"
          >
            <ChoiceButtons
              value={form.attention}
              onChange={(v) => setField("attention", v)}
              options={[
                { value: "yes", label: "جی ہاں (Yes)" },
                { value: "partial", label: "کچھ حد تک (Partially)" },
                { value: "no", label: "نہیں (No)" },
              ]}
            />
          </StepQuestion>
        )}

        {step === 3 && (
          <StepQuestion
            title="کیا کام شروع کرنے سے پہلے بائیک کا مسئلہ کمپیوٹرائزڈ چیکنگ کے ذریعے معلوم کیا گیا؟"
            hint="Computerised diagnosis before work"
          >
            <ChoiceButtons
              value={form.computerDiagnosis}
              onChange={(v) => setField("computerDiagnosis", v)}
              options={[
                { value: "yes", label: "جی ہاں (Yes)" },
                { value: "no", label: "نہیں (No)" },
              ]}
            />
          </StepQuestion>
        )}

        {step === 4 && (
          <StepQuestion
            title="کیا کام مکمل ہونے کے بعد پٹرول کی سیٹنگ اور RPM کمپیوٹرائزڈ طریقے سے چیک کیے گئے؟"
            hint="Post-service RPM & tuning check"
          >
            <ChoiceButtons
              value={form.computerRpmCheck}
              onChange={(v) => setField("computerRpmCheck", v)}
              options={[
                { value: "yes", label: "جی ہاں (Yes)" },
                { value: "no", label: "نہیں (No)" },
              ]}
            />
          </StepQuestion>
        )}

        {step === 5 && (
          <StepRating
            title="آپ ہمارے اسٹاف کے رویے اور برتاؤ کو کتنے اسٹار دیں گے؟"
            hint="Staff behaviour"
            value={form.rStaff}
            onChange={(v) => setField("rStaff", v)}
          />
        )}
        {step === 6 && (
          <StepRating
            title="آپ بائیک کے کام اور سروس کے معیار کو کتنے اسٹار دیں گے؟"
            hint="Service & work quality"
            value={form.rService}
            onChange={(v) => setField("rService", v)}
          />
        )}
        {step === 7 && (
          <StepRating
            title="کیا آپ کو بائیک کے کام کے بارے میں مناسب طریقے سے سمجھایا گیا؟"
            hint="Work explanation"
            value={form.rExplain}
            onChange={(v) => setField("rExplain", v)}
          />
        )}
        {step === 8 && (
          <StepRating
            title="ورکشاپ کی صفائی اور کسٹمر کے بیٹھنے کی سہولت کو کتنے اسٹار دیں گے؟"
            hint="Workshop facility & cleanliness"
            value={form.rFacility}
            onChange={(v) => setField("rFacility", v)}
          />
        )}
        {step === 9 && (
          <StepRating
            title="بائیک کا کام مکمل کرنے میں لگنے والے وقت کو کتنے اسٹار دیں گے؟"
            hint="Waiting time"
            value={form.rWait}
            onChange={(v) => setField("rWait", v)}
          />
        )}
        {step === 10 && (
          <StepRating
            title="مجموعی طور پر ARAIAN HONDA CENTRE کے بارے میں آپ کیا ریٹنگ دیں گے؟"
            hint="Overall experience"
            value={form.rOverall}
            onChange={(v) => setField("rOverall", v)}
          />
        )}

        {step === 11 && (
          <StepQuestion
            title="کیا آپ ARAIAN HONDA CENTRE کو دوسروں کو تجویز کریں گے؟"
            hint="Would you recommend us?"
          >
            <ChoiceButtons
              value={form.recommendation}
              onChange={(v) => setField("recommendation", v)}
              options={[
                { value: "must", label: "ضرور (Definitely)" },
                { value: "maybe", label: "شاید (Maybe)" },
                { value: "no", label: "نہیں (No)" },
              ]}
            />
          </StepQuestion>
        )}

        {step === 12 && (
          <StepQuestion
            title="رائے، شکایت یا مشورہ"
            hint="Optional — leave blank if none"
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-white/40 absolute left-3 top-3.5 pointer-events-none" />
              <textarea
                value={form.comment}
                onChange={(e) => setField("comment", e.target.value)}
                placeholder="مثال: قیمت کا مسئلہ / انتظار کا مسئلہ / کوئی تجویز…"
                rows={6}
                maxLength={1000}
                className="w-full rounded-xl bg-white/[0.035] border border-white/[0.08] text-[15px] text-white placeholder-white/30 backdrop-blur-xl focus:outline-none focus:bg-white/[0.05] focus:border-red-500/60 focus:ring-2 focus:ring-red-500/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors pl-9 pr-3.5 py-3 resize-none text-center"
              />
              <p className="text-[11px] text-white/30 text-right mt-1.5">
                {form.comment.length}/1000
              </p>
            </div>
          </StepQuestion>
        )}

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 h-11 rounded-xl bg-white/[0.035] hover:bg-white/[0.06] border border-white/[0.08] font-bold text-white/80 text-[15px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!stepValid() || submitting}
            className="flex-[2] h-11 rounded-xl bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-white font-bold text-[15px] flex items-center justify-center gap-1.5 transition-colors border border-red-500/40 disabled:border-transparent shadow-[0_10px_26px_-10px_rgba(220,38,38,0.6)] disabled:shadow-none cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : step === TOTAL_STEPS ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[90vw]">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-2xl border ${
              toast.type === "error"
                ? "bg-red-950/70 border-red-800/60 text-red-200"
                : "bg-neutral-900/85 border-white/[0.10] text-white"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </Shell>
  );
}

// -------- shell --------

function Shell({
  title,
  subtitle,
  onLogout,
  onBack,
  progress,
  step,
  total,
  children,
}) {
  const segments = useMemo(
    () => (total ? Array.from({ length: total }) : []),
    [total]
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 w-[380px] h-[380px] bg-red-600/[0.08] rounded-full blur-[100px]" />

      <header className="sticky top-0 z-20 backdrop-blur-2xl bg-neutral-950/75 border-b border-white/[0.06]">
        <div className="h-16 px-3 flex items-center justify-between max-w-lg mx-auto w-full gap-2">
          <button
            type="button"
            onClick={onBack || (() => {})}
            className="p-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center min-w-0">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] truncate">
              {title}
            </p>
            <p className="text-[14px] font-bold text-white truncate mt-0.5">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-2.5 rounded-xl text-white/45 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors shrink-0 cursor-pointer"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {typeof progress === "number" && segments.length > 0 && (
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 flex gap-1">
                {segments.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                      i < step ? "bg-red-500" : "bg-white/[0.07]"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-white/55 tabular-nums shrink-0">
                {step}/{total}
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="relative flex-1 px-4 py-5 max-w-lg mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

// -------- step wrappers --------

function StepQuestion({ title, hint, children }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2 text-center">
        <h2 className="text-[20px] leading-snug font-black text-white tracking-tight">
          {title}
        </h2>
        {hint && (
          <p className="text-[10.5px] font-semibold text-white/40 uppercase tracking-[0.16em]">
            {hint}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function StepRating({ title, hint, value, onChange }) {
  return (
    <StepQuestion title={title} hint={hint}>
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl p-3.5">
        <StarRating value={value} onChange={onChange} />
        <div className="flex justify-center pt-1 pb-1">
          <div className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]">
            <span className="text-xl font-black text-yellow-400 tabular-nums">
              {value > 0 ? `${value}.0` : "—"}
            </span>
            <span className="text-xs font-bold text-white/40 ml-1.5">/ 5</span>
          </div>
        </div>
      </div>
    </StepQuestion>
  );
}

// -------- step 1 --------

function StepCustomer({
  form,
  setField,
  areas,
  bikeModels,
  bikeYears,
  workers,
  nameSuggestions,
  mobileSuggestions,
  bikeSuggestions,
  onPickName,
  onPickMobile,
  onPickBike,
}) {
  const areaOptions = areas.map((a) => ({ value: a.id, label: a.name }));
  const bikeModelOptions = bikeModels.map((m) => ({
    value: m.id,
    label: m.name,
  }));
  const yearOptions = bikeYears.map((y) => ({
    value: String(y),
    label: String(y),
  }));
  const showOtherArea =
    areas.find((a) => a.id === form.areaId)?.name === "Other";

  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-black text-white tracking-tight text-center">
        Customer & Job Details
      </h2>

      <div className="space-y-3.5">
        <SectionHeader icon={User} label="Customer" />

        <AutoSuggestInput
          label="Customer Name"
          icon={User}
          required
          value={form.name}
          onChange={(v) => setField("name", v)}
          suggestions={nameSuggestions}
          onSelect={onPickName}
          placeholder="e.g. Ahmed Raza"
        />

        <AutoSuggestInput
          label="Mobile Number"
          icon={Phone}
          required
          type="tel"
          inputMode="numeric"
          maxLength={13}
          value={form.mobile}
          onChange={(v) => setField("mobile", v.replace(/\D/g, ""))}
          suggestions={mobileSuggestions}
          onSelect={onPickMobile}
          placeholder="e.g. 03001234567"
        />

        <GlassSelect
          label="Area"
          value={form.areaId}
          onChange={(v) => setField("areaId", v)}
          options={areaOptions}
          placeholder="Select area"
          required
        />

        {showOtherArea && (
          <div>
            <FieldLabel>Specify Area</FieldLabel>
            <div className="relative">
              <MapPin className={fieldIcon} />
              <input
                type="text"
                value={form.areaOther}
                onChange={(e) => setField("areaOther", e.target.value)}
                placeholder="Type area name"
                className={`${fieldBase} pl-9 pr-3.5`}
              />
            </div>
          </div>
        )}

        <div>
          <FieldLabel>
            Full Address
            <span className="text-white/30 normal-case font-normal ml-1 tracking-normal">
              (optional)
            </span>
          </FieldLabel>
          <div className="relative">
            <MapPin className={fieldIcon} />
            <input
              type="text"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="House, street, landmark"
              className={`${fieldBase} pl-9 pr-3.5`}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3.5">
        <SectionHeader icon={Bike} label="Bike" />

        <AutoSuggestInput
          label="Bike Registration No."
          icon={Bike}
          required
          value={form.bikeRegNo}
          onChange={(v) => setField("bikeRegNo", v.toUpperCase())}
          suggestions={bikeSuggestions}
          onSelect={onPickBike}
          placeholder="e.g. LEA-1234"
        />

        <GlassSelect
          label="Bike Model"
          value={form.bikeModelId}
          onChange={(v) => setField("bikeModelId", v)}
          options={bikeModelOptions}
          placeholder="Select model"
          required
        />

        <GlassSelect
          label="Model Year"
          value={form.bikeYear}
          onChange={(v) => setField("bikeYear", v)}
          options={yearOptions}
          placeholder="Select year"
          required
        />
      </div>

      <div className="space-y-3.5">
        <SectionHeader icon={Wrench} label="Work Details" />
        <WorkerMultiSelect
          workers={workers}
          value={form.workers}
          onChange={(v) => setField("workers", v)}
        />
      </div>
    </div>
  );
}
