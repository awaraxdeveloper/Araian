import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Users,
  CalendarCheck,
  Layers,
  FileSpreadsheet,
  BarChart3,
  Calculator,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Building2,
  ShieldAlert,
  UserCheck,
  History,
  CheckCircle2,
  AlertCircle,
  X,
  Menu,
  Search,
  Calendar,
  ChevronDown,
  TrendingUp,
  Wallet,
  Download,
  FileText,
  PieChart,
} from "lucide-react";

// Modernized styling tokens with native dark color-scheme calendar support
const inputBase =
  "bg-neutral-950/80 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all [color-scheme:dark]";
const inputClass = `${inputBase} w-full px-3.5 py-2.5`;
const inputIconClass = `${inputBase} w-full py-2.5 pl-10 pr-3.5`;
const selectClass = `${inputBase} w-full px-3.5 py-2.5 pr-9 appearance-none cursor-pointer`;

function SelectField({ children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export default function SingleCompanyAdmin({
  companyId,
  companyName,
  currentUser,
  onLogout,
}) {
  const isAdmin = Boolean(currentUser?.is_admin);
  const displayName = currentUser?.full_name || currentUser?.username || "User";

  const [activeTab, setActiveTab] = useState(isAdmin ? "employees" : "daily");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form & Date States
  const [empName, setEmpName] = useState("");
  const [empSalary, setEmpSalary] = useState("");
  const [editingEmpId, setEditingEmpId] = useState(null);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate());

  // Attendance & Reports
  const [dailyAttendance, setDailyAttendance] = useState({});
  const [bulkDays, setBulkDays] = useState({});
  const [bulkReports, setBulkReports] = useState([]);
  const [monthlyReports, setMonthlyReports] = useState([]);

  // Attendance History State
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState("");

  // Analytics — today's attendance snapshot
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [todayAttendanceLoading, setTodayAttendanceLoading] = useState(false);

  // Extra Calculator Logic States
  const [calcMonth, setCalcMonth] = useState(currentDate.getMonth());
  const [calcYear, setCalcYear] = useState(currentDate.getFullYear());
  const [calcSalary, setCalcSalary] = useState("");
  const [calcFull, setCalcFull] = useState(0);
  const [calcHalf, setCalcHalf] = useState(0);
  const [calcHoliday, setCalcHoliday] = useState(0);
  const [calcOvertimeHours, setCalcOvertimeHours] = useState(0);
  const [calcAdvanceDeductions, setCalcAdvanceDeductions] = useState(0);
  const [calcResult, setCalcResult] = useState(null);

  // Custom Toast & Modal States
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const makeDateStr = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const makeMonthYearStr = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  const triggerConfirm = (title, message, onConfirmFn) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirmFn();
        setConfirmModal({
          show: false,
          title: "",
          message: "",
          onConfirm: null,
        });
      },
    });
  };

  // 1. DATA ISOLATION RESET & REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!companyId) return;

    // Strict reset of all local company data to prevent data leakage across company logins
    setEmployees([]);
    setDailyAttendance({});
    setBulkDays({});
    setBulkReports([]);
    setMonthlyReports([]);
    setHistoryRecords([]);
    setTodayAttendance([]);

    fetchEmployees();

    // Supabase Realtime Subscription: Instant sync between Admin & Manager
    const channel = supabase
      .channel(`realtime_company_${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        () => {
          loadDailyAttendance();
          fetchAttendanceHistory();
          fetchTodayAttendance();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "employees",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          fetchEmployees();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bulk_attendance" },
        () => {
          loadBulkAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const fetchEmployees = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      triggerToast(`Failed to load employees: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Employee CRUD
  const closeEmployeeModal = () => {
    setEmployeeModalOpen(false);
    setEditingEmpId(null);
    setEmpName("");
    setEmpSalary("");
  };

  const openAddEmployeeModal = () => {
    setEditingEmpId(null);
    setEmpName("");
    setEmpSalary("");
    setEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = (emp) => {
    setEditingEmpId(emp.id);
    setEmpName(emp.name);
    setEmpSalary(emp.base_salary);
    setEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      triggerToast("Access denied: Admin privileges required.", "error");
      return;
    }

    if (!empName.trim() || !empSalary || Number(empSalary) < 0) {
      triggerToast("Please provide a valid name and positive salary.", "error");
      return;
    }

    try {
      if (editingEmpId) {
        const { error } = await supabase
          .from("employees")
          .update({ name: empName.trim(), base_salary: Number(empSalary) })
          .eq("id", editingEmpId)
          .eq("company_id", companyId);

        if (error) throw error;
        triggerToast("Employee updated successfully!");
      } else {
        const { error } = await supabase.from("employees").insert([
          {
            company_id: companyId,
            name: empName.trim(),
            base_salary: Number(empSalary),
          },
        ]);

        if (error) throw error;
        triggerToast("Employee added successfully!");
      }

      closeEmployeeModal();
      fetchEmployees();
    } catch (err) {
      triggerToast(err.message, "error");
    }
  };

  const handleDeleteEmployee = (id) => {
    if (!isAdmin) return;
    triggerConfirm(
      "Delete Employee Record",
      "Are you sure? This will remove all associated attendance logs permanently.",
      async () => {
        try {
          await supabase.from("attendance").delete().eq("employee_id", id);
          await supabase.from("bulk_attendance").delete().eq("employee_id", id);
          const { error } = await supabase
            .from("employees")
            .delete()
            .eq("id", id)
            .eq("company_id", companyId);
          if (error) throw error;
          triggerToast("Employee deleted successfully");
          fetchEmployees();
        } catch (err) {
          triggerToast(err.message, "error");
        }
      }
    );
  };

  // Attendance History Fetching
  const fetchAttendanceHistory = async () => {
    if (!companyId || employees.length === 0) {
      setHistoryRecords([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const empIds = employees.map((e) => e.id);
      const { data, error } = await supabase
        .from("attendance")
        .select("id, employee_id, date, status")
        .in("employee_id", empIds)
        .order("date", { ascending: false });

      if (error) throw error;
      setHistoryRecords(data || []);
    } catch (err) {
      triggerToast(`Error fetching history: ${err.message}`, "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchAttendanceHistory();
    }
  }, [activeTab, employees]);

  // Daily Attendance
  const loadDailyAttendance = async () => {
    if (!employees || employees.length === 0) {
      setDailyAttendance({});
      return;
    }
    const dateStr = makeDateStr(selectedYear, selectedMonth, selectedDay);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("employee_id, status")
        .in(
          "employee_id",
          employees.map((e) => e.id)
        )
        .eq("date", dateStr);

      if (error) throw error;
      const mapped = {};
      if (data)
        data.forEach((item) => (mapped[item.employee_id] = item.status));
      setDailyAttendance(mapped);
    } catch (err) {
      triggerToast(`Failed to load attendance: ${err.message}`, "error");
    }
  };

  useEffect(() => {
    if (activeTab === "daily") loadDailyAttendance();
  }, [activeTab, selectedMonth, selectedYear, selectedDay, employees]);

  const handleStatusChange = (empId, status) => {
    setDailyAttendance((prev) => ({ ...prev, [empId]: status }));
  };

  const saveDailyAttendance = async () => {
    if (employees.length === 0) return;
    const dateStr = makeDateStr(selectedYear, selectedMonth, selectedDay);
    try {
      const results = await Promise.all(
        employees.map((emp) =>
          supabase.from("attendance").upsert(
            {
              employee_id: emp.id,
              date: dateStr,
              status: dailyAttendance[emp.id] || "absent",
            },
            { onConflict: "employee_id,date" }
          )
        )
      );

      const failed = results.find((r) => r.error);
      if (failed) throw failed.error;

      triggerToast(`Attendance saved for ${dateStr}`);
      fetchAttendanceHistory();
      fetchTodayAttendance();
    } catch (err) {
      triggerToast(err.message, "error");
    }
  };

  // Bulk Attendance
  const loadBulkAttendance = async () => {
    if (!isAdmin || employees.length === 0) return;
    const monthYear = makeMonthYearStr(selectedYear, selectedMonth);
    try {
      const { data, error } = await supabase
        .from("bulk_attendance")
        .select("employee_id, working_days")
        .in(
          "employee_id",
          employees.map((e) => e.id)
        )
        .eq("month_year", monthYear);

      if (error) throw error;
      const mapped = {};
      if (data)
        data.forEach((item) => (mapped[item.employee_id] = item.working_days));
      setBulkDays(mapped);
    } catch (err) {
      triggerToast(`Failed to load bulk attendance: ${err.message}`, "error");
    }
  };

  useEffect(() => {
    if (activeTab === "bulk") loadBulkAttendance();
  }, [activeTab, selectedMonth, selectedYear, employees]);

  const saveBulkAttendance = async () => {
    if (!isAdmin || employees.length === 0) return;
    const monthYear = makeMonthYearStr(selectedYear, selectedMonth);
    try {
      const results = await Promise.all(
        employees.map((emp) => {
          const days = Number(bulkDays[emp.id] || 0);
          return supabase.from("bulk_attendance").upsert(
            {
              employee_id: emp.id,
              month_year: monthYear,
              working_days: days,
            },
            { onConflict: "employee_id,month_year" }
          );
        })
      );

      const failed = results.find((r) => r.error);
      if (failed) throw failed.error;

      triggerToast(
        `Bulk attendance saved for ${months[selectedMonth]} ${selectedYear}`
      );
      fetchAttendanceHistory();
      generateBulkReport();
    } catch (err) {
      triggerToast(err.message, "error");
    }
  };

  const generateBulkReport = () => {
    if (!isAdmin) return;
    const totalDays = daysInMonth(selectedYear, selectedMonth);
    const report = employees.map((emp) => {
      const work = Number(bulkDays[emp.id] || 0);
      const abs = totalDays - work;
      const daily = Number(emp.base_salary) / totalDays;
      const pay = Math.min(daily * work, Number(emp.base_salary));
      const bal = Number(emp.base_salary) - pay;
      return { ...emp, totalDays, work, abs, daily, pay, bal };
    });
    setBulkReports(report);
  };

  // Monthly Report
  const generateMonthlyReport = async () => {
    if (!isAdmin || employees.length === 0) return;
    const totalDays = daysInMonth(selectedYear, selectedMonth);
    const monthYear = makeMonthYearStr(selectedYear, selectedMonth);

    const { data: bulkData } = await supabase
      .from("bulk_attendance")
      .select("*")
      .in(
        "employee_id",
        employees.map((e) => e.id)
      )
      .eq("month_year", monthYear);

    const bulkMap = {};
    if (bulkData)
      bulkData.forEach((b) => (bulkMap[b.employee_id] = b.working_days));

    const startDate = makeDateStr(selectedYear, selectedMonth, 1);
    const endDate = makeDateStr(selectedYear, selectedMonth, totalDays);

    const { data: dailyData } = await supabase
      .from("attendance")
      .select("*")
      .in(
        "employee_id",
        employees.map((e) => e.id)
      )
      .gte("date", startDate)
      .lte("date", endDate);

    const dailyMap = {};
    if (dailyData) {
      dailyData.forEach((d) => {
        if (!dailyMap[d.employee_id]) dailyMap[d.employee_id] = [];
        dailyMap[d.employee_id].push(d);
      });
    }

    const report = employees.map((emp) => {
      if (bulkMap[emp.id] !== undefined) {
        const work = Number(bulkMap[emp.id]);
        const abs = totalDays - work;
        const daily = Number(emp.base_salary) / totalDays;
        const pay = Math.min(daily * work, Number(emp.base_salary));
        const bal = Number(emp.base_salary) - pay;
        return { ...emp, type: "bulk", totalDays, work, abs, daily, pay, bal };
      }

      const records = dailyMap[emp.id] || [];
      let full = 0,
        half = 0,
        hol = 0,
        abs = 0;

      for (let day = 1; day <= totalDays; day++) {
        const dateStr = makeDateStr(selectedYear, selectedMonth, day);
        const rec = records.find((r) => r.date === dateStr);
        const status = rec ? rec.status : "absent";

        if (status === "full") full++;
        else if (status === "half") half++;
        else if (status === "holiday") hol++;
        else abs++;
      }

      const paidHol = Math.min(hol, 4);
      const extraHol = Math.max(hol - 4, 0);
      abs += extraHol;
      const paidDays = full + half * 0.5 + paidHol;
      const dailyRate = Number(emp.base_salary) / totalDays;
      const pay = Math.min(dailyRate * paidDays, Number(emp.base_salary));
      const bal = Number(emp.base_salary) - pay;

      return {
        ...emp,
        type: "daily",
        totalDays,
        full,
        half,
        paidHol,
        extraHol,
        abs,
        paidDays,
        dailyRate,
        pay,
        bal,
      };
    });

    setMonthlyReports(report);
  };

  // 5. ENHANCED EXTRA CALCULATOR LOGIC
  const handleCalculateExtra = () => {
    const sal = Number(calcSalary);
    if (!sal || sal < 0) {
      triggerToast("Please enter a valid monthly base salary", "error");
      return;
    }

    const totalDays = daysInMonth(calcYear, calcMonth);
    const dailyRate = sal / totalDays;
    const hourlyRate = dailyRate / 8; // Assuming 8-hour workday standard

    const paidHol = Math.min(calcHoliday, 4);
    const unpaidExtraHol = Math.max(calcHoliday - 4, 0);

    const workedDaysCredit = calcFull + calcHalf * 0.5 + paidHol;
    const basePay = Math.min(dailyRate * workedDaysCredit, sal);

    const overtimePay = Number(calcOvertimeHours) * hourlyRate * 1.25; // 1.25x Overtime multiplier
    const deductions = Number(calcAdvanceDeductions);

    const netPayable = Math.max(basePay + overtimePay - deductions, 0);
    const balanceRemaining = Math.max(sal - netPayable, 0);

    setCalcResult({
      totalDays,
      dailyRate,
      hourlyRate,
      paidHol,
      unpaidExtraHol,
      workedDaysCredit,
      basePay,
      overtimePay,
      deductions,
      netPayable,
      balanceRemaining,
    });
  };

  const triggerPrint = (title, elementId) => {
    const content = document.getElementById(elementId)?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=800");
    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #111; background: #fff; }
            h2 { border-bottom: 2px solid #ef4444; padding-bottom: 8px; margin-bottom: 16px; font-size: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
            th { background-color: #f9fafb; font-weight: 700; color: #374151; }
            .badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .badge-full { background: #dcfce7; color: #15803d; }
            .badge-half { background: #fef9c3; color: #a16207; }
            .badge-holiday { background: #dbeafe; color: #1d4ed8; }
            .badge-absent { background: #fee2e2; color: #b91c1c; }
            .footer { margin-top: 30px; font-size: 11px; color: #6b7280; text-align: right; }
          </style>
        </head>
        <body>
          <div>
            <h2>${title}</h2>
            <p><strong>Generated On:</strong> ${new Date().toLocaleString()}</p>
            ${content}
            <div class="footer">Company Attendance & Payroll Record System</div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  // 2. DAILY ATTENDANCE PDF DOWNLOAD FOR HISTORY
  const downloadDailyAttendancePDF = () => {
    const filterLabel = historyDateFilter
      ? `For Date: ${historyDateFilter}`
      : "All Recorded Logs";
    const title = `${companyName} - Daily Attendance Report (${filterLabel})`;

    const win = window.open("", "_blank", "width=950,height=800");
    const formattedRows = filteredHistory
      .map((rec) => {
        const emp = employees.find((e) => e.id === rec.employee_id);
        return `
        <tr>
          <td><strong>${rec.date}</strong></td>
          <td>${emp ? emp.name : "Unknown Employee"}</td>
          <td><span class="badge badge-${rec.status}">${rec.status}</span></td>
        </tr>
      `;
      })
      .join("");

    const totalRecords = filteredHistory.length;
    const fullCount = filteredHistory.filter((r) => r.status === "full").length;
    const halfCount = filteredHistory.filter((r) => r.status === "half").length;
    const holidayCount = filteredHistory.filter(
      (r) => r.status === "holiday"
    ).length;
    const absentCount = filteredHistory.filter(
      (r) => r.status === "absent"
    ).length;

    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
            .header { border-bottom: 2px solid #dc2626; padding-bottom: 12px; margin-bottom: 20px; }
            .company { font-size: 22px; font-weight: bold; color: #0f172a; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .summary-box { display: flex; gap: 12px; margin-bottom: 20px; }
            .card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; }
            .card .num { font-size: 18px; font-weight: bold; color: #0f172a; }
            .card .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
            .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .badge-full { background: #dcfce7; color: #166534; }
            .badge-half { background: #fef9c3; color: #854d0e; }
            .badge-holiday { background: #dbeafe; color: #1e40af; }
            .badge-absent { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">${companyName}</div>
            <div class="subtitle">Daily Attendance Report • ${filterLabel}</div>
          </div>

          <div class="summary-box">
            <div class="card"><div class="num">${totalRecords}</div><div class="lbl">Total Logs</div></div>
            <div class="card"><div class="num" style="color:#166534">${fullCount}</div><div class="lbl">Full Days</div></div>
            <div class="card"><div class="num" style="color:#854d0e">${halfCount}</div><div class="lbl">Half Days</div></div>
            <div class="card"><div class="num" style="color:#1e40af">${holidayCount}</div><div class="lbl">Holidays</div></div>
            <div class="card"><div class="num" style="color:#991b1b">${absentCount}</div><div class="lbl">Absents</div></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee Name</th>
                <th>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                formattedRows.length > 0
                  ? formattedRows
                  : '<tr><td colspan="3" style="text-align:center">No records available</td></tr>'
              }
            </tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  // Analytics — today's attendance snapshot
  const fetchTodayAttendance = async () => {
    if (employees.length === 0) {
      setTodayAttendance([]);
      return;
    }
    setTodayAttendanceLoading(true);
    try {
      const todayStr = makeDateStr(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );
      const { data, error } = await supabase
        .from("attendance")
        .select("employee_id, status")
        .in(
          "employee_id",
          employees.map((e) => e.id)
        )
        .eq("date", todayStr);

      if (error) throw error;
      setTodayAttendance(data || []);
    } catch (err) {
      triggerToast(
        `Failed to load today's attendance: ${err.message}`,
        "error"
      );
    } finally {
      setTodayAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "analytics" && isAdmin) {
      fetchTodayAttendance();
    }
  }, [activeTab, employees]);

  const availableTabs = isAdmin
    ? [
        { id: "employees", label: "Employees", icon: Users },
        { id: "daily", label: "Daily Attendance", icon: CalendarCheck },
        { id: "history", label: "Attendance History", icon: History },
        { id: "bulk", label: "Bulk Attendance", icon: Layers },
        { id: "reports", label: "Salary Reports", icon: FileSpreadsheet },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "calculator", label: "Extra Calculator", icon: Calculator },
      ]
    : [
        { id: "daily", label: "Daily Attendance", icon: CalendarCheck },
        { id: "history", label: "Attendance History", icon: History },
      ];

  // History filtering logic
  const filteredHistory = historyRecords.filter((rec) => {
    const emp = employees.find((e) => e.id === rec.employee_id);
    const empNameMatch = emp
      ? emp.name.toLowerCase().includes(historySearch.toLowerCase())
      : false;
    const dateMatch = historyDateFilter ? rec.date === historyDateFilter : true;
    return empNameMatch && dateMatch;
  });

  // Analytics derived metrics
  const totalBudget = employees.reduce(
    (acc, e) => acc + Number(e.base_salary || 0),
    0
  );
  const avgSalary = employees.length > 0 ? totalBudget / employees.length : 0;
  const totalToday = employees.length;
  const presentFullToday = todayAttendance.filter(
    (r) => r.status === "full"
  ).length;
  const presentHalfToday = todayAttendance.filter(
    (r) => r.status === "half"
  ).length;
  const holidayToday = todayAttendance.filter(
    (r) => r.status === "holiday"
  ).length;
  const absentToday = todayAttendance.filter(
    (r) => r.status === "absent"
  ).length;
  const presentToday = presentFullToday + presentHalfToday + holidayToday;
  const unmarkedToday = Math.max(totalToday - todayAttendance.length, 0);
  const attendanceRate =
    totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;

  return (
    <div className="fixed inset-0 flex bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all duration-300 bg-neutral-900 border-neutral-700 text-white max-w-[90vw]">
          {toast.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          )}
          <span className="text-xs font-semibold whitespace-nowrap">
            {toast.message}
          </span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {confirmModal.title}
              </h3>
            </div>
            <p className="text-xs text-neutral-400">{confirmModal.message}</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() =>
                  setConfirmModal({
                    show: false,
                    title: "",
                    message: "",
                    onConfirm: null,
                  })
                }
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 py-2.5 rounded-xl text-xs font-bold text-neutral-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-xl text-xs font-bold text-white transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE ADD/EDIT MODAL */}
      {employeeModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingEmpId ? "Edit employee" : "Add new employee"}
              </h3>
              <button
                onClick={closeEmployeeModal}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Ahmed Raza"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">
                  Monthly base salary (Rs.)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 45000"
                  value={empSalary}
                  onChange={(e) => setEmpSalary(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEmployeeModal}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 py-2.5 rounded-xl text-xs font-bold text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {editingEmpId ? "Save changes" : "Add employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:relative z-40 h-full w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between shrink-0 transition-transform duration-300 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <Building2 className="text-red-500 w-6 h-6 shrink-0" />
              <div className="overflow-hidden">
                <h2 className="font-bold text-sm text-white truncate">
                  {companyName}
                </h2>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
                  {isAdmin ? "Admin Console" : "Manager Access"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-neutral-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-red-600 text-white shadow-lg shadow-red-950"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-red-900 text-neutral-400 hover:text-red-400 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden min-w-0">
        <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 bg-neutral-800 rounded-lg text-neutral-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider hidden sm:inline">
                Module /
              </span>
              <span className="text-sm font-extrabold text-white capitalize">
                {activeTab.replace("-", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[11px] font-bold text-red-400">
                <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Admin:{" "}
                {displayName}
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-bold text-emerald-400">
                <UserCheck className="w-3.5 h-3.5 mr-1" /> Manager:{" "}
                {displayName}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 w-full">
          {/* EMPLOYEES TAB */}
          {activeTab === "employees" && isAdmin && (
            <div className="space-y-6 w-full">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">Employees</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {employees.length} registered
                  </p>
                </div>
                <button
                  onClick={openAddEmployeeModal}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs tracking-wider uppercase flex items-center gap-2 transition-colors shadow-lg shadow-red-950/40 active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add employee</span>
                </button>
              </div>

              {loading ? (
                <p className="text-xs text-neutral-500">
                  Loading workforce records...
                </p>
              ) : employees.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center w-full">
                  <p className="text-sm text-neutral-400">
                    No employees registered for this company yet.
                  </p>
                </div>
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm text-neutral-300">
                      <thead className="bg-neutral-950/60 text-[10px] text-neutral-500 uppercase tracking-wider border-b border-neutral-800">
                        <tr>
                          <th className="p-4 font-semibold">Employee</th>
                          <th className="p-4 font-semibold">Monthly salary</th>
                          <th className="p-4 font-semibold text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {employees.map((emp) => (
                          <tr
                            key={emp.id}
                            className="hover:bg-neutral-800/40 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs shrink-0">
                                  {emp.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-white">
                                  {emp.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-emerald-400 font-semibold font-mono">
                              Rs.{" "}
                              {Number(emp.base_salary).toLocaleString("en-PK", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditEmployeeModal(emp)}
                                  className="p-2 bg-neutral-950 hover:bg-neutral-800 text-blue-400 border border-neutral-800 rounded-xl transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="p-2 bg-neutral-950 hover:bg-neutral-800 text-red-400 border border-neutral-800 rounded-xl transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DAILY ATTENDANCE TAB */}
          {activeTab === "daily" && (
            <div className="space-y-6 w-full">
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                      Month
                    </label>
                    <SelectField>
                      <select
                        value={selectedMonth}
                        onChange={(e) =>
                          setSelectedMonth(Number(e.target.value))
                        }
                        className={selectClass}
                      >
                        {months.map((m, i) => (
                          <option key={m} value={i}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </SelectField>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                      Year
                    </label>
                    <SelectField>
                      <select
                        value={selectedYear}
                        onChange={(e) =>
                          setSelectedYear(Number(e.target.value))
                        }
                        className={selectClass}
                      >
                        {[2024, 2025, 2026, 2027].map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </SelectField>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                      Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={daysInMonth(selectedYear, selectedMonth)}
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {employees.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center w-full">
                  <p className="text-sm text-neutral-400">
                    No employees found to take attendance.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
                    >
                      <div>
                        <span className="font-bold text-sm text-white block">
                          {emp.name}
                        </span>
                        {isAdmin && (
                          <span className="text-xs text-neutral-500 font-mono">
                            Rs. {Number(emp.base_salary).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:flex gap-2">
                        {["full", "half", "holiday", "absent"].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(emp.id, st)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                              dailyAttendance[emp.id] === st
                                ? "bg-red-600 border-red-500 text-white shadow-md"
                                : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={saveDailyAttendance}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-emerald-950 transition-colors mt-4 active:scale-[0.99]"
                  >
                    Save daily attendance
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ATTENDANCE HISTORY TAB */}
          {activeTab === "history" && (
            <div className="space-y-6 w-full">
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4 w-full">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                        Search Employee
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder="Type employee name..."
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          className={inputIconClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                        Filter By Date
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                        <input
                          type="date"
                          value={historyDateFilter}
                          onChange={(e) => setHistoryDateFilter(e.target.value)}
                          className={inputIconClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto pt-2 sm:pt-4">
                    <button
                      onClick={downloadDailyAttendancePDF}
                      className="w-full sm:w-auto bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shrink-0"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      <span>Daily Attendance PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {historyLoading ? (
                <p className="text-xs text-neutral-500">
                  Fetching attendance logs...
                </p>
              ) : filteredHistory.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center w-full">
                  <p className="text-sm text-neutral-400">
                    No attendance history records found matching your query.
                  </p>
                </div>
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs text-neutral-300">
                      <thead className="bg-neutral-950 uppercase text-[10px] text-neutral-500 tracking-wider border-b border-neutral-800">
                        <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Employee Name</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {filteredHistory.map((rec) => {
                          const emp = employees.find(
                            (e) => e.id === rec.employee_id
                          );
                          return (
                            <tr
                              key={rec.id}
                              className="hover:bg-neutral-800/50 transition-colors"
                            >
                              <td className="p-4 font-mono text-white">
                                {rec.date}
                              </td>
                              <td className="p-4 font-bold text-white">
                                {emp ? emp.name : "Unknown"}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    rec.status === "full"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : rec.status === "half"
                                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                      : rec.status === "holiday"
                                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                                  }`}
                                >
                                  {rec.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BULK ATTENDANCE TAB */}
          {activeTab === "bulk" && isAdmin && (
            <div className="space-y-6 w-full">
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col sm:flex-row gap-4 w-full">
                <SelectField className="flex-1">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className={selectClass}
                  >
                    {months.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </SelectField>
                <SelectField className="flex-1">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className={selectClass}
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </SelectField>
              </div>

              {employees.length === 0 ? (
                <p className="text-xs text-neutral-500">
                  No employees available for bulk attendance.
                </p>
              ) : (
                <div className="space-y-3 w-full">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex items-center justify-between hover:border-neutral-700 transition-colors"
                    >
                      <div>
                        <span className="font-bold text-sm text-white block">
                          {emp.name}
                        </span>
                        <span className="text-xs text-neutral-500 font-mono">
                          Rs. {Number(emp.base_salary).toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={daysInMonth(selectedYear, selectedMonth)}
                        value={bulkDays[emp.id] || ""}
                        onChange={(e) =>
                          setBulkDays({ ...bulkDays, [emp.id]: e.target.value })
                        }
                        placeholder="Working days"
                        className={`${inputBase} p-2.5 text-center w-36`}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      onClick={saveBulkAttendance}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-3.5 rounded-xl font-bold text-xs uppercase text-white shadow-lg transition-colors active:scale-[0.99]"
                    >
                      Save bulk attendance
                    </button>
                    <button
                      onClick={generateBulkReport}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-3.5 rounded-xl font-bold text-xs uppercase text-white shadow-lg transition-colors active:scale-[0.99]"
                    >
                      Generate bulk report
                    </button>
                  </div>
                </div>
              )}

              {bulkReports.length > 0 && (
                <div
                  id="bulkPrintArea"
                  className="space-y-4 border-t border-neutral-800 pt-6 w-full"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-base text-white">
                      Bulk Payroll Summary
                    </h3>
                    <button
                      onClick={() =>
                        triggerPrint(
                          `${companyName} - Bulk Report`,
                          "bulkPrintArea"
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center space-x-2 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print report</span>
                    </button>
                  </div>
                  {bulkReports.map((r) => (
                    <div
                      key={r.id}
                      className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-2 text-xs text-neutral-300"
                    >
                      <h4 className="font-bold text-base text-red-500">
                        {r.name}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                        <div>
                          <span className="text-neutral-500 block">
                            Base Salary
                          </span>
                          <span className="font-mono text-white">
                            Rs. {Number(r.base_salary).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">
                            Days / Worked
                          </span>
                          <span className="text-white">
                            {r.totalDays} Total / {r.work} Work
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">
                            Total Pay
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            Rs. {r.pay.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">
                            Balance
                          </span>
                          <span className="font-mono font-bold text-yellow-500">
                            Rs. {r.bal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. SALARY REPORTS TAB — PERFECT ALIGNMENT & STRUCTURE */}
          {activeTab === "reports" && isAdmin && (
            <div className="space-y-6 w-full">
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col sm:flex-row gap-4 w-full">
                <SelectField className="flex-1">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className={selectClass}
                  >
                    {months.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </SelectField>
                <SelectField className="flex-1">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className={selectClass}
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </SelectField>
                <button
                  onClick={generateMonthlyReport}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold text-xs uppercase text-white shadow-lg transition-colors active:scale-[0.99]"
                >
                  Generate report
                </button>
              </div>

              {monthlyReports.length > 0 && (
                <div id="monthlyPrintArea" className="space-y-6 w-full">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        {months[selectedMonth]} {selectedYear} Payroll Report
                      </h3>
                      <p className="text-xs text-neutral-500">{companyName}</p>
                    </div>
                    <button
                      onClick={() =>
                        triggerPrint(
                          `${companyName} - ${months[selectedMonth]} Payroll Report`,
                          "monthlyPrintArea"
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print / Save PDF</span>
                    </button>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden w-full">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs text-neutral-300">
                        <thead className="bg-neutral-950 uppercase text-[10px] text-neutral-400 tracking-wider border-b border-neutral-800">
                          <tr>
                            <th className="p-4">Employee</th>
                            <th className="p-4 text-right">Base Salary</th>
                            <th className="p-4 text-center">
                              Days (F/H/Hol/Abs)
                            </th>
                            <th className="p-4 text-right">Paid Days</th>
                            <th className="p-4 text-right">Net Payable</th>
                            <th className="p-4 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                          {monthlyReports.map((r) => (
                            <tr
                              key={r.id}
                              className="hover:bg-neutral-800/40 transition-colors"
                            >
                              <td className="p-4 font-bold text-white">
                                {r.name}
                              </td>
                              <td className="p-4 text-right font-mono text-neutral-300">
                                Rs.{" "}
                                {Number(r.base_salary).toLocaleString("en-PK", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="p-4 text-center">
                                {r.type === "daily" ? (
                                  <span className="inline-flex gap-1">
                                    <span className="text-emerald-400 font-semibold">
                                      {r.full}F
                                    </span>{" "}
                                    /
                                    <span className="text-yellow-400 font-semibold">
                                      {r.half}H
                                    </span>{" "}
                                    /
                                    <span className="text-blue-400 font-semibold">
                                      {r.paidHol}Hol
                                    </span>{" "}
                                    /
                                    <span className="text-red-400 font-semibold">
                                      {r.abs}A
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-blue-400 font-semibold">
                                    {r.work} Days (Bulk)
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right font-semibold text-white">
                                {r.type === "daily" ? r.paidDays : r.work} /{" "}
                                {r.totalDays}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-emerald-400">
                                Rs.{" "}
                                {r.pay.toLocaleString("en-PK", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-yellow-500">
                                Rs.{" "}
                                {r.bal.toLocaleString("en-PK", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. ANALYTICS TAB — WORKING INTERACTIVE GRAPH */}
          {activeTab === "analytics" && isAdmin && (
            <div className="space-y-6 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl hover:border-neutral-700 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Workforce
                    </span>
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-2xl font-extrabold text-white block">
                    {employees.length}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    active employees
                  </span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl hover:border-neutral-700 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Avg. salary
                    </span>
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-2xl font-extrabold text-white block font-mono">
                    Rs.{" "}
                    {avgSalary.toLocaleString("en-PK", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    per employee / month
                  </span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl hover:border-neutral-700 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Monthly budget
                    </span>
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-2xl font-extrabold text-emerald-400 block font-mono">
                    Rs. {totalBudget.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    combined base salaries
                  </span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl hover:border-neutral-700 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Today's attendance
                    </span>
                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-2xl font-extrabold text-white block">
                    {attendanceRate}%
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {todayAttendanceLoading
                      ? "loading…"
                      : `${presentToday} present · ${absentToday} absent`}
                  </span>
                </div>
              </div>

              {/* DYNAMIC SVG ATTENDANCE BREAKDOWN GRAPH */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-red-500" />
                      <span>Today's Attendance Status Chart</span>
                    </h4>
                    <span className="text-xs text-neutral-500">
                      {months[currentDate.getMonth()]} {currentDate.getDate()},{" "}
                      {currentDate.getFullYear()}
                    </span>
                  </div>

                  <div className="h-48 w-full flex items-end justify-around pt-6 pb-2 px-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
                    {/* Full Day Bar */}
                    <div className="flex flex-col items-center gap-2 h-full justify-end w-12">
                      <span className="text-xs font-bold text-emerald-400">
                        {presentFullToday}
                      </span>
                      <div
                        className="w-full bg-emerald-500 rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${
                            totalToday > 0
                              ? (presentFullToday / totalToday) * 100
                              : 0
                          }%`,
                          minHeight: presentFullToday > 0 ? "12px" : "4px",
                        }}
                      />
                      <span className="text-[10px] font-semibold text-neutral-400">
                        Full
                      </span>
                    </div>

                    {/* Half Day Bar */}
                    <div className="flex flex-col items-center gap-2 h-full justify-end w-12">
                      <span className="text-xs font-bold text-yellow-400">
                        {presentHalfToday}
                      </span>
                      <div
                        className="w-full bg-yellow-500 rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${
                            totalToday > 0
                              ? (presentHalfToday / totalToday) * 100
                              : 0
                          }%`,
                          minHeight: presentHalfToday > 0 ? "12px" : "4px",
                        }}
                      />
                      <span className="text-[10px] font-semibold text-neutral-400">
                        Half
                      </span>
                    </div>

                    {/* Holiday Bar */}
                    <div className="flex flex-col items-center gap-2 h-full justify-end w-12">
                      <span className="text-xs font-bold text-blue-400">
                        {holidayToday}
                      </span>
                      <div
                        className="w-full bg-blue-500 rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${
                            totalToday > 0
                              ? (holidayToday / totalToday) * 100
                              : 0
                          }%`,
                          minHeight: holidayToday > 0 ? "12px" : "4px",
                        }}
                      />
                      <span className="text-[10px] font-semibold text-neutral-400">
                        Holiday
                      </span>
                    </div>

                    {/* Absent Bar */}
                    <div className="flex flex-col items-center gap-2 h-full justify-end w-12">
                      <span className="text-xs font-bold text-red-400">
                        {absentToday}
                      </span>
                      <div
                        className="w-full bg-red-500 rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${
                            totalToday > 0
                              ? (absentToday / totalToday) * 100
                              : 0
                          }%`,
                          minHeight: absentToday > 0 ? "12px" : "4px",
                        }}
                      />
                      <span className="text-[10px] font-semibold text-neutral-400">
                        Absent
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-500" />
                    <span>Ratio Breakdown</span>
                  </h4>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-emerald-400">Present Rate</span>
                        <span className="text-white">{attendanceRate}%</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${attendanceRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-red-400">Absent Rate</span>
                        <span className="text-white">
                          {totalToday > 0
                            ? Math.round((absentToday / totalToday) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className="h-full bg-red-500 transition-all duration-500"
                          style={{
                            width: `${
                              totalToday > 0
                                ? (absentToday / totalToday) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-neutral-400">Unmarked</span>
                        <span className="text-white">
                          {totalToday > 0
                            ? Math.round((unmarkedToday / totalToday) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className="h-full bg-neutral-700 transition-all duration-500"
                          style={{
                            width: `${
                              totalToday > 0
                                ? (unmarkedToday / totalToday) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. EXTRA CALCULATOR TAB — LOGICAL & COMPLETE */}
          {activeTab === "calculator" && isAdmin && (
            <div className="w-full bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-5">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="font-bold text-sm text-red-500 uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>Salary & Overtime Extra Calculator</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Calculate worked days credit, daily rates, overtime, and
                  deductions logically.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                    Month
                  </label>
                  <SelectField>
                    <select
                      value={calcMonth}
                      onChange={(e) => setCalcMonth(Number(e.target.value))}
                      className={selectClass}
                    >
                      {months.map((m, i) => (
                        <option key={m} value={i}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </SelectField>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                    Year
                  </label>
                  <SelectField>
                    <select
                      value={calcYear}
                      onChange={(e) => setCalcYear(Number(e.target.value))}
                      className={selectClass}
                    >
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </SelectField>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                    Monthly Base Salary (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={calcSalary}
                    onChange={(e) => setCalcSalary(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                    Full Days Worked
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Full Days"
                    value={calcFull}
                    onChange={(e) => setCalcFull(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                    Half Days Worked
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Half Days"
                    value={calcHalf}
                    onChange={(e) => setCalcHalf(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                    Holidays
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Holidays"
                    value={calcHoliday}
                    onChange={(e) => setCalcHoliday(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                    Overtime Hours (1.25x Rate)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10 hours"
                    value={calcOvertimeHours}
                    onChange={(e) => setCalcOvertimeHours(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase mb-1 block">
                    Advance / Deductions (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 2000"
                    value={calcAdvanceDeductions}
                    onChange={(e) => setCalcAdvanceDeductions(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateExtra}
                className="w-full bg-red-600 hover:bg-red-700 py-3.5 rounded-xl font-bold text-xs text-white uppercase tracking-wider transition-colors active:scale-[0.99] shadow-lg shadow-red-950/50"
              >
                Calculate Payroll Breakdown
              </button>

              {calcResult && (
                <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-3 text-xs text-neutral-300 animate-in fade-in">
                  <h4 className="font-bold text-sm text-white border-b border-neutral-800 pb-2">
                    Calculation Results ({months[calcMonth]} {calcYear})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-neutral-500 block">
                        Days in Month:
                      </span>
                      <span className="font-semibold text-white">
                        {calcResult.totalDays} Days
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">
                        Daily Rate:
                      </span>
                      <span className="font-mono text-emerald-400">
                        Rs. {calcResult.dailyRate.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">
                        Worked Days Credit:
                      </span>
                      <span className="font-semibold text-white">
                        {calcResult.workedDaysCredit} Days
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-neutral-800/80 pt-3">
                    <div>
                      <span className="text-neutral-500 block">
                        Paid Holidays (Capped at 4):
                      </span>
                      <span className="text-blue-400 font-semibold">
                        {calcResult.paidHol} Paid ({calcResult.unpaidExtraHol}{" "}
                        Unpaid)
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">
                        Overtime Bonus:
                      </span>
                      <span className="font-mono text-emerald-400">
                        + Rs. {calcResult.overtimePay.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">
                        Advance Deductions:
                      </span>
                      <span className="font-mono text-red-400">
                        - Rs. {calcResult.deductions.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-900 p-4 rounded-xl border border-neutral-800 gap-2 pt-2">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">
                        Net Calculated Payable
                      </span>
                      <span className="text-xl font-bold font-mono text-emerald-400">
                        Rs. {calcResult.netPayable.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">
                        Remaining Unpaid Balance
                      </span>
                      <span className="text-lg font-bold font-mono text-yellow-500">
                        Rs. {calcResult.balanceRemaining.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
