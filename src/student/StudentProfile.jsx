import React, { useState, useRef } from "react";
import StudentLayout from "./StudentLayout";
import { getStudentSession, getStudentProfile, saveStudentProfile } from "./studentStore";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year", "Post Graduate", "Alumni"];
const MAX_SIZE_MB = 2;

export default function StudentProfile() {
  const session = getStudentSession();
  const [profile, setProfile] = useState(() => getStudentProfile(session?.email || ""));
  const [saved,   setSaved]   = useState(false);
  const [errors,  setErrors]  = useState({});
  const [imgError, setImgError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError("");

    if (!file.type.startsWith("image/")) {
      setImgError("Please select an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setImgError(`Image must be under ${MAX_SIZE_MB} MB.`);
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height, 300);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const sx = (img.width  - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        const updated = { ...profile, avatar: dataUrl };
        setProfile(updated);
        // Auto-save avatar immediately so navbar updates right away
        saveStudentProfile(session?.email || "", updated);
        setUploading(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeAvatar = () => {
    const updated = { ...profile, avatar: "" };
    setProfile(updated);
    saveStudentProfile(session?.email || "", updated);
    setImgError("");
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!profile.name?.trim()) e.name = "Name is required";
    if (profile.phone && !/^\d{10}$/.test(profile.phone.trim()))
      e.phone = "Enter a valid 10-digit phone number";
    return e;
  };

  const handleSave = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    saveStudentProfile(session?.email || "", profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = (profile.name || "S").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <StudentLayout title="Profile">
      <div className="sd-page-header">
        <div>
          <div className="sd-page-header__title">My Profile</div>
          <div className="sd-page-header__sub">Manage your personal information and photo</div>
        </div>
      </div>

      <div className="sd-profile-grid">

        {/* ── Avatar card ── */}
        <div className="sd-card sd-avatar-card">

          {/* Instagram-style avatar */}
          <div className="sd-ig-avatar-wrap">
            {/* Gradient story ring — only shown when photo exists */}
            <div className={`sd-ig-ring${profile.avatar ? " sd-ig-ring--active" : ""}`}>
              <button
                type="button"
                className="sd-ig-avatar-btn"
                onClick={handleAvatarClick}
                title="Change photo"
                aria-label="Change profile photo"
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="sd-ig-photo" />
                ) : (
                  <div className="sd-ig-initials">{initials}</div>
                )}

                {/* Camera overlay on hover */}
                <div className="sd-ig-overlay">
                  {uploading ? (
                    <span className="sd-ig-spinner" />
                  ) : (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <span className="sd-ig-overlay__label">Change Photo</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Edit badge — bottom right */}
            <div className="sd-ig-edit-badge" onClick={handleAvatarClick} title="Edit photo">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />

          {/* Name + meta */}
          <div className="sd-avatar-info">
            <div className="sd-avatar-info__name">{profile.name || "Student"}</div>
            <div className="sd-avatar-info__email">{profile.email}</div>
            {profile.college && <div className="sd-avatar-info__college">{profile.college}</div>}
            {profile.year && (
              <span className="sd-badge sd-badge--blue" style={{ marginTop: 6, display: "inline-flex" }}>
                {profile.year}
              </span>
            )}
          </div>

          {/* Upload hint */}
          <p className="sd-ig-hint">JPG, PNG or WebP · max {MAX_SIZE_MB} MB</p>

          {/* Remove button */}
          {profile.avatar && (
            <button type="button" onClick={removeAvatar} className="sd-ig-remove-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Remove photo
            </button>
          )}

          {imgError && (
            <div className="sd-avatar-error">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {imgError}
            </div>
          )}

          <div className="sd-avatar-footer">
            Member since your first order.{" "}
            <a href="https://webxter.in" style={{ color: "#009fd4" }}>webxter.in</a>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="sd-card">
          <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#0f172a", marginBottom: 20 }}>Personal Information</div>
          <form onSubmit={handleSave} className="sd-form" noValidate>
            <div className="sd-form__grid">
              <div className="sd-field">
                <label className="sd-field__label">Full Name *</label>
                <input className={`sd-field__input${errors.name ? " sd-field__input--error" : ""}`}
                  placeholder="Rahul Sharma" value={profile.name || ""} onChange={set("name")} />
                {errors.name && <p style={{ fontSize: ".75rem", color: "#ef4444" }}>{errors.name}</p>}
              </div>
              <div className="sd-field">
                <label className="sd-field__label">Email Address</label>
                <input type="email" className="sd-field__input" value={profile.email || ""} readOnly
                  style={{ background: "#f8f9fb", cursor: "not-allowed" }} />
                <p className="sd-field__hint">Email cannot be changed</p>
              </div>
              <div className="sd-field">
                <label className="sd-field__label">Phone Number</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="tel"
                    className={`sd-field__input${errors.phone ? " sd-field__input--error" : ""}`}
                    placeholder="9876543210"
                    maxLength={10}
                    value={profile.phone || ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setProfile((p) => ({ ...p, phone: digits }));
                      setErrors((er) => ({ ...er, phone: "" }));
                    }}
                  />
                  <span style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    fontSize: ".7rem", color: (profile.phone?.length || 0) === 10 ? "#22c55e" : "#94a3b8",
                    fontWeight: 600, pointerEvents: "none" , display: "none"
                  }}>
                    {profile.phone?.length || 0}/10
                  </span>
                </div>
                {errors.phone
                  ? <p style={{ fontSize: ".75rem", color: "#ef4444", marginTop: 2 }}>{errors.phone}</p>
                  : <p className="sd-field__hint">10-digit mobile number</p>
                }
              </div>
              <div className="sd-field">
                <label className="sd-field__label">College / University</label>
                <input className="sd-field__input" placeholder="IIT Delhi"
                  value={profile.college || ""} onChange={set("college")} />
              </div>
              <div className="sd-field">
                <label className="sd-field__label">Year of Study</label>
                <select className="sd-field__input" value={profile.year || ""} onChange={set("year")}>
                  <option value="">Select year</option>
                  {YEARS.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="sd-field">
              <label className="sd-field__label">Bio (optional)</label>
              <textarea className="sd-field__input" placeholder="Tell us a bit about yourself..."
                value={profile.bio || ""} onChange={set("bio")} rows={3} />
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
              {saved && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#16a34a", fontSize: ".875rem", fontWeight: 600 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Profile saved!
                </div>
              )}
              <button type="submit" className="sd-btn sd-btn--primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account info */}
      <div className="sd-card" style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#0f172a", marginBottom: 16 }}>Account Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          {[
            { label: "Login Method", value: "Email + Password" },
            { label: "Account Type", value: "Student" },
            { label: "WhatsApp",     value: "+91-8264796534"   },
            { label: "Email",        value: "projects@webxter.in" },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: ".7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: ".875rem", fontWeight: 600, color: "#334155" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

    </StudentLayout>
  );
}
