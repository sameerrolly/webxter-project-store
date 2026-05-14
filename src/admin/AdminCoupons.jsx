import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { getCoupons, addCoupon, updateCoupon, deleteCoupon } from "./adminStore";

const EMPTY = {
  code: "", type: "percent", value: "", minOrder: 0,
  maxUses: 0, active: true, expiresAt: "", description: "", applicableTo: "all",
};

function CouponForm({ initial, onSave, onCancel, isEdit }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));
  const setBool = (k) => setForm((f) => ({ ...f, [k]: !f[k] }));

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = "Code is required";
    if (!form.value || Number(form.value) <= 0) e.value = "Discount value required";
    if (form.type === "percent" && Number(form.value) > 100) e.value = "Percent cannot exceed 100";
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, value: Number(form.value), minOrder: Number(form.minOrder), maxUses: Number(form.maxUses) });
  };

  return (
    <form onSubmit={handleSubmit} className="adm-form" noValidate>
      <div className="adm-card">
        <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 18, color: "#0f172a" }}>
          {isEdit ? "Edit Coupon" : "New Coupon"}
        </div>
        <div className="adm-form__grid">
          {/* Code */}
          <div className="adm-field">
            <label className="adm-field__label">Coupon Code *</label>
            <input className={`adm-field__input${errors.code ? " adm-field__input--error" : ""}`}
              placeholder="e.g. STUDENT20" value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }} />
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
            <label className="adm-field__label">
              {form.type === "percent" ? "Discount %" : "Discount Amount (₹)"} *
            </label>
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
            <p className="adm-field__hint">0 means no minimum order required</p>
          </div>

          {/* Max uses */}
          <div className="adm-field">
            <label className="adm-field__label">Max Uses</label>
            <input type="number" className="adm-field__input" placeholder="0 = unlimited"
              value={form.maxUses} onChange={setNum("maxUses")} min="0" />
            <p className="adm-field__hint">0 means unlimited uses</p>
          </div>

          {/* Expires */}
          <div className="adm-field">
            <label className="adm-field__label">Expiry Date</label>
            <input type="date" className="adm-field__input" value={form.expiresAt} onChange={set("expiresAt")} />
            <p className="adm-field__hint">Leave blank for no expiry</p>
          </div>

          {/* Applies to */}
          <div className="adm-field">
            <label className="adm-field__label">Applies To</label>
            <select className="adm-field__input" value={form.applicableTo} onChange={set("applicableTo")}>
              <option value="all">All Projects</option>
              <option value="Web Development">Web Development only</option>
              <option value="Mobile">Mobile only</option>
              <option value="AI/ML">AI/ML only</option>
              <option value="Data Science">Data Science only</option>
            </select>
          </div>

          {/* Description */}
          <div className="adm-field adm-form__full">
            <label className="adm-field__label">Internal Description</label>
            <input className="adm-field__input" placeholder="e.g. Student discount campaign Q1 2025"
              value={form.description} onChange={set("description")} />
          </div>

          {/* Active toggle */}
          <div className="adm-field adm-form__full">
            <label className="adm-toggle">
              <div className={`adm-toggle__track ${form.active ? "adm-toggle__track--on" : ""}`} onClick={() => setBool("active")}>
                <div className="adm-toggle__thumb" />
              </div>
              <span className="adm-toggle__label">Active (customers can use this coupon)</span>
            </label>
          </div>
        </div>

        {/* Preview */}
        {form.code && form.value && (
          <div style={{ marginTop: 16, background: "rgba(0,159,212,.06)", border: "1px solid rgba(0,159,212,.2)", borderRadius: 10, padding: "12px 16px", fontSize: ".85rem", color: "#334155" }}>
            <strong style={{ color: "#009fd4" }}>{form.code}</strong> gives{" "}
            <strong>{form.type === "percent" ? `${form.value}% off` : `₹${Number(form.value).toLocaleString("en-IN")} off`}</strong>
            {form.minOrder > 0 && ` on orders above ₹${Number(form.minOrder).toLocaleString("en-IN")}`}
            {form.maxUses > 0 && ` · max ${form.maxUses} uses`}
            {form.expiresAt && ` · expires ${form.expiresAt}`}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="adm-btn adm-btn--primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {isEdit ? "Save Changes" : "Create Coupon"}
        </button>
      </div>
    </form>
  );
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState(() => getCoupons());
  const [view, setView] = useState("list"); // "list" | "add" | "edit"
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState("");

  const refresh = () => setCoupons(getCoupons());

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const isExpired = (c) => c.expiresAt && new Date(c.expiresAt) < new Date();
  const isExhausted = (c) => c.maxUses > 0 && c.usedCount >= c.maxUses;

  const getStatus = (c) => {
    if (!c.active) return { label: "Inactive", cls: "adm-badge--gray" };
    if (isExpired(c)) return { label: "Expired", cls: "adm-badge--red" };
    if (isExhausted(c)) return { label: "Exhausted", cls: "adm-badge--red" };
    return { label: "Active", cls: "adm-badge--green" };
  };

  const totalSavings = coupons.reduce((s, c) => {
    if (c.type === "flat") return s + (c.usedCount * c.value);
    return s; // percent savings harder to calc without order data
  }, 0);

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

  if (view === "edit" && editing) return (
    <AdminLayout>
      <div className="adm-page-header">
        <div><div className="adm-page-header__title">Edit Coupon</div><div className="adm-page-header__sub">{editing.code}</div></div>
        <button className="adm-btn adm-btn--ghost" onClick={() => setView("list")}>← Back</button>
      </div>
      <CouponForm initial={editing} isEdit={true}
        onSave={(data) => { updateCoupon(editing.id, data); refresh(); setView("list"); }}
        onCancel={() => setView("list")} />
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Coupons & Discounts</div>
          <div className="adm-page-header__sub">{coupons.length} coupons · {coupons.filter((c) => c.active && !isExpired(c) && !isExhausted(c)).length} active</div>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={() => setView("add")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="adm-stats" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Coupons", value: coupons.length },
          { label: "Active", value: coupons.filter((c) => c.active && !isExpired(c) && !isExhausted(c)).length },
          { label: "Total Uses", value: coupons.reduce((s, c) => s + (c.usedCount || 0), 0) },
          { label: "Flat Savings Given", value: `₹${totalSavings.toLocaleString("en-IN")}` },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card">
            <div className="adm-stat-card__label">{s.label}</div>
            <div className="adm-stat-card__value" style={{ fontSize: "1.5rem" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <div className="adm-search">
          <span className="adm-search__icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          <input className="adm-search__input" placeholder="Search coupons..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="adm-card" style={{ padding: 0 }}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Code</th><th>Type</th><th>Discount</th><th>Min Order</th>
                <th>Uses</th><th>Expires</th><th>Applies To</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9}>
                  <div className="adm-empty">
                    <div className="adm-empty__icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                    </div>
                    <h3>No coupons found</h3>
                    <p>Create your first coupon to get started.</p>
                  </div>
                </td></tr>
              ) : filtered.map((c) => {
                const status = getStatus(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: ".9rem", color: "#009fd4", background: "rgba(0,159,212,.08)", padding: "3px 10px", borderRadius: 6, letterSpacing: 1 }}>{c.code}</span>
                      </div>
                      {c.description && <div style={{ fontSize: ".72rem", color: "#94a3b8", marginTop: 3 }}>{c.description}</div>}
                    </td>
                    <td><span className="adm-badge adm-badge--blue">{c.type === "percent" ? "%" : "₹"}</span></td>
                    <td style={{ fontWeight: 700, color: "#16a34a" }}>
                      {c.type === "percent" ? `${c.value}% off` : `₹${c.value.toLocaleString("en-IN")} off`}
                    </td>
                    <td style={{ fontSize: ".82rem", color: "#64748b" }}>
                      {c.minOrder > 0 ? `₹${c.minOrder.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td>
                      <div style={{ fontSize: ".82rem" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{c.usedCount || 0}</span>
                        {c.maxUses > 0 && <span style={{ color: "#94a3b8" }}> / {c.maxUses}</span>}
                        {c.maxUses === 0 && <span style={{ color: "#94a3b8" }}> / ∞</span>}
                      </div>
                      {c.maxUses > 0 && (
                        <div style={{ marginTop: 4, height: 4, background: "#f1f5f9", borderRadius: 2, width: 60 }}>
                          <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(45deg,#009fd4,#ff6eff)", width: `${Math.min(100, Math.round((c.usedCount / c.maxUses) * 100))}%` }} />
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: ".8rem", color: isExpired(c) ? "#ef4444" : "#64748b" }}>
                      {c.expiresAt || "Never"}
                    </td>
                    <td style={{ fontSize: ".78rem", color: "#64748b" }}>{c.applicableTo === "all" ? "All" : c.applicableTo}</td>
                    <td><span className={`adm-badge ${status.cls}`}>{status.label}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="adm-btn adm-btn--ghost adm-btn--sm adm-btn--icon" title="Edit"
                          onClick={() => { setEditing(c); setView("edit"); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="adm-btn adm-btn--ghost adm-btn--sm adm-btn--icon" title={c.active ? "Deactivate" : "Activate"}
                          onClick={() => { updateCoupon(c.id, { active: !c.active }); refresh(); }}>
                          {c.active
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          }
                        </button>
                        <button className="adm-btn adm-btn--danger adm-btn--sm adm-btn--icon" title="Delete"
                          onClick={() => setConfirmDelete(c.id)}>
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
            <p style={{ color: "#64748b", fontSize: ".875rem", marginBottom: 24 }}>This coupon will be permanently deleted and can no longer be used by customers.</p>
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
