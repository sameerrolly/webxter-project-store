import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { getProjects, saveProjects, addProject, updateProject, deleteProject } from "./adminStore";

const CATEGORIES = ["Web Development", "Mobile", "Data Science", "AI/ML", "Desktop", "IoT"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const BADGES = ["", "Popular", "Hot", "New"];

const LEVEL_COLORS = { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444", Expert: "#8b5cf6" };

// ─── Tag input ────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");
  const addTag = (val) => {
    const t = val.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };
  return (
    <div className="adm-tags" onClick={(e) => e.currentTarget.querySelector("input")?.focus()}>
      {tags.map((t) => (
        <span key={t} className="adm-tag-chip">
          {t}
          <button type="button" className="adm-tag-chip__remove" onClick={() => onChange(tags.filter((x) => x !== t))}>×</button>
        </span>
      ))}
      <input
        className="adm-tags__input"
        placeholder="Add tag, press Enter"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); addTag(input); }
          if (e.key === "Backspace" && !input && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={() => { if (input.trim()) addTag(input); }}
      />
    </div>
  );
}

// ─── Media manager (images + video) ──────────────────────────────────────────
const FILE_TYPES = [
  { value: "github", label: "GitHub", icon: "⌥" },
  { value: "drive", label: "Google Drive", icon: "▲" },
  { value: "zip", label: "ZIP Download", icon: "⬇" },
  { value: "docs", label: "Documentation", icon: "📋" },
  { value: "demo", label: "Live Demo", icon: "▶" },
  { value: "other", label: "Other Link", icon: "🔗" },
];

function MediaManager({ media, demoVideo, onMediaChange, onVideoChange }) {
  const [urlInput, setUrlInput] = useState("");
  const [captionInput, setCaptionInput] = useState("");
  const [typeInput, setTypeInput] = useState("image");

  const addMedia = () => {
    const u = urlInput.trim();
    if (!u) return;
    const newItem = { type: typeInput, url: u, caption: captionInput.trim(), featured: media.length === 0 };
    onMediaChange([...media, newItem]);
    setUrlInput(""); setCaptionInput("");
  };

  const setFeatured = (idx) => {
    onMediaChange(media.map((m, i) => ({ ...m, featured: i === idx })));
  };

  const removeMedia = (idx) => {
    const updated = media.filter((_, i) => i !== idx);
    // if removed was featured, make first featured
    if (media[idx]?.featured && updated.length > 0) updated[0].featured = true;
    onMediaChange(updated);
  };

  // detect YouTube embed
  const getYouTubeId = (url) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return m ? m[1] : null;
  };

  return (
    <div>
      {/* Demo video URL */}
      <div className="adm-field" style={{ marginBottom: 16 }}>
        <label className="adm-field__label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: 5 }}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
          Featured Demo Video URL (YouTube or direct .mp4)
        </label>
        <input className="adm-field__input" placeholder="https://youtube.com/watch?v=... or https://example.com/demo.mp4"
          value={demoVideo || ""} onChange={(e) => onVideoChange(e.target.value)} />
        <p className="adm-field__hint">This video plays as the featured media on the product page</p>
        {demoVideo && getYouTubeId(demoVideo) && (
          <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", maxWidth: 320, border: "1px solid #e2e8f0" }}>
            <img src={`https://img.youtube.com/vi/${getYouTubeId(demoVideo)}/mqdefault.jpg`} alt="YouTube preview" style={{ width: "100%", display: "block" }} />
            <div style={{ padding: "6px 10px", fontSize: ".75rem", color: "#64748b", background: "#f8f9fb" }}>YouTube preview</div>
          </div>
        )}
      </div>

      {/* Media gallery */}
      <label className="adm-field__label" style={{ marginBottom: 8, display: "block" }}>
        Screenshots / Images
        <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6 }}>— click ★ to set as featured</span>
      </label>

      <div className="adm-screenshots" style={{ marginBottom: 12 }}>
        {media.map((item, i) => (
          <div key={i} style={{ position: "relative", width: 110, flexShrink: 0 }}>
            <div style={{ width: 110, height: 76, borderRadius: 8, overflow: "hidden", border: `2px solid ${item.featured ? "#009fd4" : "#e2e8f0"}`, position: "relative" }}>
              {item.type === "video"
                ? <div style={{ width: "100%", height: "100%", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                  </div>
                : <img src={item.url} alt={item.caption || `Media ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.src = `https://picsum.photos/seed/${i}/110/76`; }} />
              }
              {item.featured && (
                <div style={{ position: "absolute", top: 3, left: 3, background: "linear-gradient(45deg,#009fd4,#ff6eff)", color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: ".65rem", fontWeight: 700 }}>FEATURED</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              <button type="button" title="Set as featured"
                onClick={() => setFeatured(i)}
                style={{ flex: 1, background: item.featured ? "linear-gradient(45deg,#009fd4,#ff6eff)" : "#f1f5f9", color: item.featured ? "#fff" : "#64748b", border: "none", borderRadius: 5, padding: "3px 0", fontSize: ".68rem", cursor: "pointer", fontWeight: 600 }}>
                ★
              </button>
              <button type="button" title="Remove"
                onClick={() => removeMedia(i)}
                style={{ flex: 1, background: "rgba(239,68,68,.1)", color: "#ef4444", border: "none", borderRadius: 5, padding: "3px 0", fontSize: ".68rem", cursor: "pointer" }}>
                ✕
              </button>
            </div>
            {item.caption && <div style={{ fontSize: ".65rem", color: "#94a3b8", marginTop: 2, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.caption}</div>}
          </div>
        ))}
      </div>

      {/* Add media */}
      <div style={{ background: "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="adm-field__input" style={{ width: "auto", flex: "0 0 120px" }} value={typeInput} onChange={(e) => setTypeInput(e.target.value)}>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <input className="adm-field__input" style={{ flex: 1, minWidth: 200 }}
            placeholder={typeInput === "image" ? "Image URL (https://...)" : "Video URL (.mp4 or YouTube)"}
            value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMedia(); } }} />
          <input className="adm-field__input" style={{ flex: "0 0 160px" }}
            placeholder="Caption (optional)" value={captionInput}
            onChange={(e) => setCaptionInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMedia(); } }} />
          <button type="button" className="adm-btn adm-btn--primary adm-btn--sm" onClick={addMedia}>Add</button>
        </div>
        <p className="adm-field__hint">For demo images: https://picsum.photos/seed/YOURNAME/800/500</p>
      </div>
    </div>
  );
}

// ─── Project files manager ────────────────────────────────────────────────────
function ProjectFilesManager({ files, onChange }) {
  const [urlInput, setUrlInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [typeInput, setTypeInput] = useState("github");

  const addFile = () => {
    const u = urlInput.trim();
    const l = labelInput.trim();
    if (!u || !l) return;
    onChange([...files, { url: u, label: l, type: typeInput }]);
    setUrlInput(""); setLabelInput("");
  };

  const FILE_ICONS = {
    github: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
    drive: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9H9l-3-9H2"/><path d="M5.45 5.11L2 12h3l3-6.89M19.55 5.11L23 12h-3l-3-6.89"/><path d="M12 2L8.5 8.5h7L12 2z"/></svg>,
    zip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    docs: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    demo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
    other: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  };

  const TYPE_COLORS = {
    github: "#0f172a", drive: "#1a73e8", zip: "#16a34a",
    docs: "#d97706", demo: "#009fd4", other: "#64748b",
  };

  return (
    <div>
      {/* Existing files */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px" }}>
              <span style={{ color: TYPE_COLORS[f.type] || "#64748b", display: "flex", alignItems: "center", flexShrink: 0 }}>{FILE_ICONS[f.type] || FILE_ICONS.other}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: ".875rem", color: "#0f172a" }}>{f.label}</div>
                <div style={{ fontSize: ".72rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.url}</div>
              </div>
              <span className="adm-badge adm-badge--gray" style={{ fontSize: ".65rem", flexShrink: 0 }}>{f.type}</span>
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn--ghost adm-btn--sm adm-btn--icon" title="Open link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <button type="button" className="adm-btn adm-btn--danger adm-btn--sm adm-btn--icon" onClick={() => onChange(files.filter((_, j) => j !== i))}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add file */}
      <div style={{ background: "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="adm-field__input" style={{ width: "auto", flex: "0 0 140px" }} value={typeInput} onChange={(e) => setTypeInput(e.target.value)}>
            {FILE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input className="adm-field__input" style={{ flex: "0 0 200px" }}
            placeholder="Label (e.g. Source Code)" value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFile(); } }} />
          <input className="adm-field__input" style={{ flex: 1, minWidth: 200 }}
            placeholder="URL (https://...)" value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFile(); } }} />
          <button type="button" className="adm-btn adm-btn--primary adm-btn--sm" onClick={addFile}>Add</button>
        </div>
        <p className="adm-field__hint">Add GitHub repos, Google Drive links, ZIP downloads, live demos, or documentation links</p>
      </div>
    </div>
  );
}

// ─── Feature / Include list editor ───────────────────────────────────────────
function ListEditor({ items, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !items.includes(v)) { onChange([...items, v]); setInput(""); }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 10px", fontSize: ".8rem", color: "#334155" }}>
            {item}
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: ".9rem", lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="adm-field__input" placeholder={placeholder} value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          style={{ flex: 1 }} />
        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={add}>Add</button>
      </div>
    </div>
  );
}

// ─── Project Form (shared for Add + Edit) ────────────────────────────────────
function ProjectForm({ initial, onSave, onCancel, isEdit }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setVal = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = "Title is required";
    if (!form.description?.trim()) e.description = "Description is required";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = "Valid price required";
    if (!form.originalPrice || isNaN(form.originalPrice)) e.originalPrice = "Valid original price required";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...form,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice),
      tags: form.tags || [],
      features: form.features || [],
      includes: form.includes || [],
      screenshots: form.screenshots || [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="adm-form" noValidate>
      {/* Basic info */}
      <div className="adm-card">
        <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 18, color: "#0f172a" }}>Basic Information</div>
        <div className="adm-form__grid">
          <div className="adm-field adm-form__full">
            <label className="adm-field__label">Project Title *</label>
            <input className={`adm-field__input ${errors.title ? "adm-field__input--error" : ""}`}
              placeholder="e.g. Library Management System" value={form.title || ""} onChange={set("title")} />
            {errors.title && <p className="adm-field__error">{errors.title}</p>}
          </div>
          <div className="adm-field">
            <label className="adm-field__label">Category</label>
            <select className="adm-field__input" value={form.category || "Web Development"} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="adm-field">
            <label className="adm-field__label">Level</label>
            <select className="adm-field__input" value={form.level || "Intermediate"} onChange={set("level")}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="adm-field">
            <label className="adm-field__label">Delivery Time</label>
            <input className="adm-field__input" placeholder="e.g. 1 week" value={form.delivery || ""} onChange={set("delivery")} />
          </div>
          <div className="adm-field">
            <label className="adm-field__label">Badge</label>
            <select className="adm-field__input" value={form.badge || ""} onChange={set("badge")}>
              {BADGES.map((b) => <option key={b} value={b}>{b || "None"}</option>)}
            </select>
          </div>
          <div className="adm-field adm-form__full">
            <label className="adm-field__label">Short Description *</label>
            <textarea className={`adm-field__input ${errors.description ? "adm-field__input--error" : ""}`}
              placeholder="One-line description shown on cards" value={form.description || ""} onChange={set("description")} rows={2} />
            {errors.description && <p className="adm-field__error">{errors.description}</p>}
          </div>
          <div className="adm-field adm-form__full">
            <label className="adm-field__label">Long Description</label>
            <textarea className="adm-field__input" placeholder="Detailed description shown on product page"
              value={form.longDesc || ""} onChange={set("longDesc")} rows={4} />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="adm-card">
        <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 18, color: "#0f172a" }}>Pricing</div>
        <div className="adm-form__grid">
          <div className="adm-field">
            <label className="adm-field__label">Sale Price (₹) *</label>
            <input type="number" className={`adm-field__input ${errors.price ? "adm-field__input--error" : ""}`}
              placeholder="9999" value={form.price || ""} onChange={set("price")} min="0" />
            {errors.price && <p className="adm-field__error">{errors.price}</p>}
          </div>
          <div className="adm-field">
            <label className="adm-field__label">Original Price (₹) *</label>
            <input type="number" className={`adm-field__input ${errors.originalPrice ? "adm-field__input--error" : ""}`}
              placeholder="15000" value={form.originalPrice || ""} onChange={set("originalPrice")} min="0" />
            {errors.originalPrice && <p className="adm-field__error">{errors.originalPrice}</p>}
          </div>
          {form.price && form.originalPrice && Number(form.originalPrice) > 0 && (
            <div className="adm-field" style={{ gridColumn: "1/-1" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,.2)", borderRadius: 8, padding: "8px 14px", fontSize: ".85rem", fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)}% discount applied
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tech stack */}
      <div className="adm-card">
        <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 18, color: "#0f172a" }}>Tech Stack & Features</div>
        <div className="adm-form__grid">
          <div className="adm-field adm-form__full">
            <label className="adm-field__label">Technologies / Tags</label>
            <TagInput tags={form.tags || []} onChange={(v) => setVal("tags", v)} />
            <p className="adm-field__hint">Press Enter or comma to add</p>
          </div>
          <div className="adm-field adm-form__full">
            <label className="adm-field__label">Key Features</label>
            <ListEditor items={form.features || []} onChange={(v) => setVal("features", v)} placeholder="e.g. Book Catalog" />
          </div>
          <div className="adm-field adm-form__full">
            <label className="adm-field__label">What's Included</label>
            <ListEditor items={form.includes || []} onChange={(v) => setVal("includes", v)} placeholder="e.g. Full Source Code" />
          </div>
        </div>
      </div>

      {/* Screenshots */}
      <div className="adm-card">
        <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 18, color: "#0f172a" }}>Media Gallery</div>
        <MediaManager
          media={form.media || []}
          demoVideo={form.demoVideo || ""}
          onMediaChange={(v) => {
            setVal("media", v);
            // keep legacy screenshots in sync
            setVal("screenshots", v.filter((m) => m.type === "image").map((m) => m.url));
          }}
          onVideoChange={(v) => setVal("demoVideo", v)}
        />
      </div>

      {/* Project files */}
      <div className="adm-card">
        <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 6, color: "#0f172a" }}>Project Files & Links</div>
        <p style={{ fontSize: ".82rem", color: "#64748b", marginBottom: 16 }}>
          Add GitHub repos, Google Drive links, ZIP downloads, live demos, or documentation. These are shown on the product page and delivered to customers after purchase.
        </p>
        <ProjectFilesManager
          files={form.projectFiles || []}
          onChange={(v) => setVal("projectFiles", v)}
        />
      </div>

      {/* Status */}
      <div className="adm-card">
        <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 18, color: "#0f172a" }}>Visibility</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <label className="adm-toggle">
            <div className={`adm-toggle__track ${form.active ? "adm-toggle__track--on" : ""}`} onClick={() => setVal("active", !form.active)}>
              <div className="adm-toggle__thumb" />
            </div>
            <span className="adm-toggle__label">Active (visible on store)</span>
          </label>
          <label className="adm-toggle">
            <div className={`adm-toggle__track ${form.soldOut ? "adm-toggle__track--on" : ""}`} onClick={() => setVal("soldOut", !form.soldOut)}>
              <div className="adm-toggle__thumb" />
            </div>
            <span className="adm-toggle__label">Mark as Sold Out</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="adm-btn adm-btn--primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {isEdit ? "Save Changes" : "Add Project"}
        </button>
      </div>
    </form>
  );
}

// ─── Projects List ────────────────────────────────────────────────────────────
export function AdminProjectsList() {
  const [projects, setProjects] = useState(() => getProjects());
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id) => {
    deleteProject(id);
    setProjects(getProjects());
    setConfirmDelete(null);
  };

  const toggleActive = (id, val) => {
    updateProject(id, { active: val });
    setProjects(getProjects());
  };

  return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Projects</div>
          <div className="adm-page-header__sub">{projects.length} total · {projects.filter((p) => p.active).length} active</div>
        </div>
        <Link to="/admin/projects/new" className="adm-btn adm-btn--primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Project
        </Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div className="adm-search">
          <span className="adm-search__icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          <input className="adm-search__input" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="adm-card" style={{ padding: 0 }}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Project</th><th>Category</th><th>Price</th><th>Level</th><th>Status</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="adm-empty">
                    <div className="adm-empty__icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
                    <h3>No projects found</h3><p>Try a different search or add a new project.</p>
                  </div>
                </td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 48, height: 36, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0", flexShrink: 0 }}>
                        {p.screenshots?.[0]
                          ? <img src={p.screenshots[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#f0faff,#fdf0ff)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
                            </div>
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: ".875rem", color: "#0f172a" }}>{p.title}</div>
                        {p.badge && <span className="adm-badge adm-badge--blue" style={{ marginTop: 2 }}>{p.badge}</span>}
                      </div>
                    </div>
                  </td>
                  <td><span className="adm-badge adm-badge--gray">{p.category}</span></td>
                  <td>
                    <div style={{ fontWeight: 700, color: "#009fd4" }}>₹{p.price.toLocaleString("en-IN")}</div>
                    <div style={{ fontSize: ".75rem", color: "#94a3b8", textDecoration: "line-through" }}>₹{p.originalPrice.toLocaleString("en-IN")}</div>
                  </td>
                  <td><span style={{ fontSize: ".78rem", fontWeight: 600, color: LEVEL_COLORS[p.level] }}>{p.level}</span></td>
                  <td>
                    {p.soldOut
                      ? <span className="adm-badge adm-badge--red">Sold Out</span>
                      : <span className="adm-badge adm-badge--green">Available</span>}
                  </td>
                  <td>
                    <label className="adm-toggle">
                      <div className={`adm-toggle__track ${p.active ? "adm-toggle__track--on" : ""}`} onClick={() => toggleActive(p.id, !p.active)}>
                        <div className="adm-toggle__thumb" />
                      </div>
                    </label>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link to={`/admin/projects/edit/${p.id}`} className="adm-btn adm-btn--ghost adm-btn--sm adm-btn--icon" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </Link>
                      <button className="adm-btn adm-btn--danger adm-btn--sm adm-btn--icon" title="Delete" onClick={() => setConfirmDelete(p.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 10, color: "#0f172a" }}>Delete Project?</div>
            <p style={{ color: "#64748b", fontSize: ".875rem", marginBottom: 24 }}>This action cannot be undone. The project will be permanently removed from the store.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="adm-btn adm-btn--ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="adm-btn adm-btn--danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ─── Add Project ──────────────────────────────────────────────────────────────
export function AdminAddProject() {
  const navigate = useNavigate();
  const initial = {
    title: "", description: "", longDesc: "", category: "Web Development",
    level: "Intermediate", delivery: "1 week", price: "", originalPrice: "",
    tags: [], features: [], includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial"],
    media: [], screenshots: [], demoVideo: "", projectFiles: [],
    badge: "", active: true, soldOut: false,
  };
  return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Add New Project</div>
          <div className="adm-page-header__sub">Fill in the details below</div>
        </div>
        <Link to="/admin/projects" className="adm-btn adm-btn--ghost">← Back to Projects</Link>
      </div>
      <ProjectForm initial={initial} isEdit={false}
        onSave={(data) => { addProject(data); navigate("/admin/projects"); }}
        onCancel={() => navigate("/admin/projects")} />
    </AdminLayout>
  );
}

// ─── Edit Project ─────────────────────────────────────────────────────────────
export function AdminEditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = getProjects().find((p) => p.id === Number(id));

  if (!project) return (
    <AdminLayout>
      <div className="adm-empty"><h3>Project not found</h3><Link to="/admin/projects" className="adm-btn adm-btn--primary" style={{ marginTop: 12 }}>Back</Link></div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Edit Project</div>
          <div className="adm-page-header__sub">{project.title}</div>
        </div>
        <Link to="/admin/projects" className="adm-btn adm-btn--ghost">← Back to Projects</Link>
      </div>
      <ProjectForm initial={project} isEdit={true}
        onSave={(data) => { updateProject(project.id, data); navigate("/admin/projects"); }}
        onCancel={() => navigate("/admin/projects")} />
    </AdminLayout>
  );
}
