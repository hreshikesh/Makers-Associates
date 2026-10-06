/**
 * PublicQuotePage — public client-facing quote view.
 *
 * Accessed via a tokenised URL /quote/:token — no auth required.
 * Lets the client:
 *   - Read the full quote (client, requirements, pricing, specs, terms)
 *   - Download the branded PDF
 *   - Leave comments
 *   - Accept or Reject the quote
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { publicQuoteApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2, FileDown, CheckCircle2, XCircle, Send, Building2,
  Home as HomeIcon, MapPin, Calendar, User, Phone, Mail, IndianRupee,
  MessageSquare, Shield, Star,
} from "lucide-react";
import SEO from "@/components/site/SEO";

const rupees = (n) =>
  `\u20b9${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

export default function PublicQuotePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [posting, setPosting] = useState(false);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // 'accepted' | 'rejected' | null
  const [actionNote, setActionNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await publicQuoteApi.get(token);
      setData(d);
      if (d?.quote?.client_name) setAuthorName(d.quote.client_name);
    } catch (e) {
      if (e?.response?.status === 404) setNotFound(true);
      else toast.error("Failed to load quote");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, [load]);

  const pricing = useMemo(() => {
    const q = data?.quote || {};
    const area = Number(q.built_up_area) || 0;
    const rate = Number(q.price_per_sqft) || 0;
    const base = area * rate;
    const addonTotal = (q.addons || []).reduce((s, a) => s + (Number(a.price) || 0), 0);
    const lineTotal = (q.line_items || []).reduce((s, l) => s + (Number(l.amount) || 0), 0);
    const interiorsTotal = (q.interiors || []).reduce((s, cat) =>
      s + (cat.items || []).reduce((ss, it) => {
        if (!it.include_in_total) return ss;
        return ss + (Number(it.rate) || 0) * (Number(it.quantity) || 1);
      }, 0), 0);
    const subtotal = base + addonTotal + lineTotal + interiorsTotal;
    const discount = Number(q.discount_amount) || 0;
    const net = Math.max(0, subtotal - discount);
    const svcPct = q.service_charge_percent != null ? Number(q.service_charge_percent) : 15;
    const svcAmt = (net * svcPct) / 100;
    return { base, addonTotal, lineTotal, interiorsTotal, subtotal, discount, net, svcAmt, grand: net + svcAmt, svcPct };
  }, [data]);

  const submitComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await publicQuoteApi.comment(token, {
        author: authorName || null,
        message: comment.trim(),
      });
      setComment("");
      toast.success("Comment sent to ConstructONS");
      load();
    } catch {
      toast.error("Failed to send comment");
    } finally {
      setPosting(false);
    }
  };

  const doAction = async () => {
    if (!confirmAction) return;
    setPosting(true);
    try {
      await publicQuoteApi.action(token, {
        action: confirmAction,
        author: authorName || null,
        note: actionNote.trim() || null,
      });
      toast.success(confirmAction === "accepted" ? "Quote accepted \u2014 our team will reach out shortly." : "Quote rejected \u2014 thank you for your feedback.");
      setConfirmAction(null);
      setActionNote("");
      load();
    } catch {
      toast.error("Failed to submit action");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-brand-bg">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }
  if (notFound || !data) {
    return (
      <div className="min-h-screen grid place-items-center bg-brand-bg text-center px-6">
        <div>
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-orange/10 grid place-items-center">
            <XCircle className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-brand-navy">Quote not found</h1>
          <p className="mt-2 text-brand-navy/60 max-w-md">
            The link you followed is invalid or has been revoked. Please contact ConstructONS for a fresh link.
          </p>
        </div>
      </div>
    );
  }

  const q = data.quote;
  const settings = data.settings || {};
  const clientAction = q.client_action;
  const comments = q.comments || [];
  const introHtml = DOMPurify.sanitize(q.intro_note || "");
  const termsHtml = DOMPurify.sanitize(q.terms || "");

  return (
    <div className="min-h-screen bg-brand-bg pb-20" data-testid="public-quote-page">
      <SEO
        title="Custom Home Quotation"
        description="Confidential custom construction quotation prepared by ConstructONS."
        canonical={`/quote/${token}`}
        noindex={true}
      />

      {/* Top bar */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-brand-orangeLight">
              {settings.company_name || "ConstructONS"}
            </div>
            <div className="font-bold truncate">Customised Home Quotation</div>
          </div>
          <a
            href={publicQuoteApi.pdfUrl(token)}
            target="_blank"
            rel="noreferrer"
            data-testid="public-download-pdf"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange text-white px-4 py-2 text-sm font-semibold hover:brightness-95"
          >
            <FileDown className="w-4 h-4" /> Download PDF
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 md:px-8 py-8 space-y-6">
        {/* Hero */}
        <section className="rounded-3xl bg-white border border-black/5 shadow-soft p-6 md:p-8">
          <div className="section-eyebrow">Prepared for</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold text-brand-navy">{q.client_name || "Valued Customer"}</h1>
          {q.package_name && (
            <div className="mt-2 text-brand-orange font-semibold">{q.package_name}</div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-brand-navy/70">
            <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 text-brand-orange" /> Ref {q.ref_number}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Issued {new Date(q.updated_at || q.created_at).toLocaleDateString()}</span>
            <span className="inline-flex items-center gap-1.5"><Shield className="w-4 h-4" /> {q.warranty_years || 10}-year warranty</span>
          </div>

          {clientAction && (
            <div
              className={`mt-5 rounded-2xl p-4 flex items-center gap-3 ${
                clientAction === "accepted"
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {clientAction === "accepted" ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <div className={`font-semibold ${clientAction === "accepted" ? "text-emerald-700" : "text-red-700"}`}>
                  You have {clientAction === "accepted" ? "accepted" : "rejected"} this quote
                </div>
                {q.client_action_at && (
                  <div className="text-xs text-brand-navy/60">
                    on {new Date(q.client_action_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {introHtml && (
            <div
              className="rich-html mt-5 text-brand-navy/80"
              dangerouslySetInnerHTML={{ __html: introHtml }}
            />
          )}
        </section>

        {/* Grand total */}
        <section className="rounded-3xl bg-brand-navy text-white p-6 md:p-8 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <div className="text-xs uppercase tracking-widest text-brand-orangeLight">Grand Total</div>
              <div className="text-4xl md:text-5xl font-bold mt-1" data-testid="public-grand-total">
                {rupees(pricing.grand)}
              </div>
              <div className="mt-1 text-white/60 text-sm">
                {q.built_up_area || 0} sq.ft · {rupees(q.price_per_sqft)}/sqft · {q.floors || "G+1"} · {q.bhk || "—"}
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <PriceRow label="Base build" value={pricing.base} />
              <PriceRow label="Add-ons" value={pricing.addonTotal} />
              {pricing.interiorsTotal > 0 && <PriceRow label="Interiors" value={pricing.interiorsTotal} />}
              {pricing.lineTotal > 0 && <PriceRow label="Line items" value={pricing.lineTotal} />}
              {pricing.discount > 0 && <PriceRow label="Discount" value={-pricing.discount} />}
              <PriceRow label={`Service charge @ ${pricing.svcPct}%`} value={pricing.svcAmt} />
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="rounded-3xl bg-white border border-black/5 shadow-soft p-6 md:p-8">
          <h2 className="text-xl font-bold text-brand-navy mb-4">Project Brief</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Info icon={<User className="w-4 h-4" />} label="Client" value={q.client_name} />
            <Info icon={<Phone className="w-4 h-4" />} label="Phone" value={q.client_phone} />
            <Info icon={<Mail className="w-4 h-4" />} label="Email" value={q.client_email} />
            <Info icon={<MapPin className="w-4 h-4" />} label="Site" value={q.site_address} />
            <Info icon={<HomeIcon className="w-4 h-4" />} label="Plot" value={q.plot_area ? `${q.plot_area} sq.ft` : null} />
            <Info icon={<Building2 className="w-4 h-4" />} label="Built-up" value={q.built_up_area ? `${q.built_up_area} sq.ft` : null} />
            <Info icon={<Building2 className="w-4 h-4" />} label="Floors" value={q.floors} />
            <Info icon={<HomeIcon className="w-4 h-4" />} label="BHK" value={q.bhk} />
            <Info icon={<Calendar className="w-4 h-4" />} label="Start" value={q.expected_start} />
            <Info icon={<Calendar className="w-4 h-4" />} label="Completion" value={q.expected_completion} />
          </div>
        </section>

        {/* Add-ons */}
        {(q.addons || []).length > 0 && (
          <section className="rounded-3xl bg-white border border-black/5 shadow-soft p-6 md:p-8">
            <h2 className="text-xl font-bold text-brand-navy mb-4">Add-ons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {q.addons.map((a, i) => (
                <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-black/5 p-3">
                  <div>
                    <div className="font-semibold text-brand-navy text-sm">{a.name}</div>
                    {a.description && <div className="text-xs text-brand-navy/60 mt-0.5">{a.description}</div>}
                  </div>
                  <div className="text-sm font-bold text-brand-orange whitespace-nowrap">{rupees(a.price)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Specs */}
        {(q.spec_categories || []).length > 0 && (
          <section className="rounded-3xl bg-white border border-black/5 shadow-soft p-6 md:p-8">
            <h2 className="text-xl font-bold text-brand-navy mb-4">Material Specifications</h2>
            <div className="space-y-6">
              {q.spec_categories.map((cat, ci) => (
                <div key={ci}>
                  <div className="font-semibold text-brand-navy mb-2">{cat.name}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse min-w-[500px]">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-brand-navy/50">
                          <th className="px-3 py-2 border-b border-black/10 w-32">Spec</th>
                          <th className="px-3 py-2 border-b border-black/10">Value</th>
                          <th className="px-3 py-2 border-b border-black/10 w-40">Brand</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(cat.items || []).map((it, ii) => (
                          <tr key={ii} className="border-b border-black/5">
                            <td className="px-3 py-2 font-medium text-brand-navy/85">{it.spec}</td>
                            <td className="px-3 py-2 text-brand-navy">{it.value}</td>
                            <td className="px-3 py-2 text-brand-navy/60">{it.brand || "\u2014"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interior Fit-Out */}
        {(q.interiors || []).length > 0 && (
          <section className="rounded-3xl bg-white border border-black/5 shadow-soft p-6 md:p-8">
            <h2 className="text-xl font-bold text-brand-navy mb-4">Interior Fit-Out</h2>
            <div className="space-y-6">
              {q.interiors.map((cat, ci) => (
                <div key={ci}>
                  <div className="font-semibold text-brand-navy mb-2">{cat.name}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse min-w-[600px]">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-brand-navy/50">
                          <th className="px-3 py-2 border-b border-black/10">Item</th>
                          <th className="px-3 py-2 border-b border-black/10">Description</th>
                          <th className="px-3 py-2 border-b border-black/10 w-32">Brand</th>
                          <th className="px-3 py-2 border-b border-black/10 w-32">Rate</th>
                          <th className="px-3 py-2 border-b border-black/10 w-16">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(cat.items || []).map((it, ii) => (
                          <tr key={ii} className="border-b border-black/5">
                            <td className="px-3 py-2 font-medium text-brand-navy/85">{it.spec}</td>
                            <td className="px-3 py-2 text-brand-navy">{it.value}</td>
                            <td className="px-3 py-2 text-brand-navy/60">{it.brand || "—"}</td>
                            <td className="px-3 py-2 text-brand-navy/80">{it.rate ? rupees(it.rate) : "—"} {it.rate_unit || ""}</td>
                            <td className="px-3 py-2 text-brand-navy/60">{it.quantity || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Floor Plans */}
        {(q.floor_plans || []).length > 0 && (
          <section className="rounded-3xl bg-white border border-black/5 shadow-soft p-6 md:p-8">
            <h2 className="text-xl font-bold text-brand-navy mb-4">Floor Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.floor_plans.map((s, i) => (
                <div key={s.id || i} className="rounded-xl overflow-hidden border border-black/10">
                  {s.image_url && (
                    <img src={s.image_url.startsWith("http") ? s.image_url : s.image_url} alt={s.title} className="w-full h-56 object-contain bg-brand-bg" />
                  )}
                  <div className="p-3 bg-brand-navy text-white text-xs grid grid-cols-4 gap-2">
                    <div><div className="text-brand-orangeLight text-[9px] uppercase">Sheet</div><div className="font-semibold">{s.sheet_number || i + 1}</div></div>
                    <div><div className="text-brand-orangeLight text-[9px] uppercase">Scale</div><div className="font-semibold">{s.scale || "1:100"}</div></div>
                    <div><div className="text-brand-orangeLight text-[9px] uppercase">Units</div><div className="font-semibold">{s.units || "mm"}</div></div>
                    <div><div className="text-brand-orangeLight text-[9px] uppercase">North</div><div className="font-semibold">{s.north_direction || "N"}</div></div>
                  </div>
                  <div className="p-2 text-xs text-brand-navy/70 bg-brand-bg">{s.title} · drawn by {s.drawn_by || "ConstructONS"}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Elevations */}
        {(q.elevations || []).length > 0 && (
          <section className="rounded-3xl bg-white border border-black/5 shadow-soft p-6 md:p-8">
            <h2 className="text-xl font-bold text-brand-navy mb-4">Elevations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.elevations.map((s, i) => (
                <div key={s.id || i} className="rounded-xl overflow-hidden border border-black/10">
                  {s.image_url && (
                    <img src={s.image_url} alt={s.title} className="w-full h-56 object-contain bg-brand-bg" />
                  )}
                  <div className="p-2 text-xs text-brand-navy/70 bg-brand-bg">{s.title} · scale {s.scale || "1:100"}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Visual Boards */}
        {(q.visual_boards || []).length > 0 && (
          <section className="rounded-3xl bg-white border border-black/5 shadow-soft p-6 md:p-8">
            <h2 className="text-xl font-bold text-brand-navy mb-4">Visual Reference</h2>
            <div className="space-y-6">
              {q.visual_boards.map((board, bi) => (
                <div key={board.id || bi}>
                  <div className="font-semibold text-brand-navy">{board.title}</div>
                  {board.description && <div className="text-sm text-brand-navy/60 mb-3">{board.description}</div>}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(board.images || []).map((img, ii) => (
                      <div key={img.id || ii} className="relative">
                        <img src={img.url} alt={img.caption || ""} className="w-full h-32 object-cover rounded-lg" />
                        {img.caption && <div className="text-[10px] text-brand-navy/60 mt-1">{img.caption}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Scope / Exclusions / Payment schedule */}
        {((q.scope_of_work || []).length > 0 || (q.exclusions || []).length > 0) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(q.scope_of_work || []).length > 0 && (
              <div className="rounded-3xl bg-white border border-black/5 shadow-soft p-6">
                <h3 className="font-bold text-brand-navy mb-3">What's included</h3>
                <ul className="space-y-2 text-sm">
                  {q.scope_of_work.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-brand-navy/80">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(q.exclusions || []).length > 0 && (
              <div className="rounded-3xl bg-white border border-black/5 shadow-soft p-6">
                <h3 className="font-bold text-brand-navy mb-3">Exclusions</h3>
                <ul className="space-y-2 text-sm">
                  {q.exclusions.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-brand-navy/80">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {(q.payment_schedule || []).length > 0 && (
          <section className="rounded-3xl bg-white border border-black/5 shadow-soft p-6 md:p-8">
            <h2 className="text-xl font-bold text-brand-navy mb-4">Payment Schedule</h2>
            <div className="space-y-2">
              {q.payment_schedule.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-black/5">
                  <div className="w-10 h-10 rounded-full bg-brand-orange/10 text-brand-orange grid place-items-center text-xs font-bold">
                    {s.percentage}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-brand-navy text-sm">{s.milestone}</div>
                    {s.description && <div className="text-xs text-brand-navy/60">{s.description}</div>}
                  </div>
                  <div className="text-sm font-bold text-brand-navy whitespace-nowrap">
                    {rupees((pricing.grand * (Number(s.percentage) || 0)) / 100)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Terms */}
        {termsHtml && (
          <section className="rounded-3xl bg-white border border-black/5 shadow-soft p-6 md:p-8">
            <h2 className="text-xl font-bold text-brand-navy mb-3">Terms &amp; Conditions</h2>
            <div className="rich-html text-brand-navy/80 text-sm" dangerouslySetInnerHTML={{ __html: termsHtml }} />
          </section>
        )}

        {/* Comments */}
        <section className="rounded-3xl bg-white border border-black/5 shadow-soft p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-brand-orange" />
            <h2 className="text-xl font-bold text-brand-navy">Conversation</h2>
          </div>
          {comments.length === 0 ? (
            <div className="text-sm text-brand-navy/60">No messages yet — leave a note below and our team will respond.</div>
          ) : (
            <div className="space-y-3">
              {comments.map((c, i) => (
                <div key={c.id || i} className={`p-4 rounded-xl ${c.source === "client" ? "bg-brand-bg" : "bg-brand-navy/5"}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-semibold text-brand-navy text-sm">{c.author || "Client"}</div>
                    <div className="text-[10px] text-brand-navy/50">{new Date(c.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-brand-navy/80 whitespace-pre-wrap">{c.message}</div>
                </div>
              ))}
            </div>
          )}

          {!clientAction && (
            <div className="mt-5 pt-5 border-t border-black/5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="col-span-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                  placeholder="Your name (optional)"
                />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="md:col-span-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm resize-y"
                  placeholder="Ask a question or share feedback..."
                  data-testid="public-comment-input"
                />
              </div>
              <button
                onClick={submitComment}
                disabled={posting || !comment.trim()}
                data-testid="public-send-comment"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-navy text-white px-4 py-2 text-sm font-semibold hover:brightness-110 disabled:opacity-60"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Message
              </button>
            </div>
          )}
        </section>

        {/* Accept / Reject */}
        {!clientAction && (
          <section className="rounded-3xl bg-gradient-to-br from-brand-navy to-[#152847] text-white p-6 md:p-8 shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold">Ready to move forward?</h2>
            <p className="text-white/70 mt-1 text-sm max-w-xl">
              Accept to lock in this quote and our team will initiate the booking process. Not the right fit? Let us know why and we'll refine it.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => setConfirmAction("accepted")}
                data-testid="public-accept-btn"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white px-5 py-2.5 text-sm font-semibold hover:brightness-110"
              >
                <CheckCircle2 className="w-4 h-4" /> Accept Quote
              </button>
              <button
                onClick={() => setConfirmAction("rejected")}
                data-testid="public-reject-btn"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 text-sm font-semibold"
              >
                <XCircle className="w-4 h-4" /> Decline
              </button>
            </div>
          </section>
        )}

        {/* Confirm modal */}
        {confirmAction && (
          <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 grid place-items-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="font-bold text-brand-navy text-lg">
                {confirmAction === "accepted" ? "Accept this quote?" : "Decline this quote?"}
              </div>
              <p className="text-sm text-brand-navy/60 mt-1">
                {confirmAction === "accepted"
                  ? "Our team will be notified immediately and reach out within 24 hours."
                  : "Please share a quick reason so we can improve the next quote."}
              </p>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={3}
                className="w-full mt-3 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm resize-y"
                placeholder={confirmAction === "accepted" ? "Optional note..." : "Reason (optional)..."}
                data-testid="public-action-note"
              />
              <div className="mt-4 flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setConfirmAction(null); setActionNote(""); }}
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-brand-navy"
                >
                  Cancel
                </button>
                <button
                  onClick={doAction}
                  disabled={posting}
                  data-testid="public-confirm-action"
                  className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white ${
                    confirmAction === "accepted" ? "bg-emerald-500" : "bg-red-500"
                  }`}
                >
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : (confirmAction === "accepted" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />)}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto px-5 md:px-8 pt-6 text-center text-xs text-brand-navy/40">
        Powered by {settings.company_name || "ConstructONS"} · Confidential quotation · Valid {q.valid_days || 30} days from issue
      </footer>
    </div>
  );
}

function Info({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-md bg-brand-bg grid place-items-center text-brand-navy/60 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-brand-navy/50">{label}</div>
        <div className="text-brand-navy font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function PriceRow({ label, value }) {
  const neg = value < 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/70">{label}</span>
      <span className={`font-semibold ${neg ? "text-red-300" : "text-white"}`}>{rupees(value)}</span>
    </div>
  );
}