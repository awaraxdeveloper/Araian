import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import CustomDatePicker from "../components/ui/CustomDatePicker";
import CustomSelect from "../components/ui/CustomSelect";
import {
  BarChart3,
  MessageSquare,
  Users,
  AlertCircle,
  Search,
  FileText,
  Eye,
  Star,
  ThumbsUp,
  Wrench,
  X,
  Plus,
  Trash2,
  Loader2,
  Settings,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

const RANGES = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "3m", label: "3M" },
  { id: "custom", label: "Custom" },
];

const SUB_TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "responses", label: "Responses", icon: MessageSquare },
  { id: "workers", label: "Workers", icon: Wrench },
  { id: "attention", label: "Attention", icon: AlertCircle },
  { id: "customers", label: "Customers", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

function rangeToDates(range, customFrom, customTo) {
  const now = new Date();
  if (range === "today") return [startOfDay(now), endOfDay(now)];
  if (range === "7d") {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    return [startOfDay(s), endOfDay(now)];
  }
  if (range === "30d") {
    const s = new Date(now);
    s.setDate(s.getDate() - 29);
    return [startOfDay(s), endOfDay(now)];
  }
  if (range === "3m") {
    const s = new Date(now);
    s.setMonth(s.getMonth() - 3);
    return [startOfDay(s), endOfDay(now)];
  }
  const from = customFrom ? new Date(customFrom) : startOfDay(now);
  const to = customTo ? new Date(customTo) : now;
  return [startOfDay(from), endOfDay(to)];
}

function avg(arr) {
  const vals = arr.filter((v) => typeof v === "number" && v > 0);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function isLow(r) {
  return (
    (r.rating_overall && r.rating_overall <= 2) ||
    (r.rating_service_quality && r.rating_service_quality <= 2) ||
    (r.rating_staff_behaviour && r.rating_staff_behaviour <= 2)
  );
}
function hasComplaint(r) {
  return !!(r.comment && r.comment.trim()) || isLow(r);
}

const btnPrimary =
  "bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] hover:from-[#9B7EFF] hover:to-[#7C5CFF] text-white shadow-[0_10px_28px_-10px_rgba(124,92,255,0.6)]";
const btnBlue =
  "bg-gradient-to-b from-[#3B9CFF] to-[#0A84FF] hover:from-[#4BAAFF] hover:to-[#0A84FF] text-white shadow-[0_10px_28px_-10px_rgba(10,132,255,0.6)]";

export default function FeedbackAdminDashboard({ companyId, companyName }) {
  const [subTab, setSubTab] = useState("overview");
  const [range, setRange] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filterArea, setFilterArea] = useState("");
  const [filterBike, setFilterBike] = useState("");
  const [filterWorker, setFilterWorker] = useState("");
  const [search, setSearch] = useState("");

  const [responses, setResponses] = useState([]);
  const [areas, setAreas] = useState([]);
  const [bikeModels, setBikeModels] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [bikeYears, setBikeYears] = useState([]);
  const [loading, setLoading] = useState(false);

  const [settingsTab, setSettingsTab] = useState("areas");
  const [newArea, setNewArea] = useState("");
  const [newBike, setNewBike] = useState("");
  const [newYear, setNewYear] = useState("");

  const [detailResponse, setDetailResponse] = useState(null);
  const [workerDetail, setWorkerDetail] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [customerDetail, setCustomerDetail] = useState(null);

  const PAGE_SIZE = 20;
  const [customersPage, setCustomersPage] = useState(1);
  const [customersTotal, setCustomersTotal] = useState(0);
  const [customersLoading, setCustomersLoading] = useState(false);

  const loadDropdowns = async () => {
    const [a, m, y, w] = await Promise.all([
      supabase
        .from("fb_areas")
        .select("id,name,active,sort_order")
        .eq("company_id", companyId)
        .order("sort_order"),
      supabase
        .from("fb_bike_models")
        .select("id,name,active,sort_order")
        .eq("company_id", companyId)
        .order("sort_order"),
      supabase
        .from("fb_bike_years")
        .select("year,active")
        .eq("company_id", companyId)
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
  };

  const loadResponses = async () => {
    setLoading(true);
    try {
      const [from, to] = rangeToDates(range, customFrom, customTo);
      const { data, error } = await supabase
        .from("fb_responses")
        .select(
          `
          *,
          customer:fb_customers(id,name,mobile,area_id,area_other_text,address,created_at),
          workers:fb_response_workers(worker:employees(id,name))
        `
        )
        .eq("company_id", companyId)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      setResponses(
        (data || []).map((r) => ({
          ...r,
          worker_list: (r.workers || []).map((w) => w.worker).filter(Boolean),
        }))
      );
    } catch (err) {
      console.error("[fb admin load]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyId) return;
    loadDropdowns();
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    loadResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, range, customFrom, customTo]);

  useEffect(() => {
    if (!companyId) return;
    const ch = supabase
      .channel(`fb_admin_${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fb_responses",
          filter: `company_id=eq.${companyId}`,
        },
        () => loadResponses()
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const areaMap = useMemo(() => {
    const m = {};
    areas.forEach((a) => (m[a.id] = a.name));
    return m;
  }, [areas]);

  const bikeModelMap = useMemo(() => {
    const m = {};
    bikeModels.forEach((b) => (m[b.id] = b.name));
    return m;
  }, [bikeModels]);

  const workerMap = useMemo(() => {
    const m = {};
    workers.forEach((w) => (m[w.id] = w.name));
    return m;
  }, [workers]);

  const activeFilterCount = [
    filterArea,
    filterBike,
    filterWorker,
    search.trim(),
  ].filter(Boolean).length;

  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      if (filterArea && r.customer?.area_id !== filterArea) return false;
      if (filterBike && r.bike_model_id !== filterBike) return false;
      if (
        filterWorker &&
        !(r.worker_list || []).some((w) => w.id === filterWorker)
      )
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const blob = [
          r.customer?.name,
          r.customer?.mobile,
          r.bike_reg_no,
          r.comment,
          r.taken_by_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [responses, filterArea, filterBike, filterWorker, search]);

  const metrics = useMemo(() => {
    const total = filteredResponses.length;
    const ratings = {
      staff: avg(filteredResponses.map((r) => r.rating_staff_behaviour)),
      service: avg(filteredResponses.map((r) => r.rating_service_quality)),
      explain: avg(filteredResponses.map((r) => r.rating_work_explanation)),
      facility: avg(filteredResponses.map((r) => r.rating_workshop_facility)),
      wait: avg(filteredResponses.map((r) => r.rating_waiting_time)),
      overall: avg(filteredResponses.map((r) => r.rating_overall)),
    };
    const recTotal = filteredResponses.filter((r) => r.recommendation).length;
    const recMust = filteredResponses.filter(
      (r) => r.recommendation === "must"
    ).length;
    const recMaybe = filteredResponses.filter(
      (r) => r.recommendation === "maybe"
    ).length;
    const recNo = filteredResponses.filter(
      (r) => r.recommendation === "no"
    ).length;
    const lows = filteredResponses.filter(isLow).length;
    const complaints = filteredResponses.filter(
      (r) => r.comment && r.comment.trim()
    ).length;
    const byStaff = {};
    filteredResponses.forEach((r) => {
      const k = r.taken_by_user_id;
      if (!byStaff[k]) byStaff[k] = { name: r.taken_by_name, count: 0 };
      byStaff[k].count++;
    });
    return {
      total,
      ratings,
      overallAvg: ratings.overall,
      recTotal,
      recMust,
      recMaybe,
      recNo,
      recPct: recTotal ? Math.round((recMust / recTotal) * 100) : 0,
      lows,
      complaints,
      byStaff,
    };
  }, [filteredResponses]);

  const workerStats = useMemo(() => {
    const map = {};
    filteredResponses.forEach((r) => {
      (r.worker_list || []).forEach((w) => {
        if (!map[w.id]) {
          map[w.id] = {
            id: w.id,
            name: w.name,
            total: 0,
            rOverall: [],
            rService: [],
            rExplain: [],
            recMust: 0,
            recTotal: 0,
            lows: 0,
            complaints: 0,
          };
        }
        const m = map[w.id];
        m.total++;
        if (r.rating_overall) m.rOverall.push(r.rating_overall);
        if (r.rating_service_quality) m.rService.push(r.rating_service_quality);
        if (r.rating_work_explanation)
          m.rExplain.push(r.rating_work_explanation);
        if (r.recommendation) {
          m.recTotal++;
          if (r.recommendation === "must") m.recMust++;
        }
        if (isLow(r)) m.lows++;
        if (r.comment && r.comment.trim()) m.complaints++;
      });
    });
    return Object.values(map)
      .map((m) => ({
        ...m,
        avgOverall: avg(m.rOverall),
        avgService: avg(m.rService),
        avgExplain: avg(m.rExplain),
        recPct: m.recTotal ? Math.round((m.recMust / m.recTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredResponses]);

  const attentionList = useMemo(
    () =>
      filteredResponses.filter(hasComplaint).sort((a, b) => {
        const la = isLow(a) ? 1 : 0;
        const lb = isLow(b) ? 1 : 0;
        if (lb !== la) return lb - la;
        return new Date(b.created_at) - new Date(a.created_at);
      }),
    [filteredResponses]
  );

  const buildReportHTML = () => {
    const [from, to] = rangeToDates(range, customFrom, customTo);
    const sameDay =
      from.getFullYear() === to.getFullYear() &&
      from.getMonth() === to.getMonth() &&
      from.getDate() === to.getDate();
    const dateLabel = sameDay
      ? `Report Date: ${fmtDate(from.toISOString())}`
      : `From ${fmtDate(from.toISOString())} to ${fmtDate(to.toISOString())}`;

    const active = [];
    if (filterArea) active.push(`Area: ${areaMap[filterArea]}`);
    if (filterBike) active.push(`Bike: ${bikeModelMap[filterBike]}`);
    if (filterWorker) active.push(`Worker: ${workerMap[filterWorker]}`);
    if (search.trim()) active.push(`Search: "${search.trim()}"`);
    const filterLine = active.length
      ? `Filters: ${active.join(" · ")}`
      : "No filters applied";

    const rowsHtml = filteredResponses
      .map((r, idx) => {
        const areaName =
          areaMap[r.customer?.area_id] || r.customer?.area_other_text || "—";
        const workers =
          (r.worker_list || []).map((w) => w.name).join(", ") || "—";
        return `
        <tr>
          <td>${idx + 1}</td>
          <td>${fmtDate(
            r.created_at
          )}<br><span style="color:#64748b;font-size:10px">${fmtTime(
          r.created_at
        )}</span></td>
          <td>${r.customer?.name || "—"}</td>
          <td style="font-family:monospace">${r.customer?.mobile || "—"}</td>
          <td>${areaName}</td>
          <td style="font-family:monospace">${
            r.bike_reg_no
          }<br><span style="color:#64748b;font-size:10px">${
          bikeModelMap[r.bike_model_id] || "—"
        }</span></td>
          <td>${workers}</td>
          <td>${r.taken_by_name}</td>
          <td style="text-align:center;font-weight:bold">${
            r.rating_overall || "—"
          }</td>
          <td>${
            r.recommendation === "must"
              ? "Must"
              : r.recommendation === "maybe"
              ? "Maybe"
              : "No"
          }</td>
        </tr>`;
      })
      .join("");

    return `
      <html>
        <head>
          <title>${companyName} — Feedback Report</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; margin: 0; }
            .header { border-bottom: 2px solid #7c5cff; padding-bottom: 12px; margin-bottom: 20px; }
            .company { font-size: 22px; font-weight: bold; color: #0f172a; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .date-label { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 8px; }
            .filter-line { font-size: 11px; color: #64748b; margin-top: 4px; }
            .summary-box { display: flex; gap: 12px; margin-bottom: 20px; }
            .card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; }
            .card .num { font-size: 20px; font-weight: bold; color: #0f172a; }
            .card .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
            th { background-color: #f1f5f9; font-weight: bold; color: #334155; font-size: 10px; text-transform: uppercase; }
            .footer { margin-top: 24px; font-size: 10px; color: #6b7280; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">${companyName}</div>
            <div class="subtitle">Customer Feedback Report</div>
            <div class="date-label">${dateLabel}</div>
            <div class="filter-line">${filterLine}</div>
          </div>
          <div class="summary-box">
            <div class="card"><div class="num">${
              metrics.total
            }</div><div class="lbl">Total</div></div>
            <div class="card"><div class="num">${metrics.overallAvg.toFixed(
              2
            )}</div><div class="lbl">Avg Overall</div></div>
            <div class="card"><div class="num">${
              metrics.recPct
            }%</div><div class="lbl">Recommend</div></div>
            <div class="card"><div class="num">${
              metrics.lows
            }</div><div class="lbl">Low</div></div>
            <div class="card"><div class="num">${
              metrics.complaints
            }</div><div class="lbl">Complaints</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:32px">#</th>
                <th>Date</th><th>Customer</th><th>Mobile</th>
                <th>Area</th><th>Bike</th><th>Workers</th>
                <th>Taken By</th><th style="width:60px">Overall</th><th>Rec.</th>
              </tr>
            </thead>
            <tbody>
              ${
                rowsHtml ||
                '<tr><td colspan="10" style="text-align:center">No records</td></tr>'
              }
            </tbody>
          </table>
          <div class="footer">Generated ${new Date().toLocaleString()} · ${companyName}</div>
        </body>
      </html>
    `;
  };

  const previewPDF = () => {
    const win = window.open("", "_blank", "width=1000,height=800");
    win.document.write(buildReportHTML());
    win.document.close();
  };

  const exportPDF = () => {
    const win = window.open("", "_blank", "width=1000,height=800");
    win.document.write(buildReportHTML());
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const addArea = async () => {
    const v = newArea.trim();
    if (!v) return;
    const max = areas.reduce((m, a) => Math.max(m, a.sort_order || 0), 0);
    await supabase.from("fb_areas").insert({
      company_id: companyId,
      name: v,
      sort_order: v.toLowerCase() === "other" ? 999 : max + 1,
    });
    setNewArea("");
    loadDropdowns();
  };
  const toggleArea = async (a) => {
    await supabase
      .from("fb_areas")
      .update({ active: !a.active })
      .eq("id", a.id);
    loadDropdowns();
  };
  const deleteArea = async (a) => {
    if (!window.confirm(`Delete area "${a.name}"?`)) return;
    await supabase.from("fb_areas").delete().eq("id", a.id);
    loadDropdowns();
  };

  const addBike = async () => {
    const v = newBike.trim();
    if (!v) return;
    const max = bikeModels.reduce((m, b) => Math.max(m, b.sort_order || 0), 0);
    await supabase.from("fb_bike_models").insert({
      company_id: companyId,
      name: v,
      sort_order: v.toLowerCase() === "other" ? 999 : max + 1,
    });
    setNewBike("");
    loadDropdowns();
  };
  const toggleBike = async (b) => {
    await supabase
      .from("fb_bike_models")
      .update({ active: !b.active })
      .eq("id", b.id);
    loadDropdowns();
  };
  const deleteBike = async (b) => {
    if (!window.confirm(`Delete bike model "${b.name}"?`)) return;
    await supabase.from("fb_bike_models").delete().eq("id", b.id);
    loadDropdowns();
  };

  const addYear = async () => {
    const v = Number(newYear);
    if (!v || v < 1990 || v > 2100) return;
    await supabase
      .from("fb_bike_years")
      .insert({ company_id: companyId, year: v });
    setNewYear("");
    loadDropdowns();
  };
  const deleteYear = async (year) => {
    await supabase
      .from("fb_bike_years")
      .delete()
      .eq("company_id", companyId)
      .eq("year", year);
    loadDropdowns();
  };

  const loadCustomers = async (page = 1, query = "") => {
    setCustomersLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const q = query.trim();

      if (!q) {
        const { data, count, error } = await supabase
          .from("fb_customers")
          .select("id,name,mobile,area_id,created_at", { count: "exact" })
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .range(from, to);
        if (error) throw error;
        setCustomerResults(data || []);
        setCustomersTotal(count || 0);
        setCustomersPage(page);
        return;
      }

      const [byName, byMobile, byBike] = await Promise.all([
        supabase
          .from("fb_customers")
          .select("id,name,mobile,area_id,created_at")
          .eq("company_id", companyId)
          .ilike("name", `%${q}%`)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("fb_customers")
          .select("id,name,mobile,area_id,created_at")
          .eq("company_id", companyId)
          .ilike("mobile", `%${q.replace(/\D/g, "")}%`)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("fb_responses")
          .select("customer:fb_customers(id,name,mobile,area_id,created_at)")
          .eq("company_id", companyId)
          .ilike("bike_reg_no", `%${q}%`)
          .limit(200),
      ]);

      const map = new Map();
      (byName.data || []).forEach((c) => map.set(c.id, c));
      (byMobile.data || []).forEach((c) => map.set(c.id, c));
      (byBike.data || []).forEach((r) => {
        if (r.customer) map.set(r.customer.id, r.customer);
      });

      const all = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      const paged = all.slice(from, to + 1);
      setCustomerResults(paged);
      setCustomersTotal(all.length);
      setCustomersPage(page);
    } catch (err) {
      console.error("[load customers]", err);
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    if (subTab !== "customers") return;
    loadCustomers(1, customerSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab, companyId]);

  const openCustomer = async (c) => {
    const { data } = await supabase
      .from("fb_responses")
      .select(`*, workers:fb_response_workers(worker:employees(id,name))`)
      .eq("company_id", companyId)
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false });
    setCustomerDetail({
      customer: c,
      responses: (data || []).map((r) => ({
        ...r,
        worker_list: (r.workers || []).map((w) => w.worker).filter(Boolean),
      })),
    });
  };

  // ---------- render ----------

  return (
    <div className="w-full space-y-5 sm:space-y-6 pb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] sm:text-[24px] font-bold text-white tracking-tight leading-tight">
            Customer Feedback
          </h1>
          <p className="text-[14px] sm:text-[13px] text-white/50 mt-1">
            {companyName} · {metrics.total} response
            {metrics.total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={previewPDF}
            className="h-12 sm:h-10 px-3 sm:px-4 rounded-[12px] text-[15px] sm:text-[12px] font-semibold flex items-center gap-2 transition-all active:scale-[0.98] bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]"
            title="Preview report"
          >
            <Eye className="w-5 h-5 sm:w-4 sm:h-4 text-[#3B9CFF]" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={exportPDF}
            className={`h-12 sm:h-10 px-3 sm:px-4 rounded-[12px] text-[15px] sm:text-[12px] font-semibold flex items-center gap-2 transition-all active:scale-[0.98] border border-[#7C5CFF]/40 ${btnPrimary}`}
            title="Download PDF"
          >
            <FileText className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Ranges */}
      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`h-11 sm:h-9 px-4 rounded-[12px] text-[15px] sm:text-[12px] font-semibold uppercase tracking-wide border transition-all ${
              range === r.id
                ? "bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] border-[#7C5CFF]/40 text-white shadow-[0_8px_20px_-8px_rgba(124,92,255,0.6)]"
                : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {range === "custom" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CustomDatePicker
            label="From"
            value={customFrom}
            onChange={setCustomFrom}
          />
          <CustomDatePicker
            label="To"
            value={customTo}
            onChange={setCustomTo}
          />
        </div>
      )}

      {/* Filters toggle (mobile) */}
      <button
        onClick={() => setFiltersOpen((v) => !v)}
        className="md:hidden w-full h-12 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-[14px] text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-all"
      >
        <SlidersHorizontal className="w-5 h-5" />
        Filters
        {activeFilterCount > 0 && (
          <span className="bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] text-white text-[12px] font-black rounded-full px-2 py-0.5 min-w-[22px]">
            {activeFilterCount}
          </span>
        )}
      </button>

      <div
        className={`${
          filtersOpen ? "block" : "hidden"
        } md:block bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-4 space-y-3`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CustomSelect
            label="Area"
            value={filterArea}
            onChange={setFilterArea}
            options={[
              { value: "", label: "All areas" },
              ...areas
                .filter((a) => a.active)
                .map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
          <CustomSelect
            label="Bike Model"
            value={filterBike}
            onChange={setFilterBike}
            options={[
              { value: "", label: "All bikes" },
              ...bikeModels
                .filter((b) => b.active)
                .map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
          <CustomSelect
            label="Worker"
            value={filterWorker}
            onChange={setFilterWorker}
            options={[
              { value: "", label: "All workers" },
              ...workers.map((w) => ({ value: w.id, label: w.name })),
            ]}
          />
        </div>

        <div className="relative">
          <Search className="w-5 h-5 sm:w-4 sm:h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, mobile, bike…"
            className="w-full h-12 sm:h-11 bg-white/[0.03] border border-white/[0.08] rounded-[12px] pl-11 pr-4 text-[16px] sm:text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/15"
          />
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={() => {
              setFilterArea("");
              setFilterBike("");
              setFilterWorker("");
              setSearch("");
            }}
            className="text-[15px] sm:text-[12px] font-semibold text-[#A390FF] hover:text-white uppercase tracking-wide"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-2 h-11 sm:h-10 px-3.5 rounded-[12px] text-[15px] sm:text-[12px] font-semibold uppercase tracking-wide border transition-all ${
                active
                  ? "bg-white/[0.08] border-white/[0.14] text-white"
                  : "bg-[#1C1C1E] border-white/[0.06] text-white/55 hover:text-white hover:border-white/[0.12]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.id === "attention" && attentionList.length > 0 && (
                <span className="ml-0.5 bg-gradient-to-b from-[#FF6B60] to-[#E0382E] text-white text-[11px] font-black rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {attentionList.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-7 h-7 text-[#A390FF] animate-spin" />
        </div>
      )}

      {!loading && subTab === "overview" && (
        <OverviewView
          metrics={metrics}
          responses={filteredResponses}
          areaMap={areaMap}
          bikeModelMap={bikeModelMap}
          onOpenDetail={setDetailResponse}
        />
      )}
      {!loading && subTab === "responses" && (
        <ResponsesView
          responses={filteredResponses}
          areaMap={areaMap}
          bikeModelMap={bikeModelMap}
          onOpenDetail={setDetailResponse}
        />
      )}
      {!loading && subTab === "workers" && (
        <WorkersView workerStats={workerStats} onOpenWorker={setWorkerDetail} />
      )}
      {!loading && subTab === "attention" && (
        <AttentionView
          list={attentionList}
          areaMap={areaMap}
          onOpenDetail={setDetailResponse}
        />
      )}
      {!loading && subTab === "customers" && (
        <CustomersView
          search={customerSearch}
          onSearch={setCustomerSearch}
          onRun={() => loadCustomers(1, customerSearch)}
          results={customerResults}
          areaMap={areaMap}
          onOpen={openCustomer}
          page={customersPage}
          pageSize={PAGE_SIZE}
          total={customersTotal}
          loading={customersLoading}
          onPageChange={(p) => loadCustomers(p, customerSearch)}
        />
      )}
      {!loading && subTab === "settings" && (
        <SettingsView
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          areas={areas}
          bikeModels={bikeModels}
          years={bikeYears}
          newArea={newArea}
          setNewArea={setNewArea}
          newBike={newBike}
          setNewBike={setNewBike}
          newYear={newYear}
          setNewYear={setNewYear}
          onAddArea={addArea}
          onToggleArea={toggleArea}
          onDeleteArea={deleteArea}
          onAddBike={addBike}
          onToggleBike={toggleBike}
          onDeleteBike={deleteBike}
          onAddYear={addYear}
          onDeleteYear={deleteYear}
          workers={workers}
        />
      )}

      {detailResponse && (
        <ResponseDetailModal
          r={detailResponse}
          areaMap={areaMap}
          bikeModelMap={bikeModelMap}
          onClose={() => setDetailResponse(null)}
        />
      )}
      {workerDetail && (
        <WorkerDetailModal
          workerId={workerDetail.id}
          workerName={workerDetail.name}
          responses={filteredResponses}
          areaMap={areaMap}
          bikeModelMap={bikeModelMap}
          onClose={() => setWorkerDetail(null)}
          onOpenDetail={setDetailResponse}
        />
      )}
      {customerDetail && (
        <CustomerDetailModal
          customer={customerDetail.customer}
          responses={customerDetail.responses}
          areaMap={areaMap}
          bikeModelMap={bikeModelMap}
          onClose={() => setCustomerDetail(null)}
          onOpenDetail={setDetailResponse}
        />
      )}
    </div>
  );
}

// ---------- Views ----------

function KpiCard({ label, value, sub, icon: Icon, accent = "violet" }) {
  const accents = {
    violet: "text-[#A390FF] bg-[#7C5CFF]/10 border-[#7C5CFF]/20",
    blue: "text-[#3B9CFF] bg-[#0A84FF]/10 border-[#0A84FF]/20",
    green: "text-[#30D158] bg-[#30D158]/10 border-[#30D158]/20",
    yellow: "text-[#FFD60A] bg-[#FFD60A]/10 border-[#FFD60A]/20",
    red: "text-[#FF6961] bg-[#FF453A]/10 border-[#FF453A]/20",
  };
  return (
    <div className="bg-[#1C1C1E] border border-white/[0.06] p-4 sm:p-5 rounded-[20px]">
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-[12px] sm:text-[10px] font-semibold text-white/50 uppercase tracking-wider truncate">
          {label}
        </span>
        {Icon && (
          <div
            className={`p-2 rounded-[10px] border shrink-0 ${
              accents[accent] || accents.violet
            }`}
          >
            <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
          </div>
        )}
      </div>
      <div className="text-[26px] sm:text-[24px] font-bold text-white tabular-nums leading-tight">
        {value}
      </div>
      {sub && (
        <div className="text-[14px] sm:text-[12px] text-white/45 mt-1.5 leading-snug">
          {sub}
        </div>
      )}
    </div>
  );
}

function RatingBar({ label, value }) {
  const pct = (value / 5) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[16px] sm:text-[14px] font-semibold text-white/85">
          {label}
        </span>
        <span className="font-mono font-bold text-[#FFD60A] tabular-nums text-[16px] sm:text-[14px]">
          {value > 0 ? value.toFixed(2) : "—"}
        </span>
      </div>
      <div className="w-full h-2.5 bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.06]">
        <div
          className="h-full bg-gradient-to-r from-[#FFE03A] to-[#FFD60A] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OverviewView({
  metrics,
  responses,
  areaMap,
  bikeModelMap,
  onOpenDetail,
}) {
  const recent = responses.slice(0, 5);
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total"
          value={metrics.total}
          sub="feedback in range"
          icon={MessageSquare}
        />
        <KpiCard
          label="Avg Rating"
          value={`⭐ ${metrics.overallAvg.toFixed(2)}`}
          sub="out of 5.00"
          icon={Star}
          accent="yellow"
        />
        <KpiCard
          label="Recommend"
          value={`${metrics.recPct}%`}
          sub={`${metrics.recMust} · ${metrics.recMaybe} · ${metrics.recNo}`}
          icon={ThumbsUp}
          accent="green"
        />
        <KpiCard
          label="Attention"
          value={metrics.lows + metrics.complaints}
          sub={`${metrics.lows} low · ${metrics.complaints} complaints`}
          icon={AlertCircle}
          accent="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-[#1C1C1E] border border-white/[0.06] p-5 sm:p-6 rounded-[20px] space-y-4">
          <h4 className="text-[16px] sm:text-[14px] font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-4 sm:h-4 text-[#A390FF]" />
            Rating Breakdown
          </h4>
          <div className="space-y-4">
            <RatingBar label="Staff Behaviour" value={metrics.ratings.staff} />
            <RatingBar
              label="Service Quality"
              value={metrics.ratings.service}
            />
            <RatingBar
              label="Work Explanation"
              value={metrics.ratings.explain}
            />
            <RatingBar
              label="Workshop Facility"
              value={metrics.ratings.facility}
            />
            <RatingBar label="Waiting Time" value={metrics.ratings.wait} />
            <RatingBar
              label="Overall Experience"
              value={metrics.ratings.overall}
            />
          </div>
        </div>

        <div className="bg-[#1C1C1E] border border-white/[0.06] p-5 sm:p-6 rounded-[20px] space-y-4">
          <h4 className="text-[16px] sm:text-[14px] font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-4 sm:h-4 text-[#A390FF]" />
            Submissions by Staff
          </h4>
          {Object.keys(metrics.byStaff).length === 0 ? (
            <p className="text-[14px] text-white/50">No data in range.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(metrics.byStaff)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([uid, info]) => (
                  <div
                    key={uid}
                    className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-[12px] px-4 py-3"
                  >
                    <span className="text-[15px] sm:text-[14px] font-semibold text-white truncate">
                      {info.name}
                    </span>
                    <span className="text-[15px] sm:text-[14px] font-mono font-bold text-[#A390FF] tabular-nums">
                      {info.count}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1C1C1E] border border-white/[0.06] p-5 sm:p-6 rounded-[20px] space-y-4">
        <h4 className="text-[16px] sm:text-[14px] font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 sm:w-4 sm:h-4 text-[#A390FF]" />
          Recent Submissions
        </h4>
        {recent.length === 0 ? (
          <p className="text-[14px] text-white/50">No recent feedback.</p>
        ) : (
          <div className="space-y-2.5">
            {recent.map((r) => (
              <ResponseRow
                key={r.id}
                r={r}
                areaMap={areaMap}
                bikeModelMap={bikeModelMap}
                onOpen={() => onOpenDetail(r)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ rec }) {
  const map = {
    must: "bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20",
    maybe: "bg-[#FFD60A]/10 text-[#FFD60A] border-[#FFD60A]/20",
    no: "bg-[#FF453A]/10 text-[#FF6961] border-[#FF453A]/20",
  };
  const labels = { must: "Must", maybe: "Maybe", no: "No" };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[12px] font-bold uppercase border ${map[rec]}`}
    >
      {labels[rec] || rec}
    </span>
  );
}

function RatingPill({ v }) {
  if (!v) return <span className="text-white/40 text-[16px]">—</span>;
  const color =
    v >= 4 ? "text-[#30D158]" : v >= 3 ? "text-[#FFD60A]" : "text-[#FF6961]";
  return (
    <span className={`font-mono font-bold text-[16px] sm:text-[14px] ${color}`}>
      {v}★
    </span>
  );
}

function ResponseRow({ r, areaMap, bikeModelMap, onOpen }) {
  const areaName =
    areaMap[r.customer?.area_id] || r.customer?.area_other_text || "—";
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-[14px] p-4 transition-colors active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="font-semibold text-[16px] sm:text-[14px] text-white truncate">
              {r.customer?.name || "Unknown"}
            </span>
            {isLow(r) && (
              <span className="text-[11px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FF453A]/10 border border-[#FF453A]/25 text-[#FF6961]">
                Low
              </span>
            )}
            {r.comment && r.comment.trim() && (
              <span className="text-[11px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFD60A]/10 border border-[#FFD60A]/25 text-[#FFD60A]">
                Comment
              </span>
            )}
          </div>
          <div className="text-[14px] sm:text-[13px] text-white/50 truncate">
            {r.customer?.mobile || "—"} · {areaName}
          </div>
          <div className="text-[14px] sm:text-[13px] text-white/45 truncate">
            {r.bike_reg_no} · {bikeModelMap[r.bike_model_id] || "—"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[12px] sm:text-[11px] font-mono text-white/45 whitespace-nowrap">
            {fmtDate(r.created_at)}
          </span>
          <div className="flex items-center gap-1.5">
            <RatingPill v={r.rating_overall} />
            <StatusPill rec={r.recommendation} />
          </div>
        </div>
      </div>
    </button>
  );
}

function ResponsesView({ responses, areaMap, bikeModelMap, onOpenDetail }) {
  if (responses.length === 0) {
    return (
      <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-8 text-center">
        <p className="text-[15px] text-white/60">No responses in range.</p>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden space-y-2.5">
        {responses.map((r) => (
          <ResponseRow
            key={r.id}
            r={r}
            areaMap={areaMap}
            bikeModelMap={bikeModelMap}
            onOpen={() => onOpenDetail(r)}
          />
        ))}
      </div>

      <div className="hidden md:block bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-white/85">
            <thead className="bg-white/[0.02] uppercase text-[10px] text-white/40 tracking-wider border-b border-white/[0.06]">
              <tr>
                <th className="p-3 w-10">#</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Area</th>
                <th className="p-3">Bike</th>
                <th className="p-3">Workers</th>
                <th className="p-3">Taken By</th>
                <th className="p-3 text-center">Overall</th>
                <th className="p-3">Rec.</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {responses.map((r, i) => (
                <tr
                  key={r.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-3 text-white/40 font-mono">{i + 1}</td>
                  <td className="p-3 font-mono text-white whitespace-nowrap">
                    {fmtDate(r.created_at)}
                  </td>
                  <td className="p-3 font-semibold text-white">
                    {r.customer?.name || "—"}
                  </td>
                  <td className="p-3 font-mono text-white/60">
                    {r.customer?.mobile || "—"}
                  </td>
                  <td className="p-3">
                    {areaMap[r.customer?.area_id] ||
                      r.customer?.area_other_text ||
                      "—"}
                  </td>
                  <td className="p-3 font-mono text-white/85 whitespace-nowrap">
                    {r.bike_reg_no}
                    <span className="text-white/40 block text-[10px]">
                      {bikeModelMap[r.bike_model_id] || "—"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {(r.worker_list || []).map((w) => (
                        <span
                          key={w.id}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 text-[#A390FF]"
                        >
                          {w.name}
                        </span>
                      ))}
                      {(!r.worker_list || r.worker_list.length === 0) && (
                        <span className="text-white/30">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-white/60">{r.taken_by_name}</td>
                  <td className="p-3 text-center">
                    <RatingPill v={r.rating_overall} />
                  </td>
                  <td className="p-3">
                    <StatusPill rec={r.recommendation} />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onOpenDetail(r)}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function WorkersView({ workerStats, onOpenWorker }) {
  if (workerStats.length === 0) {
    return (
      <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-8 text-center">
        <p className="text-[15px] text-white/60">No worker data in range.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {workerStats.map((w) => (
        <button
          key={w.id}
          onClick={() => onOpenWorker(w)}
          className="text-left bg-[#1C1C1E] border border-white/[0.06] hover:border-white/[0.12] rounded-[20px] p-5 transition-colors active:scale-[0.99]"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 rounded-[12px]">
              <Wrench className="w-5 h-5 text-[#A390FF]" />
            </div>
            {w.lows > 0 && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-[#FF453A]/10 border border-[#FF453A]/25 text-[#FF6961]">
                {w.lows} low
              </span>
            )}
          </div>
          <h4 className="font-bold text-white text-[18px] sm:text-[16px] truncate">
            {w.name}
          </h4>
          <p className="text-[14px] sm:text-[13px] text-white/50 mt-0.5">
            {w.total} bike{w.total !== 1 ? "s" : ""} worked
          </p>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[10px] p-2.5">
              <span className="text-[12px] text-white/40 block mb-0.5">
                Overall
              </span>
              <span className="font-mono font-bold text-[#FFD60A] text-[16px] sm:text-[14px]">
                {w.avgOverall > 0 ? w.avgOverall.toFixed(2) : "—"}
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[10px] p-2.5">
              <span className="text-[12px] text-white/40 block mb-0.5">
                Service
              </span>
              <span className="font-mono font-bold text-[#FFD60A] text-[16px] sm:text-[14px]">
                {w.avgService > 0 ? w.avgService.toFixed(2) : "—"}
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[10px] p-2.5">
              <span className="text-[12px] text-white/40 block mb-0.5">
                Explain
              </span>
              <span className="font-mono font-bold text-[#FFD60A] text-[16px] sm:text-[14px]">
                {w.avgExplain > 0 ? w.avgExplain.toFixed(2) : "—"}
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[10px] p-2.5">
              <span className="text-[12px] text-white/40 block mb-0.5">
                Rec %
              </span>
              <span className="font-mono font-bold text-[#30D158] text-[16px] sm:text-[14px]">
                {w.recPct}%
              </span>
            </div>
          </div>
          {w.complaints > 0 && (
            <p className="text-[14px] text-[#FF6961] mt-3 font-semibold">
              {w.complaints} complaint{w.complaints > 1 ? "s" : ""}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

function AttentionView({ list, areaMap, onOpenDetail }) {
  if (list.length === 0) {
    return (
      <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-[#30D158] mx-auto mb-3" />
        <p className="text-[15px] text-white/70">
          No complaints or low ratings in this range.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {list.map((r) => (
        <ResponseRow
          key={r.id}
          r={r}
          areaMap={areaMap}
          bikeModelMap={{}}
          onOpen={() => onOpenDetail(r)}
        />
      ))}
    </div>
  );
}

function CustomersView({
  search,
  onSearch,
  onRun,
  results,
  areaMap,
  onOpen,
  page,
  pageSize,
  total,
  loading,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;

  return (
    <div className="space-y-4">
      <div className="bg-[#1C1C1E] border border-white/[0.06] p-4 rounded-[20px] space-y-3">
        <label className="text-[14px] sm:text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
          Search by Name, Mobile, or Bike Reg
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 sm:w-4 sm:h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onRun()}
              placeholder="Ahmed / 0300 / LEA-1234"
              className="w-full h-12 sm:h-11 bg-white/[0.03] border border-white/[0.08] rounded-[12px] pl-11 pr-4 text-[16px] sm:text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-[#7C5CFF]/60"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRun}
              className={`flex-1 sm:flex-none h-12 sm:h-11 px-6 rounded-[12px] text-[15px] sm:text-[13px] font-semibold text-white transition-all active:scale-[0.98] border border-[#7C5CFF]/40 ${btnPrimary}`}
            >
              Search
            </button>
            {search.trim() && (
              <button
                onClick={() => {
                  onSearch("");
                  setTimeout(onRun, 0);
                }}
                className="h-12 sm:h-11 px-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-[12px] text-[15px] sm:text-[13px] font-semibold text-white/70 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[14px] sm:text-[12px] text-white/50 px-1">
        <span>
          {loading
            ? "Loading…"
            : total === 0
            ? "No customers"
            : `Showing ${startIdx + 1}–${Math.min(
                startIdx + pageSize,
                total
              )} of ${total}`}
        </span>
        {total > 0 && (
          <span className="font-mono">
            Page {page} / {totalPages}
          </span>
        )}
      </div>

      {loading ? (
        <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-12 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-[#A390FF] animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-8 text-center">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-[15px] text-white/60">
            {search.trim()
              ? "No customers match your search."
              : "No customers yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpen(c)}
                className="w-full text-left bg-[#1C1C1E] hover:bg-white/[0.04] border border-white/[0.06] rounded-[14px] p-4 transition-colors flex items-center justify-between active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate text-[16px] sm:text-[14px]">
                    {c.name}
                  </p>
                  <p className="text-[14px] sm:text-[12px] text-white/50 font-mono truncate mt-0.5">
                    {c.mobile} · {areaMap[c.area_id] || "—"}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4 text-white/30 shrink-0 ml-2" />
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-11 px-4 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.08] rounded-[12px] text-[15px] sm:text-[13px] font-semibold text-white/85 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="h-11 px-4 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.08] rounded-[12px] text-[15px] sm:text-[13px] font-semibold text-white/85 transition-colors"
              >
                Next
              </button>
            </div>
          )}
          {totalPages > 1 && (
            <p className="text-center text-[14px] text-white/50 font-mono">
              Page {page} of {totalPages}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SettingsView({
  settingsTab,
  setSettingsTab,
  areas,
  bikeModels,
  years,
  newArea,
  setNewArea,
  newBike,
  setNewBike,
  newYear,
  setNewYear,
  onAddArea,
  onToggleArea,
  onDeleteArea,
  onAddBike,
  onToggleBike,
  onDeleteBike,
  onAddYear,
  onDeleteYear,
  workers,
}) {
  const tabs = [
    { id: "areas", label: "Areas" },
    { id: "bikes", label: "Bikes" },
    { id: "years", label: "Years" },
    { id: "workers", label: "Workers" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSettingsTab(t.id)}
            className={`h-11 sm:h-9 px-4 rounded-[12px] text-[15px] sm:text-[12px] font-semibold uppercase tracking-wide border transition-all ${
              settingsTab === t.id
                ? "bg-white/[0.08] border-white/[0.14] text-white"
                : "bg-white/[0.03] border-white/[0.08] text-white/55 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {settingsTab === "areas" && (
        <SettingsList
          title="Customer Areas"
          addValue={newArea}
          setAddValue={setNewArea}
          onAdd={onAddArea}
          onToggle={onToggleArea}
          onDelete={onDeleteArea}
          items={areas.map((a) => ({
            id: a.id,
            name: a.name,
            active: a.active,
            raw: a,
          }))}
          placeholder="New area name"
        />
      )}

      {settingsTab === "bikes" && (
        <SettingsList
          title="Bike Models"
          addValue={newBike}
          setAddValue={setNewBike}
          onAdd={onAddBike}
          onToggle={onToggleBike}
          onDelete={onDeleteBike}
          items={bikeModels.map((b) => ({
            id: b.id,
            name: b.name,
            active: b.active,
            raw: b,
          }))}
          placeholder="New bike model"
        />
      )}

      {settingsTab === "years" && (
        <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-5 space-y-4">
          <h4 className="text-[16px] sm:text-[14px] font-bold text-white">
            Bike Years
          </h4>
          <div className="flex gap-2">
            <input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              placeholder="e.g. 2027"
              className="flex-1 h-12 sm:h-11 bg-white/[0.03] border border-white/[0.08] rounded-[12px] px-4 text-[16px] sm:text-[15px] text-white focus:outline-none focus:border-[#7C5CFF]/60"
            />
            <button
              onClick={onAddYear}
              className={`h-12 w-12 sm:h-11 sm:w-11 rounded-[12px] text-white flex items-center justify-center shrink-0 border border-[#7C5CFF]/40 ${btnPrimary}`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <span
                key={y}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[15px] sm:text-[13px] font-mono text-white"
              >
                {y}
                <button
                  onClick={() => onDeleteYear(y)}
                  className="text-white/40 hover:text-[#FF6961]"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
            {years.length === 0 && (
              <p className="text-[15px] text-white/50">Nothing yet.</p>
            )}
          </div>
        </div>
      )}

      {settingsTab === "workers" && (
        <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-5 space-y-3">
          <h4 className="text-[16px] sm:text-[14px] font-bold text-white">
            Workers
          </h4>
          <p className="text-[14px] sm:text-[12px] text-white/50">
            Workers come from the Employees list. Add or remove them in the
            Employees tab.
          </p>
          <div className="space-y-2">
            {workers.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-[12px] px-4 py-3"
              >
                <span className="text-[16px] sm:text-[14px] font-semibold text-white truncate">
                  {w.name}
                </span>
                <span className="text-[11px] font-bold uppercase px-2 py-1 rounded-full bg-[#30D158]/10 border border-[#30D158]/20 text-[#30D158]">
                  Active
                </span>
              </div>
            ))}
            {workers.length === 0 && (
              <p className="text-[15px] text-white/50">
                No active workers. Add non-manager employees first.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsList({
  title,
  addValue,
  setAddValue,
  onAdd,
  onToggle,
  onDelete,
  items,
  placeholder,
}) {
  return (
    <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-5 space-y-4">
      <h4 className="text-[16px] sm:text-[14px] font-bold text-white">
        {title}
      </h4>
      <div className="flex gap-2">
        <input
          type="text"
          value={addValue}
          onChange={(e) => setAddValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          className="flex-1 h-12 sm:h-11 bg-white/[0.03] border border-white/[0.08] rounded-[12px] px-4 text-[16px] sm:text-[15px] text-white focus:outline-none focus:border-[#7C5CFF]/60 min-w-0"
        />
        <button
          onClick={onAdd}
          className={`h-12 w-12 sm:h-11 sm:w-11 rounded-[12px] text-white flex items-center justify-center shrink-0 border border-[#7C5CFF]/40 ${btnPrimary}`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between gap-2 bg-white/[0.02] border border-white/[0.06] rounded-[12px] px-4 py-3"
          >
            <span
              className={`text-[16px] sm:text-[14px] font-semibold truncate ${
                it.active ? "text-white" : "text-white/40 line-through"
              }`}
            >
              {it.name}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onToggle(it.raw)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  it.active
                    ? "bg-gradient-to-b from-[#42E366] to-[#28B94D]"
                    : "bg-white/[0.12]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    it.active ? "translate-x-5" : ""
                  }`}
                />
              </button>
              <button
                onClick={() => onDelete(it.raw)}
                className="p-2.5 rounded-lg bg-white/[0.04] hover:bg-[#FF453A]/10 border border-white/[0.08] text-white/50 hover:text-[#FF6961] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-[15px] text-white/50">Nothing yet.</p>
        )}
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/85 backdrop-blur-xl">
      <div
        className={`bg-[#1C1C1E] border-t sm:border border-white/[0.08] rounded-t-[24px] sm:rounded-[20px] w-full ${
          wide ? "sm:max-w-3xl" : "sm:max-w-xl"
        } max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.06] shrink-0">
          <h3 className="text-[18px] sm:text-[16px] font-bold text-white truncate">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-[12px] p-3.5">
      <span className="text-[12px] sm:text-[11px] font-medium text-white/50 block mb-1">
        {label}
      </span>
      <span className="text-[16px] sm:text-[14px] font-medium text-white break-words whitespace-pre-wrap">
        {children || "—"}
      </span>
    </div>
  );
}

function ResponseDetailModal({ r, areaMap, bikeModelMap, onClose }) {
  const areaName =
    areaMap[r.customer?.area_id] || r.customer?.area_other_text || "—";
  return (
    <ModalShell title="Feedback Details" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[14px] p-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="min-w-0">
              <h4 className="text-[18px] sm:text-[17px] font-bold text-white truncate">
                {r.customer?.name}
              </h4>
              <p className="text-[14px] sm:text-[12px] text-white/60 font-mono mt-0.5">
                {r.customer?.mobile} · {areaName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isLow(r) && (
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-[#FF453A]/10 border border-[#FF453A]/25 text-[#FF6961]">
                  Low
                </span>
              )}
              <StatusPill rec={r.recommendation} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Field label="Submitted">
            {`${fmtDate(r.created_at)} · ${fmtTime(r.created_at)}`}
          </Field>
          <Field label="Taken By">{r.taken_by_name}</Field>
          <Field label="Bike Reg No.">{r.bike_reg_no}</Field>
          <Field label="Bike Model">{bikeModelMap[r.bike_model_id]}</Field>
          <Field label="Model Year">{r.bike_year}</Field>
          <Field label="Attention at Arrival">
            {r.attention_given === "yes"
              ? "Yes"
              : r.attention_given === "partial"
              ? "Partially"
              : "No"}
          </Field>
          <Field label="Computerised Diagnosis">
            {r.computer_diagnosis === "yes"
              ? "Yes"
              : r.computer_diagnosis === "no"
              ? "No"
              : "—"}
          </Field>
          <Field label="RPM / Petrol Setting Check">
            {r.computer_rpm_check === "yes"
              ? "Yes"
              : r.computer_rpm_check === "no"
              ? "No"
              : "—"}
          </Field>
        </div>

        <div>
          <p className="text-[14px] sm:text-[12px] font-bold uppercase tracking-wider text-white/50 mb-2">
            Workers
          </p>
          <div className="flex flex-wrap gap-2">
            {(r.worker_list || []).map((w) => (
              <span
                key={w.id}
                className="text-[13px] font-bold px-3 py-1.5 rounded-full bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 text-[#A390FF]"
              >
                {w.name}
              </span>
            ))}
            {(r.worker_list || []).length === 0 && (
              <span className="text-[14px] text-white/50">None credited</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-[14px] sm:text-[12px] font-bold uppercase tracking-wider text-white/50 mb-2">
            Ratings
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              ["Staff Behaviour", r.rating_staff_behaviour],
              ["Service Quality", r.rating_service_quality],
              ["Work Explanation", r.rating_work_explanation],
              ["Facility", r.rating_workshop_facility],
              ["Waiting Time", r.rating_waiting_time],
              ["Overall", r.rating_overall],
            ].map(([label, val]) => (
              <div
                key={label}
                className="bg-white/[0.02] border border-white/[0.06] rounded-[12px] p-3.5"
              >
                <span className="text-[12px] text-white/50 block mb-1.5">
                  {label}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-4 h-4 ${
                        val >= n
                          ? "fill-[#FFD60A] text-[#FFD60A]"
                          : "text-white/15"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {r.comment && r.comment.trim() && (
          <div>
            <p className="text-[14px] sm:text-[12px] font-bold uppercase tracking-wider text-white/50 mb-2">
              Customer Comment
            </p>
            <div className="bg-[#FFD60A]/[0.06] border border-[#FFD60A]/20 rounded-[12px] p-4 text-[16px] sm:text-[14px] text-white/90 whitespace-pre-wrap">
              {r.comment}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function WorkerDetailModal({
  workerId,
  workerName,
  responses,
  areaMap,
  bikeModelMap,
  onClose,
  onOpenDetail,
}) {
  const mine = responses.filter((r) =>
    (r.worker_list || []).some((w) => w.id === workerId)
  );
  return (
    <ModalShell title={`Worker — ${workerName}`} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Total Worked" value={mine.length} />
          <KpiCard
            label="Overall"
            value={avg(mine.map((r) => r.rating_overall)).toFixed(2)}
            accent="yellow"
          />
          <KpiCard label="Low" value={mine.filter(isLow).length} accent="red" />
          <KpiCard
            label="Complaints"
            value={mine.filter((r) => r.comment?.trim()).length}
            accent="red"
          />
        </div>
        <div className="space-y-2.5">
          <p className="text-[14px] sm:text-[12px] font-bold uppercase tracking-wider text-white/50">
            All Feedback
          </p>
          {mine.map((r) => (
            <ResponseRow
              key={r.id}
              r={r}
              areaMap={areaMap}
              bikeModelMap={bikeModelMap}
              onOpen={() => onOpenDetail(r)}
            />
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

function CustomerDetailModal({
  customer,
  responses,
  areaMap,
  bikeModelMap,
  onClose,
  onOpenDetail,
}) {
  return (
    <ModalShell title="Customer History" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[14px] p-4">
          <h4 className="text-[18px] sm:text-[17px] font-bold text-white truncate">
            {customer.name}
          </h4>
          <p className="text-[14px] sm:text-[12px] text-white/60 font-mono mt-0.5">
            {customer.mobile} · {areaMap[customer.area_id] || "—"}
          </p>
        </div>
        <div className="space-y-2.5">
          <p className="text-[14px] sm:text-[12px] font-bold uppercase tracking-wider text-white/50">
            {responses.length} previous visit
            {responses.length !== 1 ? "s" : ""}
          </p>
          {responses.map((r) => (
            <div key={r.id} className="space-y-1">
              <ResponseRow
                r={r}
                areaMap={areaMap}
                bikeModelMap={bikeModelMap}
                onOpen={() => onOpenDetail(r)}
              />
              <div className="pl-3 text-[12px] text-white/40">
                Work by:{" "}
                {(r.worker_list || []).map((w) => w.name).join(", ") || "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}
