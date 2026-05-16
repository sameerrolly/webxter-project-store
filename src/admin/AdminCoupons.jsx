import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { getCoupons, addCoupon, updateCoupon, deleteCoupon, getAllStudents } from "./adminStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];

function getCouponStatus(c) {
  const now = new Date();
  const start  = c.startDate  ? new Date(c.startDate)  : null;
  const expiry = c.expiresAt  ? new Date(c.expiresAt)  : null;
  if (!c.active) return { label: "Inactive",  cls: "adm-badge--gray"   };
  if (expiry && expiry < now) return { label: "Expired",   cls: "adm-badge--red"    };
  if (start  && start  > now) return { label: "Scheduled", cls: "adm-badge--yellow" };
  return { label: "Active", cls: "adm-badge--green" };
}

function autoCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ─── Student multi-select dropdown ───────────────────────────────────────────
function StudentPicker({ selected, onChange }) {
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const ref = useRef(null);
  const students = getAllStudents();

  const filtered = students.filter((s) =>
    !selected.includes(s.email) &&
    (s.name.toLowerCase().includes(query.toLowerCase()) ||
     s.email.toLowerCase().includes(query.toLowerCase()) ||
     (s.college || "").toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const add = (email) => { onChange([...selected, email]); setQuery(""); };
  const remove = (email) => onChange(selected.filter((e) => e !== email));

  const getStudent = (email) => students.find((s) => s.email === email);

  return (
    <div className="adm-student-picker" ref={ref}>
      {/* Selected chips */}
      <div className="adm-student-picker__chips" onClick={() => setOpen(true)}>
        {selected.map((email) => {
          const s = getStudent(email);
          return (
            <span key={email} className="adm-student-chip">
              <span className="adm-student-chip__avatar">{(s?.name || email)[0].toUpperCase()}</span>
              <span className="adm-student-chip__name">{s?.name || email}</span>
              <button type="button" className="adm-student-chip__remove"
                onClick={(e) => { e.stopPropagation(); remove(email); }}>×</button>
            </span>
          );
        })}
        <input
          className="adm-student-picker__input"
          placeholder={selected.length === 0 ? "Search students by name, email or college…" : "Add more…"}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="adm-student-picker__dropdown">
          {filtered.length === 0 ? (
            <div className="adm-student-picker__empty">
              {query ? "No students match your search" : "All students already selected"}
            </div>
          ) : filtered.map((s) => (
            <button key={s.email} type="button" className="adm-student-picker__option"
              onClick={() => add(s.email)}>
              <span className="adm-student-picker__opt-avatar">{s.name[0].toUpperCase()}</span>
              <span className="adm-student-picker__opt-info">
                <span className="adm-student-picker__opt-name">{s.name}</span>
                <span className="adm-student-picker__opt-meta">{s.email} {s.college ? `· ${s.college}` : ""}</span>
              </span>
            </button>
          ))}
          {students.length > 0 && filtered.length > 0 && (
            <button type="button" className="adm-student-picker__all"
              onClick={() => { onChange(students.map((s) => s.email)); setOpen(false); }}>
              + Select all students ({students.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Coupon Form ──────────────────────────────────────────────────────────────
const EMPTY = {
  code: "", type: "percent", value: "",
  startDate: today(), expiresAt: "",
  maxUsesPerStudent: 1, totalQuantity: 0,
  minOrder: 0, active: true,
  description: "", applicableTo: "all",
  assignedStudents: [], // [] = all students
};

function CouponForm({ initial, onSave, onCancel, isEdit }) {
  const [form, setForm]     = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});
  const [assignMode, setAssignMode] = useState(
    initial?.assignedStudents?.length > 0 ? "specific" : "all"
  );

  const set    = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = "Code is required";
    if (!form.value || Number(form.value) <= 0) e.value = "Discount value required";
    if (form.type === "percent" && Number(form.value) > 100) e.value = "Cannot exceed 100%";
    if (form.startDate && form.expiresAt && form.expiresAt < form.startDate) e.expiresAt = "Expiry must be after start date";
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...form,
      value: Number(form.value),
      minOrder: Number(form.minOrder),
      maxUsesPerStudent: Number(form.maxUsesPerStudent),
      totalQuantity: Number(form.totalQuantity),
      assignedStudents: assignMode === "all" ? [] : form.assignedStudents,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="adm-form" noValidate>
      {/* ── Basic ── */}
      <div className="adm-card">
        <div className="adm-card__title">{isEdit ? "Edit Coupon" : "Create New Coupon"}</div>
        <div className="adm-form__grid">

          {/* Code */}
          <div className="adm-field">
            <label className="adm-field__label">Coupon Code *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className={`adm-field__input${errors.code ? " adm-field__input--error" : ""}`}
                placeholder="e.g. SUMMER30"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, "") }))}
                style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: 1, flex: 1 }}
              />
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm"
                style={{ flexShrink: 0 }}
                onClick={() => setForm((f) => ({ ...f, code: autoCode() }))}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Auto
              </button>
            </div>
            {errors.code && <p className="adm-field__error">{errors.code}</p>}
          </div>

          {/* Type */}
          <div className="adm-field">
            <label className="adm-field__label">Discount Type</label>
            <select className="adm-field__input" value={form.type} onChange={set("type")}>
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>

          {/* Value */}
          <div className="adm-field">
            <label className="adm-field__label">{form.type === "percent" ? "Discount %" : "Discount ₹"} *</label>
            <input type="number" className={`adm-field__input${errors.value ? " adm-field__input--error" : ""}`}
              placeholder={form.type === "percent" ? "20" : "500"}
              value={form.value} onChange={set("value")} min="1" max={form.type === "percent" ? 100 : undefined} />
            {errors.value && <p className="adm-field__error">{errors.value}</p>}
          </div>

          {/* Min order */}
          <div className="adm-field">
            <label className="adm-field__label">Minimum Order (₹)</label>
            <input type="number" className="adm-field__input" placeholder="0 = no minimum"
              value={form.minOrder} onChange={setNum("minOrder")} min="0" />
            <p className="adm-field__hint">0 = no minimum</p>
          </div>

          {/* Start date */}
          <div className="adm-field">
            <label className="adm-field__label">Start Date</label>
            <input type="date" className="adm-field__input" value={form.startDate} onChange={set("startDate")} />
          </div>

          {/* Expiry date */}
          <div className="adm-field">
            <label className="adm-field__label">Expiry Date</label>
            <input type="date" className={`adm-field__input${errors.expiresAt ? " adm-field__input--error" : ""}`}
              value={form.expiresAt} onChange={set("expiresAt")} />
            {errors.expiresAt && <p className="adm-field__error">{errors.expiresAt}</p>}
            <p className="adm-field__hint">Leave blank = no expiry</p>
          </div>

          {/* Max uses per student */}
          <div className="adm-field">
            <label className="adm-field__label">Max Uses Per Student</label>
            <input type="number" className="adm-field__input" placeholder="1"
              value={form.maxUsesPerStudent} onChange={setNum("maxUsesPerStudent")} min="1" />
            <p className="adm-field__hint">How many times one student can use this</p>
          </div>

          {/* Total quantity */}
          <div className="adm-field">
            <label className="adm-field__label">Total Quantity</label>
            <input type="number" className="adm-field__input" placeholder="0 = unlimited"
              value={form.totalQuantity} onChange={setNum("totalQuantity")} min="0" />
            <p className="adm-field__hint">0 = unlimited total uses</p>
          </div>

          {/* Description */}
          <div className="adm-field adm-form__full">
            <label className="adm-field__label">Internal Description</label>
            <input className="adm-field__input" placeholder="e.g. Summer campaign for final year students"
              value={form.description} onChange={set("description")} />
          </div>

          {/* Active toggle */}
          <div className="adm-field adm-form__full">
            <label className="adm-toggle">
              <div className={`adm-toggle__track ${form.active ? "adm-toggle__track--on" : ""}`}
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}>
                <div className="adm-toggle__thumb" />
              </div>
              <span className="adm-toggle__label">Active (students can use this coupon)</span>
            </label>
          </div>
        </div>

        {/* Live preview */}
        {form.code && form.value && (
          <div className="adm-coupon-preview">
            <div className="adm-coupon-preview__code">{form.code}</div>
            <div className="adm-coupon-preview__detail">
              <strong>{form.type === "percent" ? `${form.value}% off` : `₹${Number(form.value).toLocaleString("en-IN")} off`}</strong>
              {form.minOrder > 0 && ` · min ₹${Number(form.minOrder).toLocaleString("en-IN")}`}
              {form.totalQuantity > 0 && ` · ${form.totalQuantity} total`}
              {form.expiresAt && ` · expires ${form.expiresAt}`}
            </div>
          </div>
        )}
      </div>

      {/* ── Student assignment ── */}
      <div className="adm-card">
        <div className="adm-card__title">Assign to Students</div>
        <p style={{ fontSize: ".82rem", color: "#64748b", marginBottom: 14 }}>
          Choose who can use this coupon — all students or specific ones.
        </p>

        {/* Mode toggle */}
        <div className="adm-assign-tabs">
          {[["all", "All Students"], ["specific", "Specific Students"]].map(([val, label]) => (
            <button key={val} type="button"
              className={`adm-assign-tab${assignMode === val ? " adm-assign-tab--active" : ""}`}
              onClick={() => setAssignMode(val)}>
              {label}
            </button>
          ))}
        </div>

        {assignMode === "specific" && (
          <div style={{ marginTop: 14 }}>
            <StudentPicker
              selected={form.assignedStudents}
              onChange={(v) => setForm((f) => ({ ...f, assignedStudents: v }))}
            />
            {form.assignedStudents.length > 0 && (
              <p style={{ fontSize: ".75rem", color: "#64748b", marginTop: 8 }}>
                {form.assignedStudents.length} student{form.assignedStudents.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="adm-btn adm-btn--primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {isEdit ? "Save Changes" : "Create Coupon"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Coupons Page ────────────────────────────────────────────────────────
export default function AdminCoupons() {
  const [coupons, setCoupons]       = useState(() => getCoupons());
  const [view, setView]             = useState("list"); // "list" | "add" | "edit"
  const [editing, setEditing]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const students = getAllStudents();

  const refresh = () => setCoupons(getCoupons());

  const filtered = coupons.filter((c) => {
    const matchSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter === "all") return true;
    return getCouponStatus(c).label.toLowerCase() === statusFilter;
  });

  const stats = {
    total:     coupons.length,
    active:    coupons.filter((c) => getCouponStatus(c).label === "Active").length,
    scheduled: coupons.filter((c) => getCouponStatus(c).label === "Scheduled").length,
    expired:   coupons.filter((c) => getCouponStatus(c).label === "Expired").length,
    totalUses: coupons.reduce((s, c) => s + (c.usedCount || 0), 0),
  };

  const getStudentName = (email) => students.find((s) => s.email === email)?.name || email;

  // ── Edit view ──
  if (view === "edit" && editing) return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Edit Coupon</div>
          <div className="adm-page-header__sub">{editing.code}</div>
        </div>
        <button className="adm-btn adm-btn--ghost" onClick={() => { setView("list"); setEditing(null); }}>← Back</button>
      </div>
      <CouponForm initial={editing} isEdit={true}
        onSave={(data) => { updateCoupon(editing.id, data); refresh(); setView("list"); setEditing(null); }}
        onCancel={() => { setView("list"); setEditing(null); }} />
    </AdminLayout>
  );

  // ── Add view ──
  if (view === "add") return (
    <AdminLayout>
      <div className="adm-page-header">
        <div><div className="adm-page-header__title">New Coupon</div></div>
        <button className="adm-btn adm-btn--ghost" onClick={() => setView("list")}>← Back</button>
      </div>
      <CouponForm initial={EMPTY} isEdit={false}
        onSave={(data) => { addCoupon(data); refresh(); setView("list"); }}
        onCancel={() => setView("list")} />
    </AdminLayout>
  );

  // ── List view ──
  return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Coupons & Discounts</div>
          <div className="adm-page-header__sub">{coupons.length} coupons · {stats.active} active</div>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={() => setView("add")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="adm-stats" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Coupons", value: stats.total },
          { label: "Active",        value: stats.active,    color: "#16a34a" },
          { label: "Scheduled",     value: stats.scheduled, color: "#d97706" },
          { label: "Expired",       value: stats.expired,   color: "#dc2626" },
          { label: "Total Uses",    value: stats.totalUses },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card">
            <div className="adm-stat-card__label">{s.label}</div>
            <div className="adm-stat-card__value" style={{ fontSize: "1.5rem", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div className="adm-search" style={{ flex: 1, minWidth: 200 }}>
          <span className="adm-search__icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input className="adm-search__input" placeholder="Search by code or description…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "active", "scheduled", "expired", "inactive"].map((s) => (
            <button key={s} type="button"
              className={`adm-btn adm-btn--sm ${statusFilter === s ? "adm-btn--primary" : "adm-btn--ghost"}`}
              style={{ textTransform: "capitalize" }}
              onClick={() => setStatusFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="adm-card" style={{ padding: 0 }}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Date Range</th>
                <th>Usage</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="adm-empty">
                    <div className="adm-empty__icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                    </div>
                    <h3>No coupons found</h3>
                    <p>Try a different filter or create a new coupon.</p>
                  </div>
                </td></tr>
              ) : filtered.map((c) => {
                const status = getCouponStatus(c);
                const usedPct = c.totalQuantity > 0 ? Math.min(100, Math.round(((c.usedCount || 0) / c.totalQuantity) * 100)) : 0;
                return (
                  <tr key={c.id} style={{ cursor: "pointer" }}
                    onClick={() => { setEditing(c); setView("edit"); }}>

                    {/* Code */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="adm-coupon-code-badge">{c.code}</span>
                      </div>
                      {c.description && <div style={{ fontSize: ".72rem", color: "#94a3b8", marginTop: 3 }}>{c.description}</div>}
                    </td>

                    {/* Discount */}
                    <td>
                      <div style={{ fontWeight: 700, color: "#16a34a", fontSize: ".9rem" }}>
                        {c.type === "percent" ? `${c.value}%` : `₹${c.value.toLocaleString("en-IN")}`}
                        <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: ".75rem", marginLeft: 4 }}>off</span>
                      </div>
                      {c.minOrder > 0 && (
                        <div style={{ fontSize: ".72rem", color: "#94a3b8" }}>min ₹{c.minOrder.toLocaleString("en-IN")}</div>
                      )}
                    </td>

                    {/* Date range */}
                    <td>
                      <div style={{ fontSize: ".8rem", color: "#334155" }}>
                        <div>{c.startDate || "—"}</div>
                        <div style={{ color: "#94a3b8" }}>→ {c.expiresAt || "No expiry"}</div>
                      </div>
                    </td>

                    {/* Usage */}
                    <td>
                      <div style={{ fontSize: ".82rem" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{c.usedCount || 0}</span>
                        {c.totalQuantity > 0
                          ? <span style={{ color: "#94a3b8" }}> / {c.totalQuantity}</span>
                          : <span style={{ color: "#94a3b8" }}> / ∞</span>
                        }
                      </div>
                      {c.totalQuantity > 0 && (
                        <div style={{ marginTop: 5, height: 5, background: "#f1f5f9", borderRadius: 3, width: 80 }}>
                          <div style={{ height: "100%", borderRadius: 3, background: usedPct >= 90 ? "#ef4444" : "linear-gradient(45deg,#009fd4,#ff6eff)", width: `${usedPct}%`, transition: "width .3s" }} />
                        </div>
                      )}
                      {c.maxUsesPerStudent > 1 && (
                        <div style={{ fontSize: ".68rem", color: "#94a3b8", marginTop: 2 }}>{c.maxUsesPerStudent}× per student</div>
                      )}
                    </td>

                    {/* Assigned students */}
                    <td>
                      {!c.assignedStudents || c.assignedStudents.length === 0 ? (
                        <span className="adm-badge adm-badge--blue">All Students</span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 200 }}>
                          {c.assignedStudents.slice(0, 3).map((email) => (
                            <span key={email} className="adm-student-mini-chip" title={email}>
                              {getStudentName(email).split(" ")[0]}
                            </span>
                          ))}
                          {c.assignedStudents.length > 3 && (
                            <span className="adm-student-mini-chip adm-student-mini-chip--more">
                              +{c.assignedStudents.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td><span className={`adm-badge ${status.cls}`}>{status.label}</span></td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="adm-btn adm-btn--ghost adm-btn--sm adm-btn--icon" title="Edit"
                          onClick={(e) => { e.stopPropagation(); setEditing(c); setView("edit"); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="adm-btn adm-btn--ghost adm-btn--sm adm-btn--icon"
                          title={c.active ? "Deactivate" : "Activate"}
                          onClick={(e) => { e.stopPropagation(); updateCoupon(c.id, { active: !c.active }); refresh(); }}>
                          {c.active
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          }
                        </button>
                        <button className="adm-btn adm-btn--danger adm-btn--sm adm-btn--icon" title="Delete"
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.id); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 10, color: "#0f172a" }}>Delete Coupon?</div>
            <p style={{ color: "#64748b", fontSize: ".875rem", marginBottom: 24 }}>This coupon will be permanently deleted and can no longer be used.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="adm-btn adm-btn--ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="adm-btn adm-btn--danger" onClick={() => { deleteCoupon(confirmDelete); refresh(); setConfirmDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
