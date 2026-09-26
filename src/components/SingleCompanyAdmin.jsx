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
  ChevronRight,
  TrendingUp,
  Wallet,
  Download,
  FileText,
  PieChart,
  User,
  UserPlus,
  Phone,
  MapPin,
  CreditCard,
  Briefcase,
  DollarSign,
  ArrowLeft,
  ChevronLeft,
  MessageSquare,
} from "lucide-react";
import CustomMonthPicker from "./ui/CustomMonthPicker";
import CustomYearPicker from "./ui/CustomYearPicker";
import CustomDayPicker from "./ui/CustomDayPicker";
import CustomDatePicker from "./ui/CustomDatePicker";
import CustomSelect from "./ui/CustomSelect";
import CustomTimePicker from "./ui/CustomTimePicker";
import FeedbackFlow from "../feedback/FeedbackFlow";
import FeedbackAdminDashboard from "../feedback/FeedbackAdminDashboard";

// Modernized styling tokens with iOS-dark palette
const inputBase =
  "bg-white/[0.03] border border-white/[0.08] rounded-[10px] text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 transition-all";
const inputClass = `${inputBase} w-full px-3.5 py-2.5`;
const inputIconClass = `${inputBase} w-full py-2.5 pl-10 pr-3.5`;
const selectClass = `${inputBase} w-full px-3.5 py-2.5 pr-9 appearance-none cursor-pointer`;

function SelectField({ children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <ChevronDown className="w-4 h-4 text-white/40 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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

  const userInitials = (() => {
    const name = (displayName || "").trim();
    if (!name) return "U";
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  })();

  const [activeTab, setActiveTab] = useState(isAdmin ? "employees" : "daily");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Mobile navigation: "home" | "attendanceMenu" | "feedbackMenu" | "section"
  const [mobileScreen, setMobileScreen] = useState("home");

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
  const [dailyStatus, setDailyStatus] = useState({});
  const [dailyCheckIn, setDailyCheckIn] = useState({});
  const [bulkDays, setBulkDays] = useState({});
  const [bulkReports, setBulkReports] = useState([]);
  const [monthlyReports, setMonthlyReports] = useState([]);

  // Attendance History
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [expandedHistoryEmp, setExpandedHistoryEmp] = useState(null);

  // Analytics
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [todayAttendanceLoading, setTodayAttendanceLoading] = useState(false);

  // Manager lock state
  const [isLocked, setIsLocked] = useState(false);

  // Admin toggle: allow managers to pick any date/month/year
  const [managersCanPickDates, setManagersCanPickDates] = useState(false);

  // Extra Calculator
  const [calcMonth, setCalcMonth] = useState(currentDate.getMonth());
  const [calcYear, setCalcYear] = useState(currentDate.getFullYear());
  const [calcSalary, setCalcSalary] = useState("");
  const [calcFull, setCalcFull] = useState(0);
  const [calcHalf, setCalcHalf] = useState(0);
  const [calcHoliday, setCalcHoliday] = useState(0);
  const [calcOvertimeHours, setCalcOvertimeHours] = useState(0);
  const [calcAdvanceDeductions, setCalcAdvanceDeductions] = useState(0);
  const [calcResult, setCalcResult] = useState(null);

  // Employee form extra fields
  const [empFatherName, setEmpFatherName] = useState("");
  const [empCnic, setEmpCnic] = useState("");
  const [empFatherCnic, setEmpFatherCnic] = useState("");
  const [empAddress, setEmpAddress] = useState("");
  const [empMobile, setEmpMobile] = useState("");
  const [empEmergencyContact, setEmpEmergencyContact] = useState("");
  const [empDateOfJoining, setEmpDateOfJoining] = useState("");
  const [empReference, setEmpReference] = useState("");
  const [empStartingSalary, setEmpStartingSalary] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const openEmployeeProfile = (emp) => {
    setSelectedEmployee(emp);
    setProfileModalOpen(true);
  };

  const closeEmployeeProfile = () => {
    setProfileModalOpen(false);
    setSelectedEmployee(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not provided";
    const parts = String(dateStr).split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts.map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Toast & Modal
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
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3500);
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

  // Feedback access
  const feedbackRole = currentUser?.feedback_role || null;
  const hasFeedbackAccess =
    feedbackRole === "staff" || feedbackRole === "admin";

  // ---------- DATA ISOLATION RESET & REALTIME ----------
  useEffect(() => {
    if (!companyId) return;
    setEmployees([]);
    setDailyStatus({});
    setDailyCheckIn({});
    setBulkDays({});
    setBulkReports([]);
    setMonthlyReports([]);
    setHistoryRecords([]);
    setTodayAttendance([]);
    setIsLocked(false);

    fetchEmployees();

    supabase
      .from("companies")
      .select("managers_can_pick_dates")
      .eq("id", companyId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("[toggle load] error:", error);
        } else {
          setManagersCanPickDates(!!data?.managers_can_pick_dates);
        }
      });

    const channel = supabase
      .channel(`realtime_company_${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `company_id=eq.${companyId}`,
        },
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
        () => fetchEmployees()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bulk_attendance",
          filter: `company_id=eq.${companyId}`,
        },
        () => loadBulkAttendance()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "companies",
          filter: `id=eq.${companyId}`,
        },
        (payload) => {
          if (payload.new) {
            setManagersCanPickDates(!!payload.new.managers_can_pick_dates);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [companyId]);

  const fetchEmployees = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", companyId)
        .order("base_salary", { ascending: false });
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      triggerToast(`Failed to load employees: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const onlyDigits = (str) => str.replace(/\D/g, "");
  const handleCnicChange = (setter, value) => {
    const digits = onlyDigits(value);
    if (digits.length <= 13) setter(digits);
  };
  const handleNumberChange = (setter, value) => {
    const digits = onlyDigits(value);
    setter(digits);
  };
  const handleNameChange = (value) => {
    setEmpName(value.toUpperCase());
  };

  // Employee CRUD
  const closeEmployeeModal = () => {
    setEmployeeModalOpen(false);
    setEditingEmpId(null);
    setEmpName("");
    setEmpSalary("");
    setEmpFatherName("");
    setEmpCnic("");
    setEmpFatherCnic("");
    setEmpAddress("");
    setEmpMobile("");
    setEmpEmergencyContact("");
    setEmpDateOfJoining("");
    setEmpReference("");
    setEmpStartingSalary("");
  };

  const openAddEmployeeModal = () => {
    setEditingEmpId(null);
    setEmpName("");
    setEmpSalary("");
    setEmpFatherName("");
    setEmpCnic("");
    setEmpFatherCnic("");
    setEmpAddress("");
    setEmpMobile("");
    setEmpEmergencyContact("");
    setEmpDateOfJoining("");
    setEmpReference("");
    setEmpStartingSalary("");
    setEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = (emp) => {
    setEditingEmpId(emp.id);
    setEmpName(emp.name);
    setEmpSalary(emp.base_salary);
    setEmpFatherName(emp.father_name || "");
    setEmpCnic(emp.cnic || "");
    setEmpFatherCnic(emp.father_cnic || "");
    setEmpAddress(emp.address || "");
    setEmpMobile(emp.mobile || "");
    setEmpEmergencyContact(emp.emergency_contact || "");
    setEmpDateOfJoining(emp.date_of_joining || "");
    setEmpReference(emp.reference || "");
    setEmpStartingSalary(emp.starting_salary || "");
    setEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      triggerToast("Access denied: Admin privileges required.", "error");
      return;
    }

    if (!empName.trim() || !empSalary || Number(empSalary) < 0) {
      triggerToast(
        "Please provide a valid name and positive current salary.",
        "error"
      );
      return;
    }

    if (empCnic && empCnic.length !== 13) {
      triggerToast("CNIC must be exactly 13 digits.", "error");
      return;
    }
    if (empFatherCnic && empFatherCnic.length !== 13) {
      triggerToast("Father's CNIC must be exactly 13 digits.", "error");
      return;
    }

    try {
      const employeeData = {
        name: empName.trim().toUpperCase(),
        base_salary: Number(empSalary),
        father_name: empFatherName.trim() || null,
        cnic: empCnic || null,
        father_cnic: empFatherCnic || null,
        address: empAddress.trim() || null,
        mobile: empMobile || null,
        emergency_contact: empEmergencyContact || null,
        date_of_joining: empDateOfJoining || null,
        reference: empReference.trim() || null,
        starting_salary: empStartingSalary ? Number(empStartingSalary) : null,
      };

      if (editingEmpId) {
        const { error } = await supabase
          .from("employees")
          .update(employeeData)
          .eq("id", editingEmpId)
          .eq("company_id", companyId);
        if (error) throw error;
        triggerToast("Employee updated successfully!");
      } else {
        const { error } = await supabase
          .from("employees")
          .insert([{ ...employeeData, company_id: companyId }]);
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
          await supabase
            .from("attendance")
            .delete()
            .eq("employee_id", id)
            .eq("company_id", companyId);
          await supabase
            .from("bulk_attendance")
            .delete()
            .eq("employee_id", id)
            .eq("company_id", companyId);
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

  const handleToggleEmployeeActive = async (emp) => {
    if (!isAdmin) return;
    const next = !emp.is_active;
    const { error } = await supabase
      .from("employees")
      .update({ is_active: next })
      .eq("id", emp.id)
      .eq("company_id", companyId);
    if (error) {
      triggerToast(`Failed to update status: ${error.message}`, "error");
      return;
    }
    triggerToast(
      next
        ? `${emp.name} is now active.`
        : `${emp.name} is now inactive — removed from today's and future attendance.`,
      next ? "success" : "error"
    );
    fetchEmployees();
  };

  // Attendance History
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
        .select("id, employee_id, date, status, check_in_time")
        .in("employee_id", empIds)
        .eq("company_id", companyId)
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
    if (activeTab === "history") fetchAttendanceHistory();
  }, [activeTab, employees]);

  useEffect(() => {
    setExpandedHistoryEmp(null);
  }, [historySearch, historyDateFilter]);

  // Daily Attendance
  const loadDailyAttendance = async () => {
    if (!employees || employees.length === 0) {
      setDailyStatus({});
      setDailyCheckIn({});
      return;
    }

    const canPickDate = isAdmin || managersCanPickDates;
    const dateStr = canPickDate
      ? makeDateStr(selectedYear, selectedMonth, selectedDay)
      : makeDateStr(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        );

    const empIds = employees.map((e) => e.id);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("employee_id, status, check_in_time")
        .in("employee_id", empIds)
        .eq("date", dateStr)
        .eq("company_id", companyId);

      if (error) throw error;

      const statusMap = {};
      const checkInMap = {};
      if (data) {
        data.forEach((item) => {
          statusMap[item.employee_id] = item.status;
          checkInMap[item.employee_id] = item.check_in_time || "";
        });
      }
      setDailyStatus(statusMap);
      setDailyCheckIn(checkInMap);
      setIsLocked(false);
    } catch (err) {
      triggerToast(`Failed to load attendance: ${err.message}`, "error");
    }
  };

  useEffect(() => {
    if (activeTab === "daily") loadDailyAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    selectedMonth,
    selectedYear,
    selectedDay,
    employees,
    managersCanPickDates,
  ]);

  const handleStatusChange = (empId, status) => {
    if (isLocked) return;
    setDailyStatus((prev) => ({ ...prev, [empId]: status }));
  };

  const saveDailyAttendance = async () => {
    if (employees.length === 0) return;

    const canPickDate = isAdmin || managersCanPickDates;
    const dateStr = canPickDate
      ? makeDateStr(selectedYear, selectedMonth, selectedDay)
      : makeDateStr(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        );

    if (!isAdmin && !managersCanPickDates) {
      const todayStr = makeDateStr(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );
      if (dateStr !== todayStr) {
        triggerToast("Managers can only mark attendance for today.", "error");
        return;
      }
    }

    try {
      const promises = employees.map(async (emp) => {
        const status = dailyStatus[emp.id] || "absent";
        const checkIn = dailyCheckIn[emp.id] || null;

        const { data: existing, error: findError } = await supabase
          .from("attendance")
          .select("id")
          .eq("employee_id", emp.id)
          .eq("date", dateStr)
          .eq("company_id", companyId)
          .maybeSingle();

        if (findError) throw findError;

        if (existing) {
          const { error } = await supabase
            .from("attendance")
            .update({ status, check_in_time: checkIn })
            .eq("id", existing.id)
            .eq("company_id", companyId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("attendance").insert({
            employee_id: emp.id,
            date: dateStr,
            status,
            check_in_time: checkIn,
            company_id: companyId,
          });
          if (error) throw error;
        }
      });

      await Promise.all(promises);
      setIsLocked(false);

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
        .eq("month_year", monthYear)
        .eq("company_id", companyId);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedMonth, selectedYear, employees]);

  const saveBulkAttendance = async () => {
    if (!isAdmin || employees.length === 0) return;
    const monthYear = makeMonthYearStr(selectedYear, selectedMonth);
    try {
      const promises = employees
        .filter((e) => e.is_active)
        .map(async (emp) => {
          const days = Number(bulkDays[emp.id] || 0);
          const { data: existing, error: findError } = await supabase
            .from("bulk_attendance")
            .select("id")
            .eq("employee_id", emp.id)
            .eq("month_year", monthYear)
            .eq("company_id", companyId)
            .maybeSingle();
          if (findError) throw findError;
          if (existing) {
            const { error } = await supabase
              .from("bulk_attendance")
              .update({ working_days: days })
              .eq("id", existing.id)
              .eq("company_id", companyId);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("bulk_attendance").insert({
              employee_id: emp.id,
              month_year: monthYear,
              working_days: days,
              company_id: companyId,
            });
            if (error) throw error;
          }
        });
      await Promise.all(promises);
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
    const report = employees
      .filter((e) => e.is_active)
      .map((emp) => {
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
      .eq("month_year", monthYear)
      .eq("company_id", companyId);

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
      .lte("date", endDate)
      .eq("company_id", companyId);

    const dailyMap = {};
    if (dailyData) {
      dailyData.forEach((d) => {
        if (!dailyMap[d.employee_id]) dailyMap[d.employee_id] = [];
        dailyMap[d.employee_id].push(d);
      });
    }

    const report = employees
      .filter((e) => e.is_active)
      .map((emp) => {
        if (bulkMap[emp.id] !== undefined) {
          const work = Number(bulkMap[emp.id]);
          const abs = totalDays - work;
          const daily = Number(emp.base_salary) / totalDays;
          const pay = Math.min(daily * work, Number(emp.base_salary));
          const bal = Number(emp.base_salary) - pay;
          return {
            ...emp,
            type: "bulk",
            totalDays,
            work,
            abs,
            daily,
            pay,
            bal,
          };
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

    const sorted = [...report].sort(
      (a, b) => Number(b.base_salary) - Number(a.base_salary)
    );
    setMonthlyReports(sorted);
  };

  // Extra Calculator
  const handleCalculateExtra = () => {
    const sal = Number(calcSalary);
    if (!sal || sal < 0) {
      triggerToast("Please enter a valid monthly base salary", "error");
      return;
    }
    const totalDays = daysInMonth(calcYear, calcMonth);
    const dailyRate = sal / totalDays;
    const hourlyRate = dailyRate / 8;
    const paidHol = Math.min(calcHoliday, 4);
    const unpaidExtraHol = Math.max(calcHoliday - 4, 0);
    const workedDaysCredit = calcFull + calcHalf * 0.5 + paidHol;
    const basePay = Math.min(dailyRate * workedDaysCredit, sal);
    const overtimePay = Number(calcOvertimeHours) * hourlyRate * 1.25;
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

  // Print helpers
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
            h2 { border-bottom: 2px solid #7c5cff; padding-bottom: 8px; margin-bottom: 16px; font-size: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
            th { background-color: #f9fafb; font-weight: 700; color: #374151; }
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

  const downloadDailyAttendancePDF = () => {
    const now = new Date();
    const todayStr = makeDateStr(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const baseRecords = historyDateFilter
      ? filteredHistory
      : filteredHistory.filter((rec) => rec.date === todayStr);

    const sortedBySalary = [...baseRecords].sort((a, b) => {
      const ea = employees.find((e) => e.id === a.employee_id);
      const eb = employees.find((e) => e.id === b.employee_id);
      const sa = Number(ea?.base_salary || 0);
      const sb = Number(eb?.base_salary || 0);
      if (sb !== sa) return sb - sa;
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });

    const distinctDates = Array.from(
      new Set(sortedBySalary.map((r) => r.date))
    ).sort();
    let dateLabel;
    if (distinctDates.length === 0) {
      dateLabel = `Report Date: ${formatDate(todayStr)}`;
    } else if (distinctDates.length === 1) {
      dateLabel = `Report Date: ${formatDate(distinctDates[0])}`;
    } else {
      dateLabel = `From ${formatDate(distinctDates[0])} to ${formatDate(
        distinctDates[distinctDates.length - 1]
      )}`;
    }

    const title = `${companyName} - Daily Attendance Report`;

    const formattedRows = sortedBySalary
      .map((rec, idx) => {
        const emp = employees.find((e) => e.id === rec.employee_id);
        return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${rec.date}</strong></td>
          <td>${emp ? emp.name : "Unknown Employee"}</td>
          <td><span class="badge badge-${rec.status}">${rec.status}</span></td>
          <td>${rec.check_in_time || "—"}</td>
        </tr>
      `;
      })
      .join("");

    const totalRecords = sortedBySalary.length;
    const fullCount = sortedBySalary.filter((r) => r.status === "full").length;
    const halfCount = sortedBySalary.filter((r) => r.status === "half").length;
    const holidayCount = sortedBySalary.filter(
      (r) => r.status === "holiday"
    ).length;
    const absentCount = sortedBySalary.filter(
      (r) => r.status === "absent"
    ).length;

    const win = window.open("", "_blank", "width=950,height=800");
    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
            .header { border-bottom: 2px solid #7c5cff; padding-bottom: 12px; margin-bottom: 20px; }
            .company { font-size: 22px; font-weight: bold; color: #0f172a; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .date-label { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 8px; }
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
            <div class="subtitle">Daily Attendance Report</div>
            <div class="date-label">${dateLabel}</div>
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
                <th style="width:44px">#</th>
                <th>Date</th>
                <th>Employee Name</th>
                <th>Attendance Status</th>
                <th>Check‑in Time</th>
              </tr>
            </thead>
            <tbody>
              ${
                formattedRows.length > 0
                  ? formattedRows
                  : '<tr><td colspan="5" style="text-align:center">No records available</td></tr>'
              }
            </tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  // Analytics
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
      const empIds = employees.map((e) => e.id);
      const { data, error } = await supabase
        .from("attendance")
        .select("employee_id, status")
        .in("employee_id", empIds)
        .eq("date", todayStr)
        .eq("company_id", companyId);
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
    if (activeTab === "analytics" && isAdmin) fetchTodayAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, employees]);

  // Tabs
  const baseTabs = isAdmin
    ? [
        { id: "employees", label: "Employees", icon: Users },
        { id: "daily", label: "Daily Attendance", icon: CalendarCheck },
        { id: "history", label: "Attendance History", icon: History },
        { id: "bulk", label: "Bulk Attendance", icon: Layers, disabled: true },
        { id: "reports", label: "Salary Reports", icon: FileSpreadsheet },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "calculator", label: "Extra Calculator", icon: Calculator },
      ]
    : [
        { id: "daily", label: "Daily Attendance", icon: CalendarCheck },
        { id: "history", label: "Attendance History", icon: History },
      ];

  const feedbackTabIds = ["feedback", "feedback-admin"];

  const availableTabs = (() => {
    if (!hasFeedbackAccess) return baseTabs;
    if (feedbackRole === "admin") {
      return [
        ...baseTabs,
        { id: "feedback-admin", label: "Feedback Dashboard", icon: BarChart3 },
      ];
    }
    return [
      ...baseTabs,
      { id: "feedback", label: "Feedback", icon: MessageSquare },
    ];
  })();

  const attendanceTabs = availableTabs.filter(
    (t) => !feedbackTabIds.includes(t.id)
  );
  const feedbackTabsList = availableTabs.filter((t) =>
    feedbackTabIds.includes(t.id)
  );

  const goToTab = (tabId) => {
    setActiveTab(tabId);
    setMobileScreen("section");
  };

  const handleAttendanceTap = () => {
    if (attendanceTabs.length === 1) goToTab(attendanceTabs[0].id);
    else setMobileScreen("attendanceMenu");
  };

  const handleFeedbackTap = () => {
    if (feedbackTabsList.length === 1) goToTab(feedbackTabsList[0].id);
    else setMobileScreen("feedbackMenu");
  };

  const handleMobileBack = () => {
    if (mobileScreen === "section") {
      if (feedbackTabIds.includes(activeTab)) setMobileScreen("feedbackMenu");
      else setMobileScreen("attendanceMenu");
    } else {
      setMobileScreen("home");
    }
  };

  // Toggle managers date access
  const toggleManagersCanPickDates = async () => {
    if (!isAdmin) return;
    const next = !managersCanPickDates;
    setManagersCanPickDates(next);
    const { error } = await supabase
      .from("companies")
      .update({ managers_can_pick_dates: next })
      .eq("id", companyId);
    if (error) {
      console.error("[toggle save] error:", error);
      setManagersCanPickDates(!next);
      triggerToast(`Failed to update setting: ${error.message}`, "error");
    } else {
      triggerToast(
        next
          ? "Managers can now pick any date for attendance."
          : "Managers restricted to today only."
      );
    }
  };

  const filteredHistory = historyRecords.filter((rec) => {
    const emp = employees.find((e) => e.id === rec.employee_id);
    const empNameMatch = emp
      ? emp.name.toLowerCase().includes(historySearch.toLowerCase())
      : false;
    const dateMatch = historyDateFilter ? rec.date === historyDateFilter : true;
    return empNameMatch && dateMatch;
  });

  const groupedHistory = (() => {
    const map = {};
    filteredHistory.forEach((rec) => {
      if (!map[rec.employee_id]) map[rec.employee_id] = [];
      map[rec.employee_id].push(rec);
    });
    return Object.entries(map)
      .map(([empId, records]) => {
        const emp = employees.find((e) => e.id === empId);
        return {
          empId,
          emp,
          records: [...records].sort((a, b) =>
            a.date < b.date ? 1 : a.date > b.date ? -1 : 0
          ),
        };
      })
      .sort(
        (a, b) =>
          Number(b.emp?.base_salary || 0) - Number(a.emp?.base_salary || 0)
      );
  })();

  const totalBudget = employees.reduce(
    (acc, e) => acc + Number(e.base_salary || 0),
    0
  );
  const avgSalary = employees.length > 0 ? totalBudget / employees.length : 0;
  const totalToday = employees.filter((e) => e.is_active).length;
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

  // ========== EARLY RETURNS: FULL-SCREEN FLOWS ==========

  if (activeTab === "feedback" && hasFeedbackAccess) {
    return (
      <FeedbackFlow
        companyId={companyId}
        companyName={companyName}
        currentUser={currentUser}
        onLogout={onLogout}
        onExit={() => {
          setMobileScreen("home");
          setActiveTab(isAdmin ? "employees" : "daily");
        }}
      />
    );
  }

  if (
    activeTab === "feedback-admin" &&
    feedbackRole === "admin" &&
    hasFeedbackAccess
  ) {
    return (
      <div className="fixed inset-0 flex bg-black text-white font-sans overflow-hidden">
        <aside className="hidden md:flex md:flex-col w-64 bg-[#1C1C1E] border-r border-white/[0.06] justify-between shrink-0">
          <div>
            <div className="p-5 border-b border-white/[0.06] flex items-center space-x-3">
              <img
                src="/logo.svg"
                alt="Logo"
                className="w-[50px] h-[50px] object-contain shrink-0"
              />
              <div className="overflow-hidden">
                <h2 className="font-semibold text-[14px] text-white truncate">
                  {companyName}
                </h2>
                <span className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                  Feedback Admin
                </span>
              </div>
            </div>
            <nav className="p-3 space-y-1">
              <button
                onClick={() => {
                  setMobileScreen("home");
                  setActiveTab("employees");
                }}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold text-white/60 hover:bg-white/[0.05] hover:text-white transition-all"
              >
                <ArrowLeft className="w-[18px] h-[18px]" />
                <span>Back to Panel</span>
              </button>
            </nav>
          </div>
          <div className="p-4 border-t border-white/[0.06]">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 bg-white/[0.04] hover:bg-[#FF453A]/10 border border-white/[0.06] hover:border-[#FF453A]/25 text-white/50 hover:text-[#FF6961] py-2.5 rounded-[12px] text-[12px] font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>LOGOUT</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col w-full h-full overflow-hidden min-w-0">
          <header className="h-[56px] border-b border-white/[0.06] bg-black/70 backdrop-blur-2xl flex items-center justify-between px-4 sm:px-8 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => {
                  setMobileScreen("home");
                  setActiveTab("employees");
                }}
                className="md:hidden p-2 -ml-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-[15px] font-semibold text-white truncate">
                Feedback Dashboard
              </span>
            </div>
            <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider truncate">
              {displayName}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 w-full">
            <FeedbackAdminDashboard
              companyId={companyId}
              companyName={companyName}
            />
          </main>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========

  return (
    <div className="fixed inset-0 flex bg-black text-white font-sans overflow-hidden">
      {/* TOAST */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-[14px] shadow-2xl shadow-black/80 border border-white/[0.08] bg-[#1C1C1E]/95 backdrop-blur-2xl text-white max-w-[90vw]">
          {toast.type === "error" ? (
            <div className="p-1.5 rounded-[8px] bg-[#FF453A]/10 border border-[#FF453A]/25 text-[#FF453A] shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 rounded-[8px] bg-[#30D158]/10 border border-[#30D158]/25 text-[#30D158] shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          <span className="text-[14px] sm:text-[12px] font-semibold whitespace-nowrap">
            {toast.message}
          </span>
          <button
            type="button"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors ml-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-[20px] p-6 w-full max-w-md space-y-5 shadow-2xl shadow-black/90 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#FF453A]/10 border border-[#FF453A]/25 rounded-[14px] text-[#FF453A] shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-[16px] font-bold text-white tracking-wide">
                  {confirmModal.title}
                </h3>
                <p className="text-[14px] sm:text-[13px] text-white/60 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmModal({
                    show: false,
                    title: "",
                    message: "",
                    onConfirm: null,
                  })
                }
                className="flex-1 h-12 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-[14px] text-[15px] sm:text-[13px] font-semibold text-white/85 transition-all cursor-pointer active:scale-[0.99]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 h-12 bg-gradient-to-b from-[#FF6B60] to-[#E0382E] hover:from-[#FF7B70] hover:to-[#E0382E] text-white rounded-[14px] text-[15px] sm:text-[13px] font-semibold transition-all shadow-lg shadow-[#FF453A]/20 cursor-pointer active:scale-[0.99]"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE ADD/EDIT MODAL */}
      {employeeModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-[20px] p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/80 relative">
            <div className="flex items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-5 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-[14px] bg-[#7C5CFF]/12 border border-[#7C5CFF]/25 shrink-0">
                  <UserPlus className="w-5 h-5 text-[#A390FF]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[18px] sm:text-[20px] font-bold text-white tracking-tight">
                    {editingEmpId ? "Update Employee" : "Register New Employee"}
                  </h3>
                  <p className="text-[13px] text-white/50 font-medium mt-0.5">
                    {editingEmpId
                      ? "Modify employee details and salary information"
                      : "Add a new staff member to the company"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEmployeeModal}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-7">
              {/* Personal */}
              <div className="space-y-4">
                <SectionLabel icon={User} label="Personal Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      Full Name <span className="text-[#FF453A]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. AHMED RAZA"
                      value={empName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-4 text-[15px] text-white placeholder-white/30 transition-all outline-none uppercase font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      Father Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MUHAMMAD RAZA"
                      value={empFatherName}
                      onChange={(e) =>
                        setEmpFatherName(e.target.value.toUpperCase())
                      }
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-4 text-[15px] text-white placeholder-white/30 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Identification */}
              <div className="space-y-4">
                <SectionLabel
                  icon={CreditCard}
                  label="Identification & Contact"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      CNIC <span className="text-white/30">(13 digits)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 1234567890123"
                      value={empCnic}
                      onChange={(e) =>
                        handleCnicChange(setEmpCnic, e.target.value)
                      }
                      maxLength="13"
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-4 text-[15px] text-white placeholder-white/30 transition-all outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      Father CNIC
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 1234567890123"
                      value={empFatherCnic}
                      onChange={(e) =>
                        handleCnicChange(setEmpFatherCnic, e.target.value)
                      }
                      maxLength="13"
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-4 text-[15px] text-white placeholder-white/30 transition-all outline-none font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 03001234567"
                      value={empMobile}
                      onChange={(e) =>
                        handleNumberChange(setEmpMobile, e.target.value)
                      }
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-4 text-[15px] text-white placeholder-white/30 transition-all outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 03007654321"
                      value={empEmergencyContact}
                      onChange={(e) =>
                        handleNumberChange(
                          setEmpEmergencyContact,
                          e.target.value
                        )
                      }
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-4 text-[15px] text-white placeholder-white/30 transition-all outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <SectionLabel icon={MapPin} label="Address" />
                <input
                  type="text"
                  placeholder="e.g. House #12, Street 5, Lahore"
                  value={empAddress}
                  onChange={(e) => setEmpAddress(e.target.value)}
                  className="w-full h-12 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-4 text-[15px] text-white placeholder-white/30 transition-all outline-none"
                />
              </div>

              {/* Employment */}
              <div className="space-y-4">
                <SectionLabel icon={Briefcase} label="Employment Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      Date of Joining
                    </label>
                    <CustomDatePicker
                      value={empDateOfJoining}
                      onChange={(val) => setEmpDateOfJoining(val)}
                      placeholder="Select date"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Employee referral"
                      value={empReference}
                      onChange={(e) => setEmpReference(e.target.value)}
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-4 text-[15px] text-white placeholder-white/30 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Salary */}
              <div className="space-y-4">
                <SectionLabel icon={DollarSign} label="Salary Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      Starting Salary{" "}
                      <span className="text-white/30">(Rs.)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 40000"
                      value={empStartingSalary}
                      onChange={(e) =>
                        handleNumberChange(setEmpStartingSalary, e.target.value)
                      }
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-4 text-[15px] text-white placeholder-white/30 transition-all outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      Current Salary <span className="text-[#FF453A]">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="e.g. 45000"
                      value={empSalary}
                      onChange={(e) =>
                        handleNumberChange(setEmpSalary, e.target.value)
                      }
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-4 text-[15px] text-white placeholder-white/30 transition-all outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-5 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={closeEmployeeModal}
                  className="flex-1 h-12 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-[14px] text-[15px] sm:text-[14px] font-semibold text-white/85 transition-all cursor-pointer active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] hover:from-[#9B7EFF] hover:to-[#7C5CFF] text-white rounded-[14px] text-[15px] sm:text-[14px] font-semibold transition-all shadow-lg shadow-[#7C5CFF]/25 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingEmpId ? "Save Changes" : "Add Employee"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMPLOYEE PROFILE MODAL */}
      {profileModalOpen && selectedEmployee && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#1C1C1E] border border-white/[0.08] rounded-[20px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#7C5CFF]/12 border border-[#7C5CFF]/25 rounded-[12px] text-[#A390FF]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-white tracking-tight">
                    Employee Profile
                  </h3>
                  <p className="text-[12px] text-white/50">
                    Complete details and contact information
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEmployeeProfile}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-[14px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-[14px] bg-[#7C5CFF]/15 border border-[#7C5CFF]/25 flex items-center justify-center text-xl font-bold text-[#A390FF] shrink-0">
                    {selectedEmployee.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[16px] font-bold text-white truncate">
                      {selectedEmployee.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-white/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Joined: {formatDate(selectedEmployee.date_of_joining)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#30D158]/10 border border-[#30D158]/20 rounded-lg px-3 py-2 text-right shrink-0 self-stretch sm:self-auto flex sm:block items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#30D158]/80 uppercase tracking-wider block">
                    Current Salary
                  </span>
                  <span className="text-[16px] font-bold text-[#30D158] font-mono">
                    Rs.{" "}
                    {Number(selectedEmployee.base_salary).toLocaleString(
                      "en-PK",
                      {
                        minimumFractionDigits: 0,
                      }
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                  Personal Information
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ProfileField
                    label="Father Name"
                    value={selectedEmployee.father_name}
                  />
                  <ProfileField
                    label="Address"
                    value={selectedEmployee.address}
                    wrap
                  />
                  <ProfileField
                    label="CNIC"
                    value={selectedEmployee.cnic}
                    mono
                  />
                  <ProfileField
                    label="Father CNIC"
                    value={selectedEmployee.father_cnic}
                    mono
                  />
                  <ProfileField
                    label="Mobile"
                    value={selectedEmployee.mobile}
                    mono
                  />
                  <ProfileField
                    label="Emergency Contact"
                    value={selectedEmployee.emergency_contact}
                    mono
                  />
                  <ProfileField
                    label="Date of Joining"
                    value={formatDate(selectedEmployee.date_of_joining)}
                  />
                  <ProfileField
                    label="Reference"
                    value={selectedEmployee.reference}
                  />
                  <ProfileField
                    label="Starting Salary"
                    value={
                      selectedEmployee.starting_salary
                        ? `Rs. ${Number(
                            selectedEmployee.starting_salary
                          ).toLocaleString()}`
                        : null
                    }
                    mono
                  />
                  <ProfileField
                    label="Base Salary"
                    value={`Rs. ${Number(
                      selectedEmployee.base_salary
                    ).toLocaleString()}`}
                    mono
                    highlight
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={closeEmployeeProfile}
                className="w-full h-11 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-[12px] text-[14px] font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR (desktop only) */}
      <aside className="hidden md:flex md:flex-col w-64 bg-[#1C1C1E] border-r border-white/[0.06] justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Company Logo"
              className="w-[46px] h-[46px] object-contain shrink-0"
            />
            <div className="overflow-hidden">
              <h2 className="font-semibold text-[14px] text-white truncate">
                {companyName}
              </h2>
              <span className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                {isAdmin ? "Admin Access" : "Manager Access"}
              </span>
            </div>
          </div>

          <nav className="p-3 space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <p className="px-3 pt-1 pb-1 text-[10px] font-semibold text-white/30 uppercase tracking-[0.16em]">
                Attendance
              </p>
              {attendanceTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.disabled) return;
                      setActiveTab(tab.id);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all ${
                      tab.disabled
                        ? "opacity-40 cursor-not-allowed text-white/30"
                        : active
                        ? "bg-[#7C5CFF] text-white shadow-lg shadow-[#7C5CFF]/20"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {hasFeedbackAccess && (
              <div className="space-y-1">
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-white/30 uppercase tracking-[0.16em]">
                  Feedback
                </p>
                {feedbackTabsList.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all ${
                        active
                          ? "bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/20"
                          : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-white/[0.06]">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-[#FF453A]/10 border border-white/[0.06] hover:border-[#FF453A]/25 text-white/50 hover:text-[#FF6961] py-2.5 rounded-[12px] text-[12px] font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden min-w-0">
        {/* HEADER */}
        <header className="h-14 border-b border-white/[0.04] bg-black/70 backdrop-blur-2xl flex items-center justify-between gap-2 px-3 sm:px-8 shrink-0 relative z-30">
          {/* LEFT */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Mobile: brand mark on home, back button in sections */}
            <div className="md:hidden flex items-center gap-1.5 min-w-0">
              {mobileScreen === "home" ? (
                <>
                  <img
                    src="/logo.svg"
                    alt=""
                    className="w-7 h-7 object-contain shrink-0"
                  />
                  <span className="text-[15px] font-bold text-white tracking-tight truncate">
                    {companyName}
                  </span>
                </>
              ) : (
                <button
                  onClick={handleMobileBack}
                  className="p-1.5 -ml-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors active:scale-95 cursor-pointer"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
                </button>
              )}
            </div>

            {/* Desktop: company + active module */}
            <div className="hidden md:block min-w-0">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.14em] truncate leading-tight">
                {companyName}
              </p>
              <span className="text-[14px] font-semibold text-white capitalize truncate block leading-tight">
                {activeTab.replace("-", " ")}
              </span>
            </div>
          </div>

          {/* Mobile centered title when inside a section */}
          {mobileScreen !== "home" && (
            <div className="md:hidden absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none px-20">
              <span className="text-[15px] font-semibold text-white truncate inline-block max-w-full">
                {mobileScreen === "attendanceMenu"
                  ? "Attendance"
                  : mobileScreen === "feedbackMenu"
                  ? "Feedback"
                  : availableTabs.find((t) => t.id === activeTab)?.label ||
                    activeTab.replace("-", " ")}
              </span>
            </div>
          )}

          {/* RIGHT — avatar */}
          <div className="relative shrink-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer"
              aria-label="Profile"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8B6EFF] to-[#6B4FE8]" />
              <div className="absolute inset-[1.5px] rounded-full bg-[#1C1C1E] flex items-center justify-center">
                <span className="text-[13px] font-bold text-white tracking-tight">
                  {userInitials}
                </span>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/[0.08] rounded-[16px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] p-1.5 z-50">
                <div className="px-3 py-3 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8B6EFF] to-[#6B4FE8]" />
                    <div className="absolute inset-[1.5px] rounded-full bg-[#1C1C1E] flex items-center justify-center">
                      <span className="text-[14px] font-bold text-white">
                        {userInitials}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-[12px] text-white/50 truncate">
                      {isAdmin ? "Administrator" : "Manager"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full mt-1 flex items-center gap-2.5 px-3 py-3 rounded-[12px] text-[14px] font-medium text-[#FF6961] hover:bg-[#FF453A]/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* MOBILE: HOME (two big cards) */}
        {mobileScreen === "home" && (
          <div className="md:hidden flex-1 overflow-y-auto w-full p-5 space-y-4">
            <div className="pt-2 pb-4">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.16em]">
                {isAdmin ? "Admin Access" : "Manager Access"}
              </p>
              <h1 className="text-[26px] font-bold text-white mt-1 tracking-tight truncate">
                {displayName}
              </h1>
              <p className="text-[14px] text-white/50 mt-1 truncate">
                {companyName}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAttendanceTap}
              className="w-full p-5 rounded-[20px] bg-[#1C1C1E] border border-white/[0.06] active:scale-[0.98] transition-transform text-left"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-[14px] bg-[#7C5CFF]/12 border border-[#7C5CFF]/25 flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6 text-[#A390FF]" />
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </div>
              <p className="text-[17px] font-semibold text-white mt-4">
                Attendance
              </p>
              <p className="text-[13px] text-white/45 mt-0.5">
                {attendanceTabs.length} section
                {attendanceTabs.length !== 1 ? "s" : ""}
              </p>
            </button>

            {hasFeedbackAccess && (
              <button
                type="button"
                onClick={handleFeedbackTap}
                className="w-full p-5 rounded-[20px] bg-[#1C1C1E] border border-white/[0.06] active:scale-[0.98] transition-transform text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-[14px] bg-[#0A84FF]/12 border border-[#0A84FF]/25 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-[#0A84FF]" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30" />
                </div>
                <p className="text-[17px] font-semibold text-white mt-4">
                  Feedback
                </p>
                <p className="text-[13px] text-white/45 mt-0.5">
                  Customer feedback &amp; analytics
                </p>
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="w-full mt-3 h-12 rounded-[14px] bg-[#FF453A]/10 border border-[#FF453A]/25 text-[#FF6961] text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        )}

        {/* MOBILE: ATTENDANCE MENU */}
        {mobileScreen === "attendanceMenu" && (
          <div className="md:hidden flex-1 overflow-y-auto w-full p-5 space-y-3">
            <div className="pt-1 pb-3">
              <h1 className="text-[22px] font-bold text-white tracking-tight">
                Attendance
              </h1>
              <p className="text-[13px] text-white/45 mt-0.5">
                Choose a section
              </p>
            </div>
            {attendanceTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  disabled={tab.disabled}
                  onClick={() => {
                    if (tab.disabled) return;
                    goToTab(tab.id);
                  }}
                  className={`w-full p-4 rounded-[16px] flex items-center gap-4 transition-all text-left active:scale-[0.98] ${
                    tab.disabled
                      ? "bg-[#1C1C1E]/50 border border-white/[0.04] opacity-40 cursor-not-allowed"
                      : "bg-[#1C1C1E] border border-white/[0.06]"
                  }`}
                >
                  <div className="w-11 h-11 rounded-[12px] bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#A390FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold text-white truncate">
                      {tab.label}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/25 shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* MOBILE: FEEDBACK MENU */}
        {mobileScreen === "feedbackMenu" && (
          <div className="md:hidden flex-1 overflow-y-auto w-full p-5 space-y-3">
            <div className="pt-1 pb-3">
              <h1 className="text-[22px] font-bold text-white tracking-tight">
                Feedback
              </h1>
              <p className="text-[13px] text-white/45 mt-0.5">
                Customer feedback &amp; analytics
              </p>
            </div>
            {feedbackTabsList.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => goToTab(tab.id)}
                  className="w-full p-4 rounded-[16px] bg-[#1C1C1E] border border-white/[0.06] flex items-center gap-4 transition-all text-left active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-[12px] bg-[#0A84FF]/10 border border-[#0A84FF]/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#0A84FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold text-white truncate">
                      {tab.label}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/25 shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* MAIN CONTENT */}
        <main
          className={`flex-1 overflow-y-auto p-4 sm:p-8 w-full ${
            mobileScreen === "section" ? "block" : "hidden md:block"
          }`}
        >
          {/* EMPLOYEES TAB */}
          {activeTab === "employees" && isAdmin && (
            <div className="space-y-5 w-full">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-[20px] sm:text-[18px] font-bold text-white">
                    Employees
                  </h3>
                  <p className="text-[13px] text-white/50 mt-0.5">
                    {employees.length} registered staff members
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddEmployeeModal}
                  className="h-11 bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] hover:from-[#9B7EFF] hover:to-[#7C5CFF] text-white font-semibold px-5 rounded-[12px] text-[14px] sm:text-[13px] tracking-wide flex items-center gap-2 transition-all shadow-lg shadow-[#7C5CFF]/25 active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Employee</span>
                </button>
              </div>

              {loading ? (
                <p className="text-[14px] text-white/50">
                  Loading workforce records...
                </p>
              ) : employees.length === 0 ? (
                <div className="bg-[#1C1C1E] border border-white/[0.06] p-8 rounded-[20px] text-center w-full">
                  <p className="text-[14px] text-white/60">
                    No employees registered for this company yet.
                  </p>
                </div>
              ) : (
                <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-[13px] text-white/85">
                      <thead className="bg-white/[0.02] text-[10px] text-white/40 uppercase tracking-wider border-b border-white/[0.06]">
                        <tr>
                          <th className="p-4 font-semibold w-12">#</th>
                          <th className="p-4 font-semibold">Employee</th>
                          <th className="p-4 font-semibold">Contact</th>
                          <th className="p-4 font-semibold">Monthly Salary</th>
                          <th className="p-4 font-semibold">Joining Date</th>
                          <th className="p-4 font-semibold text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {employees.map((emp, idx) => (
                          <tr
                            key={emp.id}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="p-4 text-white/40 font-mono text-[12px]">
                              {idx + 1}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-[14px] shrink-0 ${
                                    emp.is_active
                                      ? "bg-[#7C5CFF]/15 border-[#7C5CFF]/25 text-[#A390FF]"
                                      : "bg-white/[0.04] border-white/[0.08] text-white/40"
                                  }`}
                                >
                                  {emp.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p
                                      className={`font-semibold ${
                                        emp.is_active
                                          ? "text-white"
                                          : "text-white/40 line-through"
                                      }`}
                                    >
                                      {emp.name}
                                    </p>
                                    {!emp.is_active && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/50">
                                        Inactive
                                      </span>
                                    )}
                                    {emp.is_manager && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0A84FF]/10 border border-[#0A84FF]/25 text-[#0A84FF]">
                                        Manager
                                      </span>
                                    )}
                                  </div>
                                  {emp.cnic && (
                                    <p className="text-[10px] text-white/40 font-mono">
                                      CNIC: {emp.cnic}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-0.5">
                                {emp.mobile && (
                                  <p className="text-[12px] text-white/85 font-mono flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-white/40" />
                                    {emp.mobile}
                                  </p>
                                )}
                                {emp.emergency_contact && (
                                  <p className="text-[10px] text-white/40 font-mono flex items-center gap-1.5">
                                    <span className="text-white/30">
                                      Emergency:
                                    </span>
                                    {emp.emergency_contact}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-[#30D158] font-semibold font-mono">
                              Rs.{" "}
                              {Number(emp.base_salary).toLocaleString("en-PK", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="p-4 text-[12px] text-white/60">
                              {emp.date_of_joining
                                ? formatDate(emp.date_of_joining)
                                : "—"}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    handleToggleEmployeeActive(emp)
                                  }
                                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${
                                    emp.is_active
                                      ? "bg-[#30D158]"
                                      : "bg-white/[0.12]"
                                  }`}
                                  title={
                                    emp.is_active
                                      ? "Active — click to deactivate"
                                      : "Inactive — click to activate"
                                  }
                                >
                                  <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                                      emp.is_active
                                        ? "translate-x-5"
                                        : "translate-x-0"
                                    }`}
                                  />
                                </button>
                                <button
                                  onClick={() => openEmployeeProfile(emp)}
                                  className="p-2 bg-white/[0.04] hover:bg-white/[0.08] text-[#0A84FF] border border-white/[0.08] rounded-[10px] transition-colors"
                                  title="View Full Profile"
                                >
                                  <User className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditEmployeeModal(emp)}
                                  className="p-2 bg-white/[0.04] hover:bg-white/[0.08] text-[#0A84FF] border border-white/[0.08] rounded-[10px] transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="p-2 bg-white/[0.04] hover:bg-[#FF453A]/10 text-[#FF6961] border border-white/[0.08] hover:border-[#FF453A]/25 rounded-[10px] transition-colors"
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
            <div className="space-y-5 w-full">
              <div className="bg-[#1C1C1E] border border-white/[0.06] p-5 sm:p-6 rounded-[20px] space-y-4 w-full">
                {isAdmin && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                    <div>
                      <p className="text-[14px] sm:text-[13px] font-semibold text-white tracking-wide">
                        Manager Date Access
                      </p>
                      <p className="text-[12px] text-white/50 mt-0.5">
                        When ON, managers can mark/edit attendance for any date.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleManagersCanPickDates}
                      className={`relative shrink-0 w-14 h-8 rounded-full transition-colors duration-200 cursor-pointer ${
                        managersCanPickDates
                          ? "bg-[#30D158]"
                          : "bg-white/[0.12]"
                      }`}
                      aria-pressed={managersCanPickDates}
                    >
                      <span
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                          managersCanPickDates
                            ? "translate-x-6"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                  {isAdmin || managersCanPickDates ? (
                    <>
                      <CustomMonthPicker
                        label="Month"
                        value={selectedMonth}
                        onChange={(m) => setSelectedMonth(m)}
                      />
                      <CustomYearPicker
                        label="Year"
                        value={selectedYear}
                        onChange={(y) => setSelectedYear(y)}
                      />
                      <CustomDayPicker
                        label="Day"
                        value={selectedDay}
                        maxDays={daysInMonth(selectedYear, selectedMonth)}
                        onChange={(d) => setSelectedDay(d)}
                      />
                    </>
                  ) : (
                    <div className="col-span-3 flex items-center justify-center gap-3 py-2">
                      <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                        Today's Date:
                      </span>
                      <span className="text-[14px] font-mono text-white">
                        {currentDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isLocked && !isAdmin && !managersCanPickDates && (
                <div className="bg-[#FF9F0A]/10 border border-[#FF9F0A]/30 rounded-[14px] p-4 text-center text-[#FF9F0A] text-[14px] font-medium">
                  <CheckCircle2 className="w-5 h-5 inline-block mr-2" />
                  Today's attendance has already been marked.
                </div>
              )}

              {employees.length === 0 ? (
                <div className="bg-[#1C1C1E] border border-white/[0.06] p-8 rounded-[20px] text-center w-full">
                  <p className="text-[14px] text-white/60">
                    No employees found to take attendance.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  {employees
                    .filter((emp) => {
                      if (emp.is_active) return true;
                      return dailyStatus[emp.id] !== undefined;
                    })
                    .map((emp) => {
                      const currentStatus = dailyStatus[emp.id] || "absent";
                      return (
                        <div
                          key={emp.id}
                          className="bg-[#1C1C1E] border border-white/[0.06] p-4 rounded-[20px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/[0.10] transition-colors"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-[15px] sm:text-[14px] text-white block truncate">
                              {emp.name}
                            </span>
                            {isAdmin && (
                              <span className="text-[12px] text-white/40 font-mono">
                                Rs. {Number(emp.base_salary).toLocaleString()}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex gap-1.5">
                              {["full", "half", "holiday", "absent"].map(
                                (st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() =>
                                      handleStatusChange(emp.id, st)
                                    }
                                    disabled={isLocked && !managersCanPickDates}
                                    className={`px-3.5 py-2 rounded-[10px] text-[13px] font-semibold capitalize border transition-all ${
                                      currentStatus === st
                                        ? "bg-[#7C5CFF] border-[#7C5CFF] text-white"
                                        : "bg-white/[0.03] border-white/[0.08] text-white/70 hover:text-white hover:border-white/[0.14]"
                                    } ${
                                      isLocked && !managersCanPickDates
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer"
                                    }`}
                                  >
                                    {st}
                                  </button>
                                )
                              )}
                            </div>

                            <CustomTimePicker
                              label="In"
                              value={dailyCheckIn[emp.id] || ""}
                              onChange={(val) =>
                                setDailyCheckIn((prev) => ({
                                  ...prev,
                                  [emp.id]: val,
                                }))
                              }
                              placeholder="Check-In"
                              className="w-44"
                              disabled={isLocked && !managersCanPickDates}
                            />
                          </div>
                        </div>
                      );
                    })}
                  <button
                    onClick={saveDailyAttendance}
                    disabled={isLocked && !managersCanPickDates}
                    className={`w-full h-12 rounded-[14px] font-semibold text-[15px] tracking-wide text-white transition-all mt-4 active:scale-[0.99] ${
                      isLocked && !managersCanPickDates
                        ? "bg-white/[0.06] cursor-not-allowed text-white/40"
                        : "bg-gradient-to-b from-[#42E366] to-[#28B94D] hover:from-[#52E876] hover:to-[#30D158] shadow-lg shadow-[#30D158]/20"
                    }`}
                  >
                    {isLocked && !managersCanPickDates
                      ? "Attendance Already Saved"
                      : "Save Daily Attendance"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ATTENDANCE HISTORY TAB */}
          {activeTab === "history" && (
            <div className="space-y-5 w-full">
              <div className="bg-[#1C1C1E] border border-white/[0.06] p-5 sm:p-6 rounded-[20px] space-y-4 w-full">
                <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                        Search Employee
                      </label>
                      <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Type employee name..."
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          className="w-full h-11 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] pl-10 pr-3.5 text-[15px] text-white placeholder-white/30 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <CustomDatePicker
                        label="Filter By Date"
                        value={historyDateFilter}
                        onChange={(val) => setHistoryDateFilter(val)}
                        placeholder="Select date..."
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={downloadDailyAttendancePDF}
                      className="w-full sm:w-auto h-11 bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] hover:from-[#9B7EFF] hover:to-[#7C5CFF] text-white font-semibold px-4 rounded-[12px] text-[13px] tracking-wide flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer active:scale-[0.99] shadow-lg shadow-[#7C5CFF]/20"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Print Report</span>
                    </button>
                  </div>
                </div>
              </div>

              {historyLoading ? (
                <p className="text-[14px] text-white/50">
                  Fetching attendance logs...
                </p>
              ) : groupedHistory.length === 0 ? (
                <div className="bg-[#1C1C1E] border border-white/[0.06] p-8 rounded-[20px] text-center w-full">
                  <p className="text-[14px] text-white/60">
                    No attendance history records found.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  {groupedHistory.map(({ empId, emp, records }) => {
                    const isOpen = expandedHistoryEmp === empId;
                    const empName = emp ? emp.name : "Unknown Employee";
                    const initial = empName.charAt(0).toUpperCase();
                    return (
                      <div
                        key={empId}
                        className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] overflow-hidden w-full hover:border-white/[0.10] transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedHistoryEmp(isOpen ? null : empId)
                          }
                          className="w-full flex items-center justify-between gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ChevronDown
                              className={`w-4 h-4 text-white/50 shrink-0 transition-transform duration-200 ${
                                isOpen ? "rotate-0" : "-rotate-90"
                              }`}
                            />
                            <div className="w-10 h-10 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/25 flex items-center justify-center text-[#A390FF] font-bold text-[14px] shrink-0">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[15px] sm:text-[14px] text-white truncate">
                                {empName}
                              </p>
                              <p className="text-[11px] text-white/40 font-mono truncate">
                                {emp?.cnic
                                  ? `CNIC: ${emp.cnic}`
                                  : emp?.mobile
                                  ? emp.mobile
                                  : "—"}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/[0.03] border border-white/[0.08] text-white/70">
                            {records.length}{" "}
                            {records.length === 1 ? "record" : "records"}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="border-t border-white/[0.06] bg-white/[0.01]">
                            <div className="overflow-x-auto w-full">
                              <table className="w-full text-left text-[13px] text-white/85">
                                <thead className="bg-white/[0.02] uppercase text-[10px] text-white/40 tracking-wider border-b border-white/[0.06]">
                                  <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Check-in</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                  {records.map((rec) => (
                                    <tr
                                      key={rec.id}
                                      className="hover:bg-white/[0.02] transition-colors"
                                    >
                                      <td className="p-3 font-mono text-white">
                                        {rec.date}
                                      </td>
                                      <td className="p-3">
                                        <span
                                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                            rec.status === "full"
                                              ? "bg-[#30D158]/10 text-[#30D158] border-[#30D158]/25"
                                              : rec.status === "half"
                                              ? "bg-[#FFD60A]/10 text-[#FFD60A] border-[#FFD60A]/25"
                                              : rec.status === "holiday"
                                              ? "bg-[#0A84FF]/10 text-[#0A84FF] border-[#0A84FF]/25"
                                              : "bg-[#FF453A]/10 text-[#FF6961] border-[#FF453A]/25"
                                          }`}
                                        >
                                          {rec.status}
                                        </span>
                                      </td>
                                      <td className="p-3 text-white font-mono">
                                        {rec.check_in_time || "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* BULK ATTENDANCE TAB */}
          {activeTab === "bulk" && isAdmin && (
            <div className="space-y-5 w-full">
              <div className="bg-[#1C1C1E] border border-white/[0.06] p-5 sm:p-6 rounded-[20px] grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <CustomMonthPicker
                  label="Month"
                  value={selectedMonth}
                  onChange={(m) => setSelectedMonth(m)}
                />
                <CustomYearPicker
                  label="Year"
                  value={selectedYear}
                  onChange={(y) => setSelectedYear(y)}
                />
              </div>

              {employees.length === 0 ? (
                <p className="text-[14px] text-white/50">
                  No employees available for bulk attendance.
                </p>
              ) : (
                <div className="space-y-3 w-full">
                  {employees
                    .filter((e) => e.is_active)
                    .map((emp) => (
                      <div
                        key={emp.id}
                        className="bg-[#1C1C1E] border border-white/[0.06] p-4 rounded-[20px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/[0.10] transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-[15px] text-white block truncate">
                            {emp.name}
                          </span>
                          <span className="text-[12px] text-white/40 font-mono">
                            Rs. {Number(emp.base_salary).toLocaleString()}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={daysInMonth(selectedYear, selectedMonth)}
                          value={bulkDays[emp.id] || ""}
                          onChange={(e) =>
                            setBulkDays({
                              ...bulkDays,
                              [emp.id]: e.target.value,
                            })
                          }
                          placeholder="Working days"
                          className={`${inputBase} p-2.5 text-center w-full sm:w-36 shrink-0`}
                        />
                      </div>
                    ))}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={saveBulkAttendance}
                      className="flex-1 h-12 bg-gradient-to-b from-[#42E366] to-[#28B94D] hover:from-[#52E876] hover:to-[#30D158] rounded-[14px] font-semibold text-[14px] text-white shadow-lg shadow-[#30D158]/20 transition-colors active:scale-[0.99]"
                    >
                      Save Bulk Attendance
                    </button>
                    <button
                      onClick={generateBulkReport}
                      className="flex-1 h-12 bg-gradient-to-b from-[#3B9CFF] to-[#0A84FF] hover:from-[#4BAAFF] hover:to-[#0A84FF] rounded-[14px] font-semibold text-[14px] text-white shadow-lg shadow-[#0A84FF]/20 transition-colors active:scale-[0.99]"
                    >
                      Generate Bulk Report
                    </button>
                  </div>
                </div>
              )}

              {bulkReports.length > 0 && (
                <div
                  id="bulkPrintArea"
                  className="space-y-4 border-t border-white/[0.06] pt-6 w-full"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h3 className="font-bold text-[16px] text-white">
                      Bulk Payroll Summary
                    </h3>
                    <button
                      onClick={() =>
                        triggerPrint(
                          `${companyName} - Bulk Report`,
                          "bulkPrintArea"
                        )
                      }
                      className="w-full sm:w-auto bg-gradient-to-b from-[#3B9CFF] to-[#0A84FF] hover:from-[#4BAAFF] hover:to-[#0A84FF] px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Report</span>
                    </button>
                  </div>
                  {bulkReports.map((r, idx) => (
                    <div
                      key={r.id}
                      className="bg-[#1C1C1E] border border-white/[0.06] p-5 rounded-[20px] space-y-2 text-[13px] text-white/85"
                    >
                      <h4 className="font-bold text-[15px] text-[#A390FF]">
                        <span className="inline-block w-6 text-white/40 font-mono">
                          {idx + 1}.
                        </span>
                        {r.name}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/[0.02] p-3 rounded-[12px] border border-white/[0.06]">
                        <div>
                          <span className="text-white/40 block text-[11px]">
                            Base Salary
                          </span>
                          <span className="font-mono text-white text-[13px]">
                            Rs. {Number(r.base_salary).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[11px]">
                            Days / Worked
                          </span>
                          <span className="text-white text-[13px]">
                            {r.totalDays} / {r.work}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[11px]">
                            Total Pay
                          </span>
                          <span className="font-mono font-bold text-[#30D158] text-[13px]">
                            Rs. {r.pay.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[11px]">
                            Balance
                          </span>
                          <span className="font-mono font-bold text-[#FFD60A] text-[13px]">
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

          {/* SALARY REPORTS TAB */}
          {activeTab === "reports" && isAdmin && (
            <div className="space-y-5 w-full">
              <div className="bg-[#1C1C1E] border border-white/[0.06] p-5 sm:p-6 rounded-[20px] grid grid-cols-1 sm:grid-cols-3 gap-4 items-end w-full">
                <CustomMonthPicker
                  label="Month"
                  value={selectedMonth}
                  onChange={(m) => setSelectedMonth(m)}
                />
                <CustomYearPicker
                  label="Year"
                  value={selectedYear}
                  onChange={(y) => setSelectedYear(y)}
                />
                <button
                  type="button"
                  onClick={generateMonthlyReport}
                  className="h-12 bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] hover:from-[#9B7EFF] hover:to-[#7C5CFF] px-6 rounded-[14px] font-semibold text-[14px] text-white shadow-lg shadow-[#7C5CFF]/25 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Generate Report</span>
                </button>
              </div>

              {monthlyReports.length > 0 && (
                <div id="monthlyPrintArea" className="space-y-5 w-full">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="font-bold text-[18px] sm:text-[16px] text-white">
                        {months[selectedMonth]} {selectedYear} Payroll Report
                      </h3>
                      <p className="text-[12px] text-white/40 mt-0.5">
                        {companyName}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        triggerPrint(
                          `${companyName} - ${months[selectedMonth]} Payroll Report`,
                          "monthlyPrintArea"
                        )
                      }
                      className="w-full sm:w-auto bg-gradient-to-b from-[#3B9CFF] to-[#0A84FF] hover:from-[#4BAAFF] hover:to-[#0A84FF] px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print / Save PDF</span>
                    </button>
                  </div>

                  <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] overflow-hidden w-full">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-[13px] text-white/85">
                        <thead className="bg-white/[0.02] uppercase text-[10px] text-white/40 tracking-wider border-b border-white/[0.06]">
                          <tr>
                            <th className="p-4 w-12">#</th>
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
                        <tbody className="divide-y divide-white/[0.04]">
                          {monthlyReports.map((r, idx) => (
                            <tr
                              key={r.id}
                              className="hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="p-4 text-white/40 font-mono text-[12px]">
                                {idx + 1}
                              </td>
                              <td className="p-4 font-semibold text-white">
                                {r.name}
                              </td>
                              <td className="p-4 text-right font-mono text-white/85">
                                Rs.{" "}
                                {Number(r.base_salary).toLocaleString("en-PK", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="p-4 text-center">
                                {r.type === "daily" ? (
                                  <span className="inline-flex gap-1 text-[12px]">
                                    <span className="text-[#30D158] font-semibold">
                                      {r.full}F
                                    </span>{" "}
                                    /
                                    <span className="text-[#FFD60A] font-semibold">
                                      {r.half}H
                                    </span>{" "}
                                    /
                                    <span className="text-[#0A84FF] font-semibold">
                                      {r.paidHol}Hol
                                    </span>{" "}
                                    /
                                    <span className="text-[#FF6961] font-semibold">
                                      {r.abs}A
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-[#0A84FF] font-semibold">
                                    {r.work} Days (Bulk)
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right font-semibold text-white">
                                {r.type === "daily" ? r.paidDays : r.work} /{" "}
                                {r.totalDays}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-[#30D158]">
                                Rs.{" "}
                                {r.pay.toLocaleString("en-PK", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-[#FFD60A]">
                                Rs.{" "}
                                {r.bal.toLocaleString("en-PK", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-white/[0.02] border-t-2 border-[#7C5CFF]/40">
                          <tr>
                            <td className="p-4"></td>
                            <td className="p-4 font-bold text-white uppercase text-[11px] tracking-wider">
                              Total ({monthlyReports.length} employees)
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-white/85">
                              Rs.{" "}
                              {monthlyReports
                                .reduce(
                                  (sum, r) => sum + Number(r.base_salary || 0),
                                  0
                                )
                                .toLocaleString("en-PK", {
                                  minimumFractionDigits: 2,
                                })}
                            </td>
                            <td className="p-4"></td>
                            <td className="p-4"></td>
                            <td className="p-4 text-right font-mono font-extrabold text-[#30D158] text-[14px]">
                              Rs.{" "}
                              {monthlyReports
                                .reduce((sum, r) => sum + Number(r.pay || 0), 0)
                                .toLocaleString("en-PK", {
                                  minimumFractionDigits: 2,
                                })}
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-[#FFD60A]">
                              Rs.{" "}
                              {monthlyReports
                                .reduce((sum, r) => sum + Number(r.bal || 0), 0)
                                .toLocaleString("en-PK", {
                                  minimumFractionDigits: 2,
                                })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === "analytics" && isAdmin && (
            <div className="space-y-5 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <StatCard
                  label="Workforce"
                  value={employees.length}
                  sub="active employees"
                  icon={Users}
                  accent="violet"
                />
                <StatCard
                  label="Avg. Salary"
                  value={`Rs. ${avgSalary.toLocaleString("en-PK", {
                    maximumFractionDigits: 0,
                  })}`}
                  sub="per employee / month"
                  icon={TrendingUp}
                  accent="blue"
                />
                <StatCard
                  label="Monthly Budget"
                  value={`Rs. ${totalBudget.toLocaleString()}`}
                  sub="combined base salaries"
                  icon={Wallet}
                  accent="green"
                />
                <StatCard
                  label="Today's Attendance"
                  value={`${attendanceRate}%`}
                  sub={
                    todayAttendanceLoading
                      ? "loading…"
                      : `${presentToday} present · ${absentToday} absent`
                  }
                  icon={CalendarCheck}
                  accent="yellow"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
                <div className="lg:col-span-2 bg-[#1C1C1E] border border-white/[0.06] p-5 sm:p-6 rounded-[20px] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[15px] font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#A390FF]" />
                      <span>Today's Attendance Status</span>
                    </h4>
                    <span className="text-[12px] text-white/40">
                      {months[currentDate.getMonth()]} {currentDate.getDate()}
                    </span>
                  </div>
                  <div className="h-48 w-full flex items-end justify-around pt-6 pb-2 px-4 bg-white/[0.02] rounded-[12px] border border-white/[0.06]">
                    <BarChartColumn
                      value={presentFullToday}
                      total={totalToday}
                      color="#30D158"
                      label="Full"
                    />
                    <BarChartColumn
                      value={presentHalfToday}
                      total={totalToday}
                      color="#FFD60A"
                      label="Half"
                    />
                    <BarChartColumn
                      value={holidayToday}
                      total={totalToday}
                      color="#0A84FF"
                      label="Holiday"
                    />
                    <BarChartColumn
                      value={absentToday}
                      total={totalToday}
                      color="#FF453A"
                      label="Absent"
                    />
                  </div>
                </div>

                <div className="bg-[#1C1C1E] border border-white/[0.06] p-5 sm:p-6 rounded-[20px] space-y-4">
                  <h4 className="text-[15px] font-bold text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#30D158]" />
                    <span>Ratio Breakdown</span>
                  </h4>
                  <div className="space-y-3 pt-2">
                    <RatioBar
                      label="Present Rate"
                      pct={attendanceRate}
                      color="#30D158"
                    />
                    <RatioBar
                      label="Absent Rate"
                      pct={
                        totalToday > 0
                          ? Math.round((absentToday / totalToday) * 100)
                          : 0
                      }
                      color="#FF453A"
                    />
                    <RatioBar
                      label="Unmarked"
                      pct={
                        totalToday > 0
                          ? Math.round((unmarkedToday / totalToday) * 100)
                          : 0
                      }
                      color="rgba(255,255,255,0.3)"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CALCULATOR TAB */}
          {activeTab === "calculator" && isAdmin && (
            <div className="w-full bg-[#1C1C1E] border border-white/[0.06] p-5 sm:p-6 rounded-[20px] space-y-5">
              <div className="border-b border-white/[0.06] pb-3">
                <h3 className="font-bold text-[15px] text-[#A390FF] tracking-wide flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>Salary & Overtime Extra Calculator</span>
                </h3>
                <p className="text-[12px] text-white/40 mt-0.5">
                  Calculate worked days credit, daily rates, overtime, and
                  deductions.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <CustomMonthPicker
                  label="Month"
                  value={calcMonth}
                  onChange={(m) => setCalcMonth(m)}
                />
                <CustomYearPicker
                  label="Year"
                  value={calcYear}
                  onChange={(y) => setCalcYear(y)}
                />
                <div>
                  <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Monthly Base Salary (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={calcSalary}
                    onChange={(e) => setCalcSalary(e.target.value)}
                    className="w-full h-11 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-3.5 text-[15px] text-white placeholder-white/30 transition-all outline-none font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <CalcInput
                  label="Full Days Worked"
                  placeholder="Full Days"
                  value={calcFull}
                  onChange={(v) => setCalcFull(Number(v))}
                />
                <CalcInput
                  label="Half Days Worked"
                  placeholder="Half Days"
                  value={calcHalf}
                  onChange={(v) => setCalcHalf(Number(v))}
                />
                <CalcInput
                  label="Holidays"
                  placeholder="Holidays"
                  value={calcHoliday}
                  onChange={(v) => setCalcHoliday(Number(v))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <CalcInput
                  label="Overtime Hours (1.25x Rate)"
                  placeholder="e.g. 10"
                  value={calcOvertimeHours}
                  onChange={(v) => setCalcOvertimeHours(v)}
                />
                <CalcInput
                  label="Advance / Deductions (Rs.)"
                  placeholder="e.g. 2000"
                  value={calcAdvanceDeductions}
                  onChange={(v) => setCalcAdvanceDeductions(v)}
                />
              </div>
              <button
                type="button"
                onClick={handleCalculateExtra}
                className="w-full h-12 bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] hover:from-[#9B7EFF] hover:to-[#7C5CFF] rounded-[14px] font-semibold text-[14px] text-white tracking-wide transition-all active:scale-[0.99] shadow-lg shadow-[#7C5CFF]/25 cursor-pointer flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                <span>Calculate Payroll Breakdown</span>
              </button>
              {calcResult && (
                <div className="bg-white/[0.02] p-5 rounded-[14px] border border-white/[0.06] space-y-3 text-[13px] text-white/85">
                  <h4 className="font-bold text-[14px] text-white border-b border-white/[0.06] pb-2">
                    Calculation Results ({months[calcMonth]} {calcYear})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <CalcResultItem
                      label="Days in Month"
                      value={`${calcResult.totalDays} Days`}
                    />
                    <CalcResultItem
                      label="Daily Rate"
                      value={`Rs. ${calcResult.dailyRate.toFixed(2)}`}
                      color="#30D158"
                    />
                    <CalcResultItem
                      label="Worked Days Credit"
                      value={`${calcResult.workedDaysCredit} Days`}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/[0.06] pt-3">
                    <CalcResultItem
                      label="Paid Holidays (Cap 4)"
                      value={`${calcResult.paidHol} Paid (${calcResult.unpaidExtraHol} Unpaid)`}
                      color="#0A84FF"
                    />
                    <CalcResultItem
                      label="Overtime Bonus"
                      value={`+ Rs. ${calcResult.overtimePay.toFixed(2)}`}
                      color="#30D158"
                    />
                    <CalcResultItem
                      label="Advance Deductions"
                      value={`- Rs. ${calcResult.deductions.toFixed(2)}`}
                      color="#FF6961"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/[0.02] p-4 rounded-[12px] border border-white/[0.06] gap-2 mt-2">
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-bold">
                        Net Calculated Payable
                      </span>
                      <span className="text-[20px] font-bold font-mono text-[#30D158]">
                        Rs. {calcResult.netPayable.toFixed(2)}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-white/40 block text-[10px] uppercase font-bold">
                        Remaining Unpaid Balance
                      </span>
                      <span className="text-[18px] font-bold font-mono text-[#FFD60A]">
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

// ---------- Helper components ----------

function SectionLabel({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-[#7C5CFF]/12 border border-[#7C5CFF]/20">
        <Icon className="w-3.5 h-3.5 text-[#A390FF]" />
      </div>
      <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
    </div>
  );
}

function ProfileField({ label, value, wrap, mono, highlight }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-[12px] p-3.5">
      <span className="text-[11px] font-medium text-white/50 block mb-0.5">
        {label}
      </span>
      <span
        className={`text-[14px] font-medium block ${
          highlight ? "text-[#30D158]" : "text-white"
        } ${mono ? "font-mono" : ""} ${
          wrap ? "break-words whitespace-normal leading-relaxed" : "truncate"
        }`}
      >
        {value || "Not provided"}
      </span>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent = "violet" }) {
  const accents = {
    violet: "text-[#A390FF] bg-[#7C5CFF]/10 border-[#7C5CFF]/20",
    blue: "text-[#0A84FF] bg-[#0A84FF]/10 border-[#0A84FF]/20",
    green: "text-[#30D158] bg-[#30D158]/10 border-[#30D158]/20",
    yellow: "text-[#FFD60A] bg-[#FFD60A]/10 border-[#FFD60A]/20",
    red: "text-[#FF6961] bg-[#FF453A]/10 border-[#FF453A]/20",
  };
  return (
    <div className="bg-[#1C1C1E] border border-white/[0.06] p-5 rounded-[20px] hover:border-white/[0.10] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-2 rounded-[10px] border ${accents[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <span className="text-[22px] font-bold text-white block tabular-nums">
        {value}
      </span>
      <span className="text-[12px] text-white/40 mt-0.5 block">{sub}</span>
    </div>
  );
}

function BarChartColumn({ value, total, color, label }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-2 h-full justify-end w-12">
      <span className="text-[12px] font-bold" style={{ color }}>
        {value}
      </span>
      <div
        className="w-full rounded-t-lg transition-all duration-500"
        style={{
          height: `${pct}%`,
          minHeight: value > 0 ? "12px" : "4px",
          backgroundColor: color,
        }}
      />
      <span className="text-[10px] font-semibold text-white/60">{label}</span>
    </div>
  );
}

function RatioBar({ label, pct, color }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[12px] font-semibold">
        <span style={{ color }}>{label}</span>
        <span className="text-white">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.06]">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function CalcInput({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <input
        type="number"
        min="0"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 bg-white/[0.03] border border-white/[0.08] focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/20 rounded-[12px] px-3.5 text-[15px] text-white placeholder-white/30 transition-all outline-none font-mono"
      />
    </div>
  );
}

function CalcResultItem({ label, value, color }) {
  return (
    <div>
      <span className="text-white/40 block text-[11px]">{label}</span>
      <span
        className="font-semibold text-[14px]"
        style={{ color: color || "#fff" }}
      >
        {value}
      </span>
    </div>
  );
}
