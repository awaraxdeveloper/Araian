import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  User,
  Phone,
  MapPin,
  Bike,
  Wrench,
  Star,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  X,
  Calendar,
  Hash,
} from "lucide-react";

// TOTAL_STEPS is now dynamic — computed at runtime from the questions table.

const emptyForm = {
  customerId: null,
  name: "",
  mobile: "",
  areaId: "",
  areaOther: "",
  visitNumber: "",
  bikeRegNo: "",
  bikeModelId: "",
  bikeYear: "",
  workerId: "",
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

const btnPrimary =
  "bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] hover:from-[#9B7EFF] hover:to-[#7C5CFF] text-white shadow-[0_10px_28px_-10px_rgba(124,92,255,0.6)]";

function relTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ============================================================
// iOS-STYLE FORM INPUTS
// ============================================================

function FieldLabel({ children, required, trailing }) {
  return (
    <label className="block text-[11.5px] font-semibold text-white/75 uppercase tracking-[0.14em] mb-0.5">
      {children}
      {required && <span className="text-[#FF453A] ml-1">*</span>}
      {trailing && (
        <span className="text-white/50 normal-case font-normal ml-1 tracking-normal">
          {trailing}
        </span>
      )}
    </label>
  );
}

function AutoSuggestInput({
  label,
  icon: Icon,
  value,
  onChange,
  suggestions,
  onSelect,
  required,
  uppercase,
  type = "text",
  inputMode,
  maxLength,
}) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => {
    if (open && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      setDropPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(
          160,
          Math.min(300, window.innerHeight - rect.bottom - 24)
        ),
      });
    }
  }, [open, suggestions]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-3 px-4 py-3.5">
        {Icon && (
          <Icon className="w-5 h-5 text-white/40 shrink-0" strokeWidth={1.75} />
        )}
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
          placeholder={`${label}${required ? " *" : ""}`}
          className={`w-full bg-transparent border-0 p-0 text-[17px] leading-tight text-white placeholder-white/30 font-medium focus:outline-none ${
            uppercase ? "uppercase" : ""
          }`}
        />
      </div>
      {open && suggestions.length > 0 && dropPos && (
        <div
          style={dropPos}
          className="fixed z-[90] bg-[#2C2C2E] border border-white/[0.08] rounded-[16px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] overflow-y-auto backdrop-blur-2xl"
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(s);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-white/[0.06] active:bg-white/[0.08] border-b border-white/[0.05] last:border-0 transition-colors cursor-pointer"
            >
              <p className="text-[16px] font-medium text-white truncate">
                {s.primary}
              </p>
              {s.secondary && (
                <p className="text-[13px] text-white/50 truncate mt-0.5">
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

function GlassSelect({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  required,
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors cursor-pointer"
      >
        {Icon && (
          <Icon className="w-5 h-5 text-white/40 shrink-0" strokeWidth={1.75} />
        )}
        <span
          className={`flex-1 min-w-0 text-left truncate text-[17px] leading-tight font-medium ${
            current ? "text-white" : "text-white/30"
          }`}
        >
          {current ? current.label : `${label}${required ? " *" : ""}`}
        </span>
        <ChevronRight
          className="w-5 h-5 text-white/25 shrink-0"
          strokeWidth={2}
        />
      </button>
      {open && (
        <IOSPickerSheet
          title={label}
          options={options}
          value={value}
          onSelect={(v) => {
            onChange(v);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
          emptyLabel="No options available"
        />
      )}
    </>
  );
}

function WorkerSelect({ workers, value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = workers.find((w) => w.id === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors cursor-pointer"
      >
        <Wrench className="w-5 h-5 text-white/40 shrink-0" strokeWidth={1.75} />
        <span
          className={`flex-1 min-w-0 text-left truncate text-[17px] leading-tight font-medium ${
            current ? "text-white" : "text-white/30"
          }`}
        >
          {current ? current.name : "Work By *"}
        </span>
        <ChevronRight
          className="w-5 h-5 text-white/25 shrink-0"
          strokeWidth={2}
        />
      </button>
      {open && (
        <IOSPickerSheet
          title="Select Worker"
          options={workers.map((w) => ({ value: w.id, label: w.name }))}
          value={value}
          onSelect={(v) => {
            onChange(v);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
          emptyLabel="No workers available"
        />
      )}
    </>
  );
}

// ============================================================
// BOTTOM SHEET PICKERS
// ============================================================

function SheetShell({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full bg-[#1C1C1E] border-t border-white/[0.08] rounded-t-[24px] max-h-[78vh] flex flex-col shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/[0.15] rounded-full mx-auto mt-3" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <h3 className="text-[17px] font-bold text-white tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[#A390FF] text-[16px] font-semibold hover:text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
        <div
          className="overflow-y-auto flex-1 pb-6"
          style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function IOSPickerSheet({
  title,
  options,
  value,
  onSelect,
  onClose,
  emptyLabel,
}) {
  return (
    <SheetShell title={title} onClose={onClose}>
      {options.length === 0 ? (
        <p className="p-8 text-center text-[15px] text-white/45">
          {emptyLabel}
        </p>
      ) : (
        options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onSelect(o.value)}
              className={`w-full text-left px-5 py-4 flex items-center justify-between gap-3 border-b border-white/[0.04] last:border-0 transition-colors cursor-pointer ${
                active ? "bg-[#7C5CFF]/10" : "hover:bg-white/[0.03]"
              }`}
            >
              <span
                className={`text-[17px] ${
                  active ? "text-white font-semibold" : "text-white/85"
                }`}
              >
                {o.label}
              </span>
              {active && (
                <div className="w-6 h-6 rounded-full bg-[#7C5CFF] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })
      )}
    </SheetShell>
  );
}

function IOSMultiPickerSheet({
  title,
  items,
  selectedIds,
  onToggle,
  onClose,
  emptyLabel,
}) {
  return (
    <SheetShell title={title} onClose={onClose}>
      {items.length === 0 ? (
        <p className="p-8 text-center text-[15px] text-white/45">
          {emptyLabel}
        </p>
      ) : (
        items.map((it) => {
          const on = selectedIds.includes(it.id);
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onToggle(it.id)}
              className={`w-full text-left px-5 py-4 flex items-center justify-between gap-3 border-b border-white/[0.04] last:border-0 transition-colors cursor-pointer ${
                on ? "bg-[#7C5CFF]/10" : "hover:bg-white/[0.03]"
              }`}
            >
              <span
                className={`text-[17px] ${
                  on ? "text-white font-semibold" : "text-white/85"
                }`}
              >
                {it.label}
              </span>
              {on ? (
                <div className="w-6 h-6 rounded-full bg-[#7C5CFF] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-white/20 shrink-0" />
              )}
            </button>
          );
        })
      )}
    </SheetShell>
  );
}

// ============================================================
// CHOICE + STAR RATING
// ============================================================

function ChoiceButtons({ options, value, onChange }) {
  // Ensure every option has a stable, unique value. If an admin left the
  // value field empty, fall back to the option's index.
  const normalized = (options || []).map((opt, idx) => ({
    value:
      opt.value !== undefined &&
      opt.value !== null &&
      String(opt.value).trim() !== ""
        ? String(opt.value)
        : `__opt_${idx}`,
    label: opt.label,
  }));

  return (
    <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] overflow-hidden divide-y divide-white/[0.05]">
      {normalized.map((opt) => {
        const active = value !== undefined && String(value) === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full px-5 py-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
              active ? "bg-[#7C5CFF]/10" : "hover:bg-white/[0.02]"
            }`}
          >
            <span
              className={`text-[17px] font-medium transition-colors ${
                active ? "text-white" : "text-white/80"
              }`}
            >
              {opt.label}
            </span>
            {active ? (
              <div className="w-6 h-6 rounded-full bg-[#7C5CFF] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-white/15 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function StarRatingDisplay({ value, onChange }) {
  const RATING_LABELS = ["Poor", "Fair", "Good", "Very Good", "Excellent"];
  const label = value > 0 ? RATING_LABELS[value - 1] : "Tap a star to rate";
  const labelColor =
    value >= 4
      ? "text-[#30D158]"
      : value >= 3
      ? "text-[#FFD60A]"
      : value > 0
      ? "text-[#FF6961]"
      : "text-white/40";

  return (
    <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[24px] p-6">
      <div className="flex justify-center gap-1.5 py-3">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value >= n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="p-1 transition-transform duration-150 active:scale-90 cursor-pointer"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                className={`w-12 h-12 transition-all duration-200 ${
                  active
                    ? "fill-[#FFD60A] text-[#FFD60A] drop-shadow-[0_0_16px_rgba(255,214,10,0.5)]"
                    : "text-white/12"
                }`}
              />
            </button>
          );
        })}
      </div>
      <div className="text-center mt-3">
        <p className={`text-[17px] font-bold transition-colors ${labelColor}`}>
          {label}
        </p>
        <p className="text-[13px] text-white/40 mt-0.5 tabular-nums">
          {value > 0 ? `${value} of 5` : "No rating yet"}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

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

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [mobileSuggestions, setMobileSuggestions] = useState([]);
  const [bikeSuggestions, setBikeSuggestions] = useState([]);

  const activeQuestions = React.useMemo(
    () => questions.filter((q) => q.active),
    [questions]
  );
  const TOTAL_STEPS = 1 + activeQuestions.length;

  const triggerToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const [a, m, y, w, q] = await Promise.all([
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
          .select("id,name,base_salary")
          .eq("company_id", companyId)
          .eq("is_manager", false)
          .eq("is_active", true)
          .order("base_salary", { ascending: false }),
        supabase
          .from("fb_questions")
          .select("*")
          .eq("company_id", companyId)
          .order("sort_order", { ascending: true }),
      ]);
      setAreas(a.data || []);
      setBikeModels(m.data || []);
      setBikeYears((y.data || []).map((r) => r.year));
      setWorkers(w.data || []);
      setQuestions(q.data || []);
      setQuestionsLoaded(true);
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
            answers: answers,
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
            answers: answers,
            current_step: step,
          })
          .select("id")
          .single();
        if (data) setDraftId(data.id);
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form,
    answers,
    step,
    draftLoaded,
    view,
    companyId,
    currentUser?.id,
    draftId,
  ]);

  // Autosuggests
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
    }));
    triggerToast("Bike details pre-filled");
  };

  const stepValid = () => {
    if (step === 1) {
      return (
        form.name.trim().length > 1 &&
        form.mobile.replace(/\D/g, "").length >= 10 &&
        form.areaId &&
        form.visitNumber !== "" &&
        form.visitNumber !== null &&
        form.bikeRegNo.trim().length >= 3 &&
        form.bikeModelId &&
        form.bikeYear &&
        form.workerId
      );
    }
    const q = activeQuestions[step - 2];
    if (!q) return false;
    const val = answers[q.id];
    if (!q.required) return true;
    if (q.type === "star") return typeof val === "number" && val > 0;
    return val !== undefined && val !== null && String(val).trim() !== "";
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
            area_other_text: (form.areaOther || "").trim() || null,
          })
          .select("id")
          .single();
        if (custErr) throw custErr;
        customerId = newCust.id;
      }

      const visitNum =
        form.visitNumber === "" || form.visitNumber === null
          ? null
          : Number(form.visitNumber);

      // Map answers by question code → legacy columns (for analytics).
      // ONLY write to numeric columns when the value is actually numeric —
      // otherwise leave it null. This prevents MCQ text hitting smallint.
      const legacyMap = {
        attention: "attention_given",
        computerDiagnosis: "computer_diagnosis",
        computerRpmCheck: "computer_rpm_check",
        rStaff: "rating_staff_behaviour",
        rService: "rating_service_quality",
        rExplain: "rating_work_explanation",
        rFacility: "rating_workshop_facility",
        rWait: "rating_waiting_time",
        rOverall: "rating_overall",
        recommendation: "recommendation",
        comment: "comment",
      };
      const numericCodes = new Set([
        "rStaff",
        "rService",
        "rExplain",
        "rFacility",
        "rWait",
        "rOverall",
      ]);
      const legacy = {};
      activeQuestions.forEach((q) => {
        if (!q.code || !legacyMap[q.code]) return;
        const v = answers[q.id];
        if (v === undefined || v === null || v === "") return;
        if (numericCodes.has(q.code)) {
          const num = Number(v);
          if (Number.isFinite(num)) legacy[legacyMap[q.code]] = num;
        } else {
          legacy[legacyMap[q.code]] = v;
        }
      });

      const { data: resp, error: respErr } = await supabase
        .from("fb_responses")
        .insert({
          company_id: companyId,
          customer_id: customerId,
          bike_reg_no: form.bikeRegNo.trim().toUpperCase(),
          bike_model_id: form.bikeModelId,
          bike_year: Number(form.bikeYear),
          visit_number: visitNum,
          taken_by_user_id: currentUser.id,
          taken_by_name:
            currentUser.full_name || currentUser.username || "Staff",
          attention_given: legacy.attention_given ?? null,
          computer_diagnosis: legacy.computer_diagnosis ?? null,
          computer_rpm_check: legacy.computer_rpm_check ?? null,
          rating_staff_behaviour: legacy.rating_staff_behaviour ?? null,
          rating_service_quality: legacy.rating_service_quality ?? null,
          rating_work_explanation: legacy.rating_work_explanation ?? null,
          rating_workshop_facility: legacy.rating_workshop_facility ?? null,
          rating_waiting_time: legacy.rating_waiting_time ?? null,
          rating_overall: legacy.rating_overall ?? null,
          recommendation: legacy.recommendation ?? null,
          comment: legacy.comment ?? null,
        })
        .select("id")
        .single();
      if (respErr) throw respErr;

      // Save dynamic answers
      if (activeQuestions.length > 0) {
        const answerRows = activeQuestions.map((q) => {
          const v = answers[q.id];
          return {
            response_id: resp.id,
            question_id: q.id,
            rating_value: q.type === "star" && v ? Number(v) : null,
            choice_value:
              q.type !== "star" && v !== undefined && v !== null
                ? String(v)
                : null,
          };
        });
        const { error: aErr } = await supabase
          .from("fb_answers")
          .insert(answerRows);
        if (aErr) console.error("[fb_answers insert]", aErr);
      }

      if (form.workerId) {
        const { error: wErr } = await supabase
          .from("fb_response_workers")
          .insert({
            response_id: resp.id,
            worker_id: form.workerId,
          });
        if (wErr) throw wErr;
      }

      if (draftId) {
        await supabase.from("fb_drafts").delete().eq("id", draftId);
      }

      setDraftId(null);
      setForm(emptyForm);
      setAnswers({});
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
    setAnswers({});
    setStep(1);
    setDraftId(null);
    setView("flow");
    setDraftLoaded(true);
  };

  const continueDraft = (d) => {
    setForm({ ...emptyForm, ...(d.form_data || {}) });
    setAnswers(d.answers || {});
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

  const handleHeaderBack = () => {
    if (view === "home") {
      if (onExit) onExit();
    } else {
      setView("home");
    }
  };

  // ---------- HOME ----------

  if (view === "home") {
    return (
      <Shell
        title={companyName}
        subtitle="Feedback"
        onLogout={onLogout}
        onBack={handleHeaderBack}
      >
        <div className="space-y-5">
          <div className="relative rounded-[24px] overflow-hidden bg-[#1C1C1E] border border-white/[0.06] p-6">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#7C5CFF]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <p className="text-[11px] font-bold text-[#A390FF] uppercase tracking-[0.2em]">
                Today
              </p>
              <p className="text-6xl font-black text-white mt-3 tabular-nums leading-none">
                {todayCount}
              </p>
              <p className="text-[14px] text-white/50 mt-2">
                feedbacks recorded by you
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={startNewFeedback}
            className="w-full p-5 rounded-[24px] border border-[#7C5CFF]/40 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] hover:from-[#9B7EFF] hover:to-[#7C5CFF] text-white shadow-[0_4px_14px_-6px_rgba(124,92,255,0.35)]"
          >
            <div className="text-left">
              <p className="text-[11px] font-bold text-white/85 uppercase tracking-[0.18em]">
                Start
              </p>
              <p className="text-[22px] font-black text-white mt-0.5">
                New Feedback
              </p>
              <p className="text-[13px] text-white/85 mt-1">
                {questionsLoaded
                  ? `${TOTAL_STEPS} quick questions · ~3 min`
                  : "Loading…"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/[0.18] border border-white/[0.24] flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </button>

          {drafts.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <p className="text-[11px] font-bold text-[#FF9F0A] uppercase tracking-[0.2em] px-1">
                Pending · {drafts.length}
              </p>
              {drafts.map((d) => {
                const name = d.form_data?.name?.trim();
                const sub = name || d.form_data?.mobile || "Untitled";
                return (
                  <div
                    key={d.id}
                    className="relative rounded-[18px] bg-[#FF9F0A]/[0.08] border border-[#FF9F0A]/25 flex items-stretch overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => continueDraft(d)}
                      className="flex-1 p-4 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer min-w-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-[14px] bg-[#FF9F0A]/15 border border-[#FF9F0A]/25 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5 text-[#FF9F0A]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[16px] font-bold text-white truncate">
                            {sub}
                          </p>
                          <p className="text-[13px] text-white/50 mt-0.5 truncate">
                            Step {d.current_step} of {TOTAL_STEPS}
                            {d.updated_at ? ` · ${relTime(d.updated_at)}` : ""}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#FF9F0A] shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => removeDraft(d.id, e)}
                      className="px-3 flex items-center justify-center text-white/40 hover:text-[#FF6961] hover:bg-[#FF453A]/[0.08] transition-colors cursor-pointer border-l border-[#FF9F0A]/20"
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

  // ---------- THANKS ----------

  if (view === "thanks") {
    return (
      <Shell
        title={companyName}
        subtitle="Complete"
        onLogout={onLogout}
        onBack={handleHeaderBack}
      >
        <div className="flex flex-col items-center justify-center text-center py-10 space-y-7">
          <div className="relative">
            <div className="absolute inset-0 bg-[#30D158]/25 rounded-full blur-2xl" />
            <div className="relative w-24 h-24 rounded-full bg-[#30D158]/10 border border-[#30D158]/30 flex items-center justify-center">
              <CheckCircle2 className="w-14 h-14 text-[#30D158]" />
            </div>
          </div>
          <div>
            <h2 className="text-[28px] font-black text-white tracking-tight">
              شکریہ!
            </h2>
            <p className="text-[15px] text-white/55 mt-3 max-w-xs leading-relaxed">
              آپ کا فیڈبیک ہمارے لیے بہت اہم ہے۔
            </p>
          </div>
          <button
            type="button"
            onClick={startNewFeedback}
            className={`w-full py-4 rounded-[16px] border border-[#7C5CFF]/40 font-semibold text-white text-[16px] transition-all active:scale-[0.98] cursor-pointer ${btnPrimary}`}
          >
            New Feedback
          </button>
          <button
            type="button"
            onClick={() => setView("home")}
            className="text-[14px] font-semibold text-white/40 hover:text-white/80 transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </Shell>
    );
  }

  // ---------- FLOW ----------

  return (
    <Shell
      title={companyName}
      subtitle={`Step ${step} of ${TOTAL_STEPS}`}
      onLogout={onLogout}
      onBack={handleHeaderBack}
      progress={(step / TOTAL_STEPS) * 100}
    >
      <div className="space-y-6 pb-4">
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

        {step >= 2 &&
          (() => {
            const q = activeQuestions[step - 2];
            if (!q) return null;
            const title = q.text_ur || q.text_en || "";
            const hint = q.hint_en || q.hint_ur || "";
            const value = answers[q.id];

            return (
              <StepQuestion title={title} hint={hint} key={q.id}>
                {q.type === "star" && (
                  <StarRatingDisplay
                    value={typeof value === "number" ? value : 0}
                    onChange={(v) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: v }))
                    }
                  />
                )}
                {q.type === "mcq" && (
                  <ChoiceButtons
                    value={value}
                    onChange={(v) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: v }))
                    }
                    options={(q.options || []).map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                  />
                )}
                {q.type === "text" && (
                  <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[24px] p-5">
                    <textarea
                      value={value || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      placeholder="Type your answer…"
                      rows={6}
                      maxLength={1000}
                      className="w-full bg-transparent border-0 p-0 text-[17px] leading-relaxed text-white placeholder-white/25 font-medium focus:outline-none resize-none"
                    />
                    <p className="text-[12px] text-white/35 text-right mt-2 tabular-nums">
                      {(value || "").length}/1000
                    </p>
                  </div>
                )}
              </StepQuestion>
            );
          })()}

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 h-12 rounded-[14px] bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] font-semibold text-white/85 text-[16px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98]"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!stepValid() || submitting}
            className={`flex-[2] h-12 rounded-[14px] disabled:bg-white/[0.06] disabled:text-white/30 disabled:cursor-not-allowed disabled:shadow-none text-white font-semibold text-[16px] flex items-center justify-center gap-1.5 transition-all border border-[#7C5CFF]/40 disabled:border-transparent cursor-pointer active:scale-[0.98] ${btnPrimary}`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving…
              </>
            ) : step === TOTAL_STEPS ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Submit
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] max-w-[90vw]">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-[14px] shadow-2xl backdrop-blur-2xl border ${
              toast.type === "error"
                ? "bg-[#FF453A]/15 border-[#FF453A]/30 text-[#FF6961]"
                : "bg-[#1C1C1E]/90 border-white/[0.10] text-white"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-[#FF453A] shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#30D158] shrink-0" />
            )}
            <span className="text-[15px] font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </Shell>
  );
}

// ============================================================
// SHELL
// ============================================================

function Shell({ title, subtitle, onLogout, onBack, progress, children }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 w-[400px] h-[400px] bg-[#7C5CFF]/[0.08] rounded-full blur-[120px]" />

      <header className="sticky top-0 z-20 backdrop-blur-2xl bg-black/70 border-b border-white/[0.05]">
        <div className="h-14 px-2 flex items-center justify-between max-w-lg mx-auto w-full">
          <button
            type="button"
            onClick={onBack || (() => {})}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
          </button>

          <div className="flex-1 text-center min-w-0 px-2">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.18em] truncate">
              {title}
            </p>
            <p className="text-[13px] font-semibold text-white truncate mt-0.5">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-xl text-white/45 hover:text-[#FF6961] hover:bg-[#FF453A]/[0.08] transition-colors shrink-0 cursor-pointer"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {typeof progress === "number" && (
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8B6EFF] to-[#6B4FE8] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
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

// ============================================================
// STEP WRAPPERS
// ============================================================

function StepQuestion({ title, hint, children }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2.5 text-center pt-2">
        <h2 className="text-[22px] leading-snug font-bold text-white tracking-tight">
          {title}
        </h2>
        {hint && (
          <p className="text-[12px] font-semibold text-white/40 uppercase tracking-[0.16em]">
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
      <StarRatingDisplay value={value} onChange={onChange} />
    </StepQuestion>
  );
}

// ============================================================
// STEP 1 — CUSTOMER & JOB DETAILS (iOS grouped form)
// ============================================================

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
      <div className="text-center space-y-2 pt-2">
        <h2 className="text-[24px] font-bold text-white tracking-tight">
          Customer Details
        </h2>
        <p className="text-[13px] text-white/45">
          Fill in the customer and job information
        </p>
      </div>

      {/* Customer group */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.16em] px-1">
          Customer
        </p>
        <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[18px] overflow-hidden divide-y divide-white/[0.05]">
          <AutoSuggestInput
            label="Full Name"
            icon={User}
            required
            value={form.name}
            onChange={(v) => setField("name", v)}
            suggestions={nameSuggestions}
            onSelect={onPickName}
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
          />
          <GlassSelect
            label="Area"
            icon={MapPin}
            required
            value={form.areaId}
            onChange={(v) => setField("areaId", v)}
            options={areaOptions}
          />
          {showOtherArea && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <MapPin
                className="w-5 h-5 text-white/40 shrink-0"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={form.areaOther}
                onChange={(e) => setField("areaOther", e.target.value)}
                placeholder="Specify Area"
                className="w-full bg-transparent border-0 p-0 text-[17px] leading-tight text-white placeholder-white/30 font-medium focus:outline-none"
              />
            </div>
          )}
          <GlassSelect
            label="Visit"
            icon={Hash}
            required
            value={form.visitNumber}
            onChange={(v) => setField("visitNumber", v)}
            options={Array.from({ length: 101 }, (_, i) => ({
              value: String(i),
              label: `Visit ${i}`,
            }))}
          />
        </div>
      </div>

      {/* Bike group */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.16em] px-1">
          Bike
        </p>
        <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[18px] overflow-hidden divide-y divide-white/[0.05]">
          <AutoSuggestInput
            label="Registration No."
            icon={Bike}
            required
            uppercase
            value={form.bikeRegNo}
            onChange={(v) => setField("bikeRegNo", v)}
            suggestions={bikeSuggestions}
            onSelect={onPickBike}
          />
          <GlassSelect
            label="Model"
            icon={Bike}
            required
            value={form.bikeModelId}
            onChange={(v) => setField("bikeModelId", v)}
            options={bikeModelOptions}
          />
          <GlassSelect
            label="Model Year"
            icon={Calendar}
            required
            value={form.bikeYear}
            onChange={(v) => setField("bikeYear", v)}
            options={yearOptions}
          />
        </div>
      </div>

      {/* Work Details group */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.16em] px-1">
          Work Details
        </p>
        <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[18px] overflow-hidden">
          <WorkerSelect
            workers={workers}
            value={form.workerId}
            onChange={(v) => setField("workerId", v)}
          />
        </div>
      </div>
    </div>
  );
}
