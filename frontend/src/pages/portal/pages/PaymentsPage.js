import React, { useState, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  IndianRupee, TrendingUp, Download, Receipt,
  FileText, CheckCircle2, Clock, Info, Search,
  ShieldCheck, Check, AlertTriangle, XCircle,
  FileSignature, Wallet, Link2, History
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { resolveMediaUrl } from "../../../lib/mediaUrl";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    });
  } catch { return "—"; }
};

const fmtINR = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}`;

export default function PaymentsPage() {
  const { project, refreshProject } = usePortal();

  const [activeTab, setActiveTab] = useState("schedule");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  /* ============== COMMERCIAL MATH ============== */
  const baseContract = Number(project?.contract_value) || 0;

  const variations = useMemo(() => {
    return [...(project?.variations || [])].sort((a, b) =>
      new Date(b.approved_at || b.created_at || 0) - new Date(a.approved_at || a.created_at || 0)
    );
  }, [project]);

  const approvedVariations = useMemo(() =>
    variations.filter(v => v.status === "approved")
      .reduce((sum, v) => sum + (Number(v.amount) || 0), 0),
    [variations]);

  const pendingVariationsSum = useMemo(() =>
    variations.filter(v => v.status === "pending")
      .reduce((sum, v) => sum + (Number(v.amount) || 0), 0),
    [variations]);

  const pendingVariationsList = useMemo(() =>
    variations.filter(v => v.status === "pending"), [variations]);

  const approvedVariationsList = useMemo(() =>
    variations.filter(v => v.status === "approved"), [variations]);

  const historyVariationsList = useMemo(() =>
    variations.filter(v => v.status !== "pending"), [variations]);

  const totalContractValue = baseContract + approvedVariations;

  const invoices = useMemo(() =>
    [...(project?.invoices || [])].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
    [project]);

  const activeInvoices = useMemo(() => invoices.filter(i => i.status !== "void"), [invoices]);
  const totalInvoiced = useMemo(() =>
    activeInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0), [activeInvoices]);
  const totalPaid = Number(project?.amount_spent) || 0;
  
  const outstandingAmount = Math.max(0, totalInvoiced - totalPaid);

  const upcomingInvoices = useMemo(() =>
    activeInvoices.filter(i => ["upcoming", "due_soon", "partially_paid", "overdue"].includes(i.status))
      .sort((a, b) => new Date(a.due_date || a.date) - new Date(b.due_date || b.date)),
    [activeInvoices]);

  const filteredInvoices = useMemo(() => {
    return activeInvoices.filter(i => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || (i.number || "").toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" ||
        (i.status || "").toLowerCase() === statusFilter.toLowerCase();
      return matchQuery && matchStatus;
    });
  }, [activeInvoices, searchQuery, statusFilter]);

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId) ||
    upcomingInvoices[0] || filteredInvoices[0];

  const allocatedReceipts = useMemo(() => {
    if (!selectedInvoice) return [];
    return (project?.payments_log || [])
      .filter(p => p.invoice_id === selectedInvoice.id)
      .sort((a, b) => new Date(b.date || b.logged_at || 0) - new Date(a.date || a.logged_at || 0));
  }, [project, selectedInvoice]);

  const handleClientDecision = async (variationId, status) => {
    const confirmMsg = status === "approved"
      ? "Confirm you want to APPROVE this variation? This will increase your contract value."
      : "Confirm you want to DECLINE this variation request?";
    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(variationId);
    try {
      const res = await axios.patch(
        `${API_BASE}/portal/my-project/${project.id}/variations/${variationId}/status`,
        { status }
      );
      if (res.data.success) {
        toast.success(
          `Variation ${status === 'approved' ? 'Approved ✅' : 'Declined'} successfully. Admin has been notified.`
        );
        if (refreshProject) await refreshProject();
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Action failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase border";
    switch (status) {
      case "paid":
        return <span className={`${base} text-emerald-700 bg-emerald-50 border-emerald-200`}>
          <CheckCircle2 className="w-2.5 h-2.5" /> Paid
        </span>;
      case "partially_paid":
        return <span className={`${base} text-amber-700 bg-amber-50 border-amber-200`}>Partial</span>;
      case "overdue":
        return <span className={`${base} text-red-700 bg-red-50 border-red-200`}>Overdue</span>;
      case "invoiced":
        return <span className={`${base} text-blue-700 bg-blue-50 border-blue-200`}>Invoiced</span>;
      default:
        return <span className={`${base} text-[#FF6600] bg-[#FF6600]/10 border-[#FF6600]/20`}>Upcoming</span>;
    }
  };

  const getVariationPaymentStatus = (v) => {
    if (!v.invoice_id) return { paid: false, invoice: null };
    const inv = invoices.find(i => i.id === v.invoice_id);
    if (!inv) return { paid: false, invoice: null };
    return {
      paid: inv.status === "paid",
      partial: inv.status === "partially_paid",
      invoice: inv
    };
  };

  if (!project) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] font-['Poppins'] bg-[#F5F6F8] overflow-y-auto p-3 sm:p-4 md:p-6 lg:px-8 xl:px-12 2xl:px-20">

      {/* ====== HEADER ====== */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#000F1B]">
            Payments & Contract
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
            Track proforma invoices, verified receipts & scope variations in real-time.
          </p>
        </div>
        <div className="bg-[#FF6600]/5 border border-[#FF6600]/20 rounded-lg p-2.5 flex items-start gap-2 w-full md:w-auto md:max-w-sm">
          <Info className="w-4 h-4 text-[#FF6600] shrink-0 mt-0.5" />
          <p className="text-[10px] sm:text-[11px] text-[#000F1B] font-medium leading-relaxed">
            All proforma invoices, receipts and contract changes are transparently maintained here.
          </p>
        </div>
      </div>

      {/* ====== KPI STRIP ====== */}
      {activeTab !== "variations" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-4">
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Base Contract
              </span>
              <FileSignature className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-sm sm:text-base xl:text-lg font-black text-[#000F1B]">
              {fmtINR(baseContract)}
            </div>
            <div className="text-[9px] font-semibold text-slate-400 mt-0.5">Original Signed</div>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">
                Variations
              </span>
              <TrendingUp className="w-4 h-4 text-[#FF6600]" />
            </div>
            <div className="text-sm sm:text-base xl:text-lg font-black text-[#FF6600]">
              + {fmtINR(approvedVariations)}
            </div>
            <div className="text-[9px] font-semibold text-amber-700/80 mt-0.5">
              {pendingVariationsList.length > 0
                ? `${pendingVariationsList.length} awaiting you`
                : "All approved"}
            </div>
          </div>

          <div className="bg-[#000F1B] border border-[#000F1B] rounded-xl p-3 shadow-sm text-white col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                Total Contract
              </span>
              <FileText className="w-4 h-4 text-[#FF6600]" />
            </div>
            <div className="text-sm sm:text-base xl:text-lg font-black text-[#FF6600]">
              {fmtINR(totalContractValue)}
            </div>
            <div className="text-[9px] font-semibold text-gray-400 mt-0.5">Base + Approved</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                Invoiced
              </span>
              <Receipt className="w-4 h-4 text-[#000F1B]" />
            </div>
            <div className="text-sm sm:text-base xl:text-lg font-black text-[#000F1B]">
              {fmtINR(totalInvoiced)}
            </div>
            <div className="text-[9px] font-semibold text-gray-400 mt-0.5">
              {totalContractValue > 0 ? `${Math.round((totalInvoiced / totalContractValue) * 100)}% of total` : "—"}
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
                Paid
              </span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm sm:text-base xl:text-lg font-black text-emerald-700">
              {fmtINR(totalPaid)}
            </div>
            <div className="text-[9px] font-semibold text-emerald-600/80 mt-0.5">Verified</div>
          </div>

          <div className="bg-red-50/60 border border-red-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-red-800 uppercase tracking-wider">
                Outstanding
              </span>
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-sm sm:text-base xl:text-lg font-black text-red-600">
              {fmtINR(outstandingAmount)}
            </div>
            <div className="text-[9px] font-semibold text-red-500 mt-0.5">To be paid</div>
          </div>
        </div>
      )}

      {/* ====== PENDING VARIATION BANNER ====== */}
      {pendingVariationsList.length > 0 && activeTab !== "variations" && (
        <div
          onClick={() => setActiveTab("variations")}
          className="bg-amber-100 border border-amber-300 rounded-xl p-3 mb-4 flex items-center gap-3 cursor-pointer hover:bg-amber-200/70 transition"
        >
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-bold text-amber-900">
              {pendingVariationsList.length} Variation Request{pendingVariationsList.length > 1 ? 's' : ''} Awaiting Your Approval
            </div>
            <div className="text-[10px] sm:text-[11px] text-amber-700">
              Total impact: + {fmtINR(pendingVariationsSum)} → Click to review
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-900 bg-white px-2 py-1 rounded border border-amber-300 shrink-0">
            Review →
          </span>
        </div>
      )}

      {/* ====== TABS ====== */}
      <div className="flex items-center gap-4 sm:gap-6 border-b border-gray-200 mb-4 bg-white px-3 pt-2 rounded-t-xl overflow-x-auto no-scrollbar">
        {[
          { id: "schedule", label: "Payment Schedule" },
          { id: "invoices", label: "Proforma Invoices & Receipts" },
          { id: "variations", label: "Contract Variations", badge: pendingVariationsList.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 text-xs sm:text-[13px] font-bold transition-all relative whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id ? "text-[#000F1B]" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="bg-[#FF6600] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-black">
                {tab.badge}
              </span>
            )}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF6600]" />}
          </button>
        ))}
      </div>

      {/* ====== TAB: PAYMENT SCHEDULE ====== */}
      {activeTab === "schedule" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xs sm:text-sm font-bold text-[#000F1B]">
              Milestone Payment Schedule
            </h3>
            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5">
              Contractually agreed milestone-based payment plan (as added by project team).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] min-w-[600px]">
              <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px]">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Milestone</th>
                  <th className="py-2.5 px-4 hidden sm:table-cell">Stage</th>
                  <th className="py-2.5 px-4">Target Date</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(project.payment_schedule || []).length === 0 ? (
                  <tr><td colSpan="6" className="py-8 text-center text-gray-400 italic">No milestones added yet.</td></tr>
                ) : (
                  (project.payment_schedule || []).map((ms, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-[#000F1B]">{ms.name}</td>
                      <td className="py-3 px-4 text-[#FF6600] font-semibold hidden sm:table-cell">
                        {ms.stage || "General"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{fmtDate(ms.due_date)}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{fmtINR(ms.amount)}</td>
                      <td className="py-3 px-4">{getStatusBadge(ms.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====== TAB: PROFORMA INVOICES & RECEIPTS ====== */}
      {activeTab === "invoices" && (
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          <div className="flex-1 w-full space-y-4 min-w-0">

            {upcomingInvoices.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-[#000F1B]">
                    Upcoming Payments
                  </h3>
                  <span className="text-[10px] font-bold text-[#FF6600] bg-[#FF6600]/10 px-2 py-0.5 rounded">
                    {upcomingInvoices.length} Due
                  </span>
                </div>
                <table className="w-full text-left text-[11px] table-fixed">
                  <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px]">
                    <tr>
                      <th className="py-2 px-3 w-[22%]">Proforma</th>
                      <th className="py-2 px-3 hidden sm:table-cell">Description</th>
                      <th className="py-2 px-3 w-[20%]">Due Date</th>
                      <th className="py-2 px-3 w-[22%]">Amount</th>
                      <th className="py-2 px-3 w-[18%] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {upcomingInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#000F1B] truncate">{inv.number}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-800 hidden sm:table-cell truncate">
                          {inv.description}
                          {inv.milestone_name && (
                            <span className="block text-[9px] text-amber-600 font-semibold mt-0.5">
                              ↳ Milestone: {inv.milestone_name} ({inv.milestone_stage || inv.stage})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 truncate">{fmtDate(inv.due_date)}</td>
                        <td className="py-2.5 px-3 font-bold text-[#FF6600] truncate">{fmtINR(inv.amount)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedInvoiceId(inv.id)}
                            className="px-2.5 py-1 bg-[#000F1B] hover:bg-[#FF6600] text-white text-[10px] font-bold rounded shadow-sm transition"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#000F1B]">Proforma Invoice History</h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text" placeholder="Search..."
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 text-[10px] bg-white border border-gray-200 rounded outline-none focus:border-[#FF6600]"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="text-[10px] font-bold bg-white border border-gray-200 rounded px-2 py-1.5 outline-none"
                  >
                    <option value="All">All</option>
                    <option value="paid">Paid</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="partially_paid">Partially Paid</option>
                  </select>
                </div>
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="py-8 text-center text-gray-400 italic text-xs">No proforma invoices found.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-gray-400 uppercase font-bold text-[9px]">
                    <div className="col-span-2">Proforma #</div>
                    <div className="col-span-4">Milestone / Description</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-1">Paid</div>
                    <div className="col-span-1 text-right">Status</div>
                  </div>

                  {filteredInvoices.map(inv => (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className={`cursor-pointer transition hover:bg-gray-50 ${
                        selectedInvoice?.id === inv.id ? "bg-[#FF6600]/5 border-l-4 border-l-[#FF6600]" : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 items-center text-[11px]">
                        <div className="col-span-2 font-mono font-bold text-[#000F1B]">
                          {inv.number}
                          {inv.edit_history?.length > 0 && (
                            <span className="ml-1 text-[8px] text-amber-600 font-normal inline-flex items-center gap-0.5">
                              <History className="w-2.5 h-2.5" /> edited
                            </span>
                          )}
                        </div>
                        <div className="col-span-4 font-semibold text-gray-800 truncate">
                          {inv.milestone_name ? (
                            <>
                              <div className="text-gray-900 truncate">{inv.milestone_name}</div>
                              <div className="text-[10px] text-gray-400 font-normal truncate">{inv.description}</div>
                            </>
                          ) : (
                            <div className="text-gray-700 truncate">{inv.description}</div>
                          )}
                        </div>
                        <div className="col-span-2 text-gray-500">{fmtDate(inv.date)}</div>
                        <div className="col-span-2 font-bold text-gray-900">{fmtINR(inv.amount)}</div>
                        <div className="col-span-1 font-bold text-emerald-600 text-[10px]">{fmtINR(inv.paid_amount || 0)}</div>
                        <div className="col-span-1 flex justify-end">{getStatusBadge(inv.status)}</div>
                      </div>

                      <div className="md:hidden p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="font-mono font-bold text-[#000F1B] text-xs">
                            {inv.number}
                            {inv.edit_history?.length > 0 && (
                              <span className="ml-1 text-[8px] text-amber-600 font-normal inline-flex items-center gap-0.5">
                                <History className="w-2.5 h-2.5" /> edited
                              </span>
                            )}
                          </div>
                          {getStatusBadge(inv.status)}
                        </div>
                        <div className="font-semibold text-gray-800 text-[11px] truncate">
                          {inv.milestone_name ? inv.milestone_name : inv.description}
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500">{fmtDate(inv.date)}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-600 font-bold">Paid: {fmtINR(inv.paid_amount || 0)}</span>
                            <span className="font-bold text-gray-900">{fmtINR(inv.amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT DRAWER */}
          <div className="w-full lg:w-[380px] xl:w-[420px] 2xl:w-[480px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
            {selectedInvoice ? (
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between border-b border-gray-100 pb-3 gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <FileText className="w-4 h-4 text-[#FF6600] shrink-0" />
                      <h3 className="text-sm font-bold text-[#000F1B]">{selectedInvoice.number}</h3>
                      {getStatusBadge(selectedInvoice.status)}
                    </div>
                    {selectedInvoice.milestone_name ? (
                      <div>
                        <div className="text-[12px] font-bold text-gray-900 truncate">{selectedInvoice.milestone_name}</div>
                        <div className="text-[10px] text-gray-400 font-medium truncate">{selectedInvoice.description}</div>
                        <div className="text-[9px] text-[#FF6600] font-semibold mt-0.5 uppercase tracking-wider">{selectedInvoice.milestone_stage || selectedInvoice.stage} Stage</div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-500 font-medium truncate">
                        {selectedInvoice.description}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => window.open(`${API_BASE}/portal/my-project/${project.id}/invoices/${selectedInvoice.id}/pdf?t=${Date.now()}`, "_blank")} 
                    className="text-[#1A73E8] p-1.5 hover:bg-blue-50 rounded-lg mr-1 text-[9px] font-bold uppercase transition"
                  >
                    PDF
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-[11px] bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-gray-500">Invoice Date</div>
                  <div className="font-bold text-gray-900 text-right">{fmtDate(selectedInvoice.date)}</div>
                  <div className="text-gray-500">Due Date</div>
                  <div className="font-bold text-gray-900 text-right">{fmtDate(selectedInvoice.due_date)}</div>
                  <div className="text-gray-500">Amount</div>
                  <div className="font-bold text-gray-900 text-right">{fmtINR(selectedInvoice.amount)}</div>
                  <div className="text-gray-500">Paid</div>
                  <div className="font-bold text-emerald-600 text-right">
                    {fmtINR(selectedInvoice.paid_amount || 0)}
                  </div>
                  <div className="text-gray-500">Outstanding</div>
                  <div className="font-bold text-red-600 text-right">
                    {fmtINR(Math.max(0, Number(selectedInvoice.amount) - Number(selectedInvoice.paid_amount || 0)))}
                  </div>
                </div>

                {selectedInvoice.edit_history?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="text-[10px] font-bold text-amber-800 uppercase mb-1.5 flex items-center gap-1">
                      <History className="w-3 h-3" /> Edit History ({selectedInvoice.edit_history.length})
                    </h4>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {selectedInvoice.edit_history.slice(-3).reverse().map((h, i) => (
                        <div key={i} className="text-[9px] text-amber-700">
                          <span className="font-mono">{fmtDate(h.edited_at)}</span>
                          <span className="ml-1">— {h.changes?.join(", ") || "edited"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Receipts
                    </h4>
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                      {allocatedReceipts.length} Logged
                    </span>
                  </div>

                  {allocatedReceipts.length === 0 ? (
                    <div className="text-[10px] text-gray-400 italic bg-gray-50 p-3 rounded-lg text-center border border-dashed border-gray-200">
                      No receipts logged for this proforma invoice yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allocatedReceipts.map((p, idx) => (
                        <div key={idx} className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-200/80 flex justify-between items-center text-[11px]">
                          <div>
                            <div className="font-black text-emerald-800">{fmtINR(p.amount)}</div>
                            <div className="text-[10px] font-semibold text-gray-600">
                              {p.receipt_number && (
                                <span className="font-mono mr-1 text-emerald-700 font-bold">{p.receipt_number}</span>
                              )}
                              {p.method} • <span className="font-mono">{p.reference || "No Ref"}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-0.5 mb-1">
                              <Check className="w-2.5 h-2.5" /> Verified
                            </div>
                            <div className="text-gray-500 text-[9px] font-medium mb-1">
                              {fmtDate(p.date || p.logged_at)}
                            </div>
                            <button 
                              onClick={() => window.open(`${API_BASE}/portal/my-project/${project.id}/receipts/${p.id}/pdf?t=${Date.now()}`, "_blank")} 
                              className="text-[#1A73E8] p-1.5 hover:bg-blue-50 rounded-lg mr-1 text-[9px] font-bold uppercase transition"
                            >
                              PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-gray-400">
                Select a proforma invoice to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== TAB 3: VARIATIONS ====== */}
      {activeTab === "variations" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-amber-100 bg-amber-50/40 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#000F1B]">
                  Variations Awaiting Your Decision
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Review each item carefully. Approving will increase your total contract value.
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {pendingVariationsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 italic">
                  🎉 No pending variations. You're all up to date!
                </div>
              ) : (
                pendingVariationsList.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 hover:bg-amber-50/20 transition"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-gray-900">{v.description}</div>
                      <div className="text-[10px] text-gray-500">
                        Requested on {fmtDate(v.created_at)}
                      </div>
                      {v.document_url && (
                        <a
                          href={resolveMediaUrl(v.document_url)}
                          target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-[#FF6600] hover:underline font-bold"
                        >
                          <Download className="w-3 h-3" /> View supporting document
                        </a>
                      )}
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
                      <div className="text-left lg:text-right">
                        <span className="text-[9px] font-bold uppercase text-gray-400 block">
                          Cost Adjustment
                        </span>
                        <span className="text-sm font-black text-[#FF6600]">+ {fmtINR(v.amount)}</span>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          disabled={actionLoadingId !== null}
                          onClick={() => handleClientDecision(v.id, "rejected")}
                          className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] sm:text-[11px] font-bold rounded-lg transition shadow-sm flex items-center gap-1 disabled:opacity-50"
                        >
                          {actionLoadingId === v.id ? (
                            <span className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Decline
                        </button>

                        <button
                          disabled={actionLoadingId !== null}
                          onClick={() => handleClientDecision(v.id, "approved")}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-[11px] font-bold rounded-lg transition shadow-sm flex items-center gap-1 disabled:opacity-50"
                        >
                          {actionLoadingId === v.id ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {approvedVariationsList.length > 0 && (
            <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-emerald-100 bg-emerald-50/40 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#000F1B]">
                    Approved Variations — Invoice & Payment Status
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Track invoicing and payment status of your approved extra scope items.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] min-w-[700px]">
                  <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px]">
                    <tr>
                      <th className="py-2.5 px-4">Variation Item</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4">Proforma Invoice</th>
                      <th className="py-2.5 px-4">Payment Status</th>
                      <th className="py-2.5 px-4 hidden sm:table-cell">Approved On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {approvedVariationsList.map((v) => {
                      const payStatus = getVariationPaymentStatus(v);
                      return (
                        <tr key={v.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-bold text-gray-900 max-w-[200px]">
                            {v.description}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#FF6600]">+ {fmtINR(v.amount)}</td>
                          <td className="py-3 px-4">
                            {payStatus.invoice ? (
                              <button
                                onClick={() => {
                                  setSelectedInvoiceId(payStatus.invoice.id);
                                  setActiveTab("invoices");
                                }}
                                className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition inline-flex items-center gap-1"
                              >
                                <Link2 className="w-2.5 h-2.5" /> {payStatus.invoice.number}
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">Invoice pending</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {payStatus.paid ? (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Paid
                              </span>
                            ) : payStatus.partial ? (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                                Partial
                              </span>
                            ) : payStatus.invoice ? (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-red-50 text-red-700 border-red-200">
                                Unpaid
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">
                            {fmtDate(v.approved_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs sm:text-sm font-bold text-[#000F1B]">
                Variation Decision History
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Complete audit log of all approved and declined scope changes.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] min-w-[500px]">
                <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px]">
                  <tr>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4 hidden sm:table-cell">Decision Date</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyVariationsList.length === 0 ? (
                    <tr><td colSpan="4" className="py-8 text-center text-gray-400 italic">No historical variations yet.</td></tr>
                  ) : (
                    historyVariationsList.map((v, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-gray-900">{v.description}</td>
                        <td className="py-3 px-4 font-bold text-[#FF6600]">+ {fmtINR(v.amount)}</td>
                        <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">
                          {fmtDate(v.approved_at || v.rejected_at || v.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                            v.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}