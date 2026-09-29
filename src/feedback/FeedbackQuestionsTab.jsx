import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Star,
  ListChecks,
  MessageSquare,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";

const typeMeta = {
  star: { icon: Star, label: "Star", color: "#FFD60A" },
  mcq: { icon: ListChecks, label: "MCQ", color: "#A390FF" },
  text: { icon: MessageSquare, label: "Text", color: "#3B9CFF" },
};

const btnPrimary =
  "bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] hover:from-[#9B7EFF] hover:to-[#7C5CFF] text-white shadow-[0_10px_28px_-10px_rgba(124,92,255,0.6)]";

const inputBase =
  "w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-[12px] px-4 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-[#7C5CFF]/60 focus:ring-2 focus:ring-[#7C5CFF]/15 transition-colors";

export default function FeedbackQuestionsTab({ companyId, showToast }) {
  const toast = (msg, type = "success") => {
    if (showToast) showToast(msg, type);
  };
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const askConfirm = (title, message, onConfirm) =>
    setConfirmDialog({ title, message, onConfirm });
  const closeConfirm = () => setConfirmDialog(null);
  const handleConfirm = async () => {
    if (confirmDialog?.onConfirm) await confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("fb_questions")
      .select("*")
      .eq("company_id", companyId)
      .order("sort_order", { ascending: true });
    setQuestions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (companyId) load();
  }, [companyId]);

  // reorder — swap sort_order with neighbor
  const move = async (q, dir) => {
    const idx = questions.findIndex((x) => x.id === q.id);
    const swapWith = dir === "up" ? questions[idx - 1] : questions[idx + 1];
    if (!swapWith) return;

    const a = { ...q, sort_order: swapWith.sort_order };
    const b = { ...swapWith, sort_order: q.sort_order };

    // optimistic
    const next = [...questions];
    next[idx] = b;
    next[idx + dir === "up" ? idx - 1 : idx + 1] = a;
    next.sort((x, y) => x.sort_order - y.sort_order);
    setQuestions(next);

    const [r1, r2] = await Promise.all([
      supabase
        .from("fb_questions")
        .update({ sort_order: a.sort_order })
        .eq("id", a.id),
      supabase
        .from("fb_questions")
        .update({ sort_order: b.sort_order })
        .eq("id", b.id),
    ]);

    if (r1.error || r2.error) {
      toast("Failed to reorder", "error");
      load();
      return;
    }
    toast("Order updated");
    load();
  };

  const toggleActive = async (q) => {
    const { error } = await supabase
      .from("fb_questions")
      .update({ active: !q.active })
      .eq("id", q.id);
    if (error) {
      toast(`Failed to update: ${error.message}`, "error");
      return;
    }
    toast(`Question ${!q.active ? "shown in flow" : "hidden from flow"}`);
    load();
  };

  const remove = (q) => {
    const label = q.text_en || q.text_ur || "this question";
    askConfirm(
      "Delete Question?",
      `"${label}" will be permanently removed. Any answers customers already gave for it will also be deleted.`,
      async () => {
        const { error } = await supabase
          .from("fb_questions")
          .delete()
          .eq("id", q.id);
        if (error) {
          toast(`Failed to delete: ${error.message}`, "error");
          return;
        }
        toast("Question deleted");
        load();
      }
    );
  };

  const startNew = () => {
    setEditing({
      id: null,
      code: null,
      text_en: "",
      text_ur: "",
      hint_en: "",
      hint_ur: "",
      type: "mcq",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      sort_order: (questions.at(-1)?.sort_order || 0) + 1,
      active: true,
      required: true,
      _isNew: true,
    });
  };

  const startEdit = (q) => setEditing({ ...q });

  const save = async () => {
    if (!editing) return;
    if (!editing.text_en?.trim() && !editing.text_ur?.trim()) {
      toast("Please provide question text.", "error");
      return;
    }
    if (editing.type === "mcq") {
      const opts = (editing.options || []).filter(
        (o) => o.label?.trim() && o.value?.trim()
      );
      if (opts.length < 2) {
        toast("MCQ needs at least 2 options.", "error");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        company_id: companyId,
        text_en: editing.text_en?.trim() || null,
        text_ur: editing.text_ur?.trim() || null,
        hint_en: editing.hint_en?.trim() || null,
        hint_ur: editing.hint_ur?.trim() || null,
        type: editing.type,
        options:
          editing.type === "mcq"
            ? editing.options
                .filter((o) => o.label?.trim() && o.value?.trim())
                .map((o) => ({
                  value: o.value.trim(),
                  label: o.label.trim(),
                }))
            : null,
        sort_order: editing.sort_order,
        active: editing.active,
        required: editing.required,
      };

      if (editing._isNew) {
        const { error } = await supabase.from("fb_questions").insert(payload);
        if (error) {
          toast(`Failed to create: ${error.message}`, "error");
          return;
        }
        toast("Question created");
      } else {
        const { error } = await supabase
          .from("fb_questions")
          .update(payload)
          .eq("id", editing.id);
        if (error) {
          toast(`Failed to save: ${error.message}`, "error");
          return;
        }
        toast("Question updated");
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-[16px] font-bold text-white">
            Feedback Questions
          </h4>
          <p className="text-[12px] text-white/50 mt-0.5">
            Add, edit, reorder, or hide questions. Order here = order in flow.
          </p>
        </div>
        <button
          onClick={startNew}
          className={`h-11 px-4 rounded-[12px] text-[13px] font-semibold flex items-center gap-2 border border-[#7C5CFF]/40 ${btnPrimary}`}
        >
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#A390FF] animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-[#1C1C1E] border border-white/[0.06] rounded-[20px] p-8 text-center">
          <p className="text-[15px] text-white/60">
            No questions configured yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => {
            const meta = typeMeta[q.type] || typeMeta.star;
            const Icon = meta.icon;
            const text = q.text_en || q.text_ur || "(untitled)";
            return (
              <div
                key={q.id}
                className={`bg-[#1C1C1E] border border-white/[0.06] rounded-[16px] p-3 flex items-center gap-3 ${
                  q.active ? "" : "opacity-55"
                }`}
              >
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => move(q, "up")}
                    disabled={i === 0}
                    className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-25 disabled:cursor-not-allowed"
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => move(q, "down")}
                    disabled={i === questions.length - 1}
                    className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-25 disabled:cursor-not-allowed"
                    aria-label="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-10 h-10 rounded-[12px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" style={{ color: meta.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                      Q{i + 1}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        background: `${meta.color}1A`,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                    {!q.active && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50">
                        Hidden
                      </span>
                    )}
                    {q.required && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FF453A]/10 text-[#FF6961] border border-[#FF453A]/20">
                        Required
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[14px] font-semibold text-white mt-0.5 truncate"
                    dir="auto"
                  >
                    {text}
                  </p>
                  {q.hint_en && (
                    <p className="text-[11px] text-white/40 truncate">
                      {q.hint_en}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(q)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      q.active
                        ? "bg-gradient-to-b from-[#42E366] to-[#28B94D]"
                        : "bg-white/[0.12]"
                    }`}
                    title={q.active ? "Hide from flow" : "Show in flow"}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        q.active ? "translate-x-4" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => startEdit(q)}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(q)}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-[#FF453A]/10 border border-white/[0.08] text-white/50 hover:text-[#FF6961] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <QuestionEditor
          editing={editing}
          setEditing={setEditing}
          onSave={save}
          saving={saving}
        />
      )}

      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          onCancel={closeConfirm}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

function QuestionEditor({ editing, setEditing, onSave, saving }) {
  const setField = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  const updateOption = (idx, k, v) => {
    const opts = [...(editing.options || [])];
    opts[idx] = { ...opts[idx], [k]: v };
    setField("options", opts);
  };
  const addOption = () => {
    const opts = [...(editing.options || [])];
    opts.push({ value: "", label: "" });
    setField("options", opts);
  };
  const removeOption = (idx) => {
    setField(
      "options",
      (editing.options || []).filter((_, i) => i !== idx)
    );
  };
  const autoValueFromLabel = (idx, label) => {
    updateOption(idx, "label", label);
    const v = label.trim().toLowerCase().replace(/\s+/g, "_");
    if (!editing.options[idx].value) updateOption(idx, "value", v);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="w-full sm:max-w-2xl bg-[#1C1C1E] border-t sm:border border-white/[0.08] rounded-t-[24px] sm:rounded-[20px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <h3 className="text-[17px] font-bold text-white">
            {editing._isNew ? "New Question" : "Edit Question"}
          </h3>
          <button
            onClick={() => setEditing(null)}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Type */}
          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "mcq", label: "MCQ", icon: ListChecks },
                { id: "star", label: "Star 1–5", icon: Star },
                { id: "text", label: "Text", icon: MessageSquare },
              ].map((t) => {
                const Icon = t.icon;
                const active = editing.type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setField("type", t.id)}
                    className={`h-12 rounded-[12px] text-[13px] font-semibold flex items-center justify-center gap-2 border transition-all ${
                      active
                        ? "bg-gradient-to-b from-[#8B6EFF] to-[#6B4FE8] border-[#7C5CFF]/40 text-white"
                        : "bg-white/[0.03] border-white/[0.08] text-white/70 hover:bg-white/[0.05]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text EN */}
          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Question (English)
            </label>
            <input
              type="text"
              value={editing.text_en || ""}
              onChange={(e) => setField("text_en", e.target.value)}
              placeholder="e.g. How was your overall experience?"
              className={inputBase}
              dir="ltr"
            />
          </div>

          {/* Text UR */}
          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Question (Urdu)
            </label>
            <input
              type="text"
              value={editing.text_ur || ""}
              onChange={(e) => setField("text_ur", e.target.value)}
              placeholder="مثال: آپ کا مجموعی تجربہ کیسا رہا؟"
              className={inputBase}
              dir="rtl"
            />
          </div>

          {/* Hint EN */}
          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Hint (English) — optional
            </label>
            <input
              type="text"
              value={editing.hint_en || ""}
              onChange={(e) => setField("hint_en", e.target.value)}
              placeholder="Small caption under the question"
              className={inputBase}
            />
          </div>

          {/* MCQ options editor */}
          {editing.type === "mcq" && (
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Options
              </label>
              <div className="space-y-2">
                {(editing.options || []).map((o, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={o.label || ""}
                      onChange={(e) => autoValueFromLabel(i, e.target.value)}
                      placeholder={`Option ${i + 1} (label shown to customer)`}
                      className={`${inputBase} flex-1`}
                      dir="auto"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="p-3 rounded-[10px] bg-white/[0.04] hover:bg-[#FF453A]/10 border border-white/[0.08] text-white/50 hover:text-[#FF6961] shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="w-full h-11 rounded-[10px] bg-white/[0.03] hover:bg-white/[0.06] border border-dashed border-white/[0.12] text-[13px] font-semibold text-white/70 hover:text-white flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.required}
                onChange={(e) => setField("required", e.target.checked)}
                className="w-4 h-4 accent-[#7C5CFF]"
              />
              <span className="text-[14px] text-white/80">Required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setField("active", e.target.checked)}
                className="w-4 h-4 accent-[#7C5CFF]"
              />
              <span className="text-[14px] text-white/80">Active</span>
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-white/[0.06] flex gap-2 shrink-0">
          <button
            onClick={() => setEditing(null)}
            className="flex-1 h-12 rounded-[12px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[15px] font-semibold text-white/85"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className={`flex-1 h-12 rounded-[12px] text-[15px] font-semibold flex items-center justify-center gap-2 border border-[#7C5CFF]/40 disabled:opacity-60 ${btnPrimary}`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <div className="w-full max-w-md bg-[#1C1C1E] border border-white/[0.08] rounded-[20px] p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#FF453A]/10 border border-[#FF453A]/25 rounded-[14px] text-[#FF453A] shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-[14px] text-white/60 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-12 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-[14px] text-[15px] font-semibold text-white/85 transition-colors active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-12 bg-gradient-to-b from-[#FF6B60] to-[#E0382E] hover:from-[#FF7B70] hover:to-[#E0382E] text-white rounded-[14px] text-[15px] font-semibold transition-all shadow-[0_10px_28px_-10px_rgba(255,69,58,0.6)] active:scale-[0.98]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
