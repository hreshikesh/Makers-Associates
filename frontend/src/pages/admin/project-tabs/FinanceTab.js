import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
    Loader2, IndianRupee, Plus, CheckCircle2, Trash2,
    X, Download, Save, ArrowRight, Pencil, FileText, Receipt
} from "lucide-react";

const API_BASE =
    (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000") + "/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const fmtINR = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN")}`;

export default function FinanceTab({ project, onSaved }) {
    const [activeTab, setActiveTab] = useState("schedule");
    const [loading, setLoading] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [contractValue, setContractValue] = useState(project.contract_value || 0);

    const [editingInvoice, setEditingInvoice] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    const [editingMilestone, setEditingMilestone] = useState(null);
    const [milestoneEditForm, setMilestoneEditForm] = useState({});
    const [milestoneEditLoading, setMilestoneEditLoading] = useState(false);

    const [editingReceipt, setEditingReceipt] = useState(null);
    const [receiptEditForm, setReceiptEditForm] = useState({});
    const [receiptEditLoading, setReceiptEditLoading] = useState(false);

    const dynamicStages = useMemo(() => {
        if (!project?.stages) return [];
        return project.stages.map((s) => s.name).filter(Boolean);
    }, [project]);

    const [invoiceForm, setInvoiceForm] = useState({
        number: `INV-${String((project.invoices?.length || 0) + 1).padStart(3, "0")}`,
        description: "", stage: "General",
        date: new Date().toISOString().split("T")[0],
        due_date: "", amount: "", status: "upcoming",
        milestone_id: "", variation_id: ""
    });

    const [variationForm, setVariationForm] = useState({
        description: "", amount: "", status: "pending"
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: "", date: new Date().toISOString().split("T")[0],
        method: "Bank Transfer", reference: "", notes: "", invoice_id: ""
    });

    const [milestoneForm, setMilestoneForm] = useState({
        name: "", stage: "General", due_date: "", amount: "", status: "pending"
    });

    const [invoiceSettings, setInvoiceSettings] = useState({
        invoice_gst_percent: 0,
        invoice_bank_details: "[Your Brand]s Pvt. Ltd.\nBank: HDFC Bank\nA/C: 50200000000000\nIFSC: HDFC0001234",
        invoice_footer_notes: "Thank you for building with [Your Brand]s. Late payments may attract a penalty of 1.5% per month."
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const { data } = await api.get("/site-settings");
                if (data) {
                    setInvoiceSettings({
                        invoice_gst_percent: data.invoice_gst_percent ?? 0,
                        invoice_bank_details: data.invoice_bank_details ?? invoiceSettings.invoice_bank_details,
                        invoice_footer_notes: data.invoice_footer_notes ?? invoiceSettings.invoice_footer_notes,
                    });
                }
            } catch { /* silent */ }
        };
        loadSettings();
        setContractValue(project.contract_value || 0);
        // eslint-disable-next-line
    }, [project]);

    /* =================== METRICS =================== */
    const baseContract = project.contract_value || 0;
    const invoices = project.invoices || [];

    const approvedVariations = useMemo(() =>
        (project.variations || []).filter((v) => v.status === "approved")
            .reduce((s, v) => s + (Number(v.amount) || 0), 0),
        [project.variations]
    );
    const pendingVariationsSum = useMemo(() =>
        (project.variations || []).filter((v) => v.status === "pending")
            .reduce((s, v) => s + (Number(v.amount) || 0), 0),
        [project.variations]
    );

    const totalContractValue = baseContract + approvedVariations;
    
    const totalInvoiced = invoices.filter((i) => i.status !== "void")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalPaid = project.amount_spent || 0;
    const outstanding = Math.max(0, totalInvoiced - totalPaid);

    const getInvoiceRemaining = (invoiceId) => {
        const inv = invoices.find((i) => i.id === invoiceId);
        if (!inv) return 0;
        return Math.max(0, Number(inv.amount) - Number(inv.paid_amount || 0));
    };

    const getInvoiceLabel = (inv) => {
        const remaining = Math.max(0, Number(inv.amount) - Number(inv.paid_amount || 0));
        return `${inv.number} — ${fmtINR(inv.amount)} (Due: ${fmtINR(remaining)})`;
    };

    const isVariationPaid = (v) => {
        if (!v.invoice_id) return false;
        const inv = invoices.find((i) => i.id === v.invoice_id);
        if (!inv) return false;
        return inv.status === "paid";
    };

    const isVariationPartial = (v) => {
        if (!v.invoice_id) return false;
        const inv = invoices.find((i) => i.id === v.invoice_id);
        if (!inv) return false;
        return inv.status === "partially_paid";
    };

    /* =================== ACTIONS =================== */
    const saveBaseSettings = async () => {
        setSavingSettings(true);
        try {
            await api.put(`/admin/projects/${project.id}`, { contract_value: Number(contractValue) || 0 });
            toast.success("Contract value updated"); onSaved();
        } catch { toast.error("Update failed"); }
        finally { setSavingSettings(false); }
    };

    const saveInvoiceSettings = async () => {
        setSavingSettings(true);
        try {
            const payload = {
                invoice_gst_percent: Number(invoiceSettings.invoice_gst_percent) || 0,
                invoice_bank_details: invoiceSettings.invoice_bank_details,
                invoice_footer_notes: invoiceSettings.invoice_footer_notes
            };
            const { data } = await api.put("/site-settings", payload);
            const savedData = data?.settings || data;
            if (savedData) {
                setInvoiceSettings({
                    invoice_gst_percent: savedData.invoice_gst_percent ?? 0,
                    invoice_bank_details: savedData.invoice_bank_details ?? "",
                    invoice_footer_notes: savedData.invoice_footer_notes ?? "",
                });
            }
            toast.success("Proforma & Receipt PDF settings saved");
        } catch { 
            toast.error("Failed to save settings"); 
        } finally { 
            setSavingSettings(false); 
        }
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const res = await api.post(`/admin/projects/${project.id}/invoices`, {
                ...invoiceForm, amount: Number(invoiceForm.amount) || 0
            });

            if (invoiceForm.variation_id && res.data.invoice?.id) {
                try {
                    await api.patch(
                        `/admin/projects/${project.id}/variations/${invoiceForm.variation_id}/link-invoice`,
                        { invoice_id: res.data.invoice.id }
                    );
                } catch { /* silent fallback */ }
            }

            toast.success("Proforma Invoice raised");
            setInvoiceForm({
                number: `INV-${String((project.invoices?.length || 0) + 2).padStart(3, "0")}`,
                description: "", stage: "General",
                date: new Date().toISOString().split("T")[0],
                due_date: "", amount: "", status: "upcoming",
                milestone_id: "", variation_id: ""
            });
            onSaved();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Failed to raise invoice");
        } finally { setLoading(false); }
    };

    const openEditInvoice = (inv) => {
        setEditingInvoice(inv);
        setEditForm({
            number: inv.number, description: inv.description,
            stage: inv.stage || "General", date: inv.date,
            due_date: inv.due_date, amount: inv.amount, status: inv.status
        });
    };

    const handleEditInvoice = async (e) => {
        e.preventDefault(); setEditLoading(true);
        try {
            const res = await api.put(
                `/admin/projects/${project.id}/invoices/${editingInvoice.id}`,
                { ...editForm, amount: Number(editForm.amount) || 0 }
            );
            const changeCount = res.data.changes?.length || 0;
            toast.success(`Proforma updated. ${changeCount > 0 ? `${changeCount} change${changeCount > 1 ? "s" : ""} notified to client.` : ""}`);
            setEditingInvoice(null); setEditForm({}); onSaved();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Failed to update invoice");
        } finally { setEditLoading(false); }
    };

    const openEditMilestone = (ms) => {
        setEditingMilestone(ms);
        setMilestoneEditForm({
            name: ms.name, stage: ms.stage || "General",
            due_date: ms.due_date || "", amount: ms.amount
        });
    };

    const handleEditMilestone = async (e) => {
        e.preventDefault(); setMilestoneEditLoading(true);
        try {
            await api.put(
                `/admin/projects/${project.id}/payment-schedule/${editingMilestone.id}`,
                { ...milestoneEditForm, amount: Number(milestoneEditForm.amount) || 0 }
            );
            toast.success("Milestone updated");
            setEditingMilestone(null); setMilestoneEditForm({}); onSaved();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Failed to update milestone");
        } finally { setMilestoneEditLoading(false); }
    };

    const openEditReceipt = (pay) => {
        setEditingReceipt(pay);
        setReceiptEditForm({
            amount: pay.amount, date: pay.date,
            method: pay.method, reference: pay.reference || "",
            notes: pay.notes || ""
        });
    };

    const handleEditReceipt = async (e) => {
        e.preventDefault(); setReceiptEditLoading(true);
        try {
            await api.put(
                `/admin/projects/${project.id}/payments/${editingReceipt.id}`,
                { ...receiptEditForm, amount: Number(receiptEditForm.amount) || 0 }
            );
            toast.success("Receipt updated");
            setEditingReceipt(null); setReceiptEditForm({}); onSaved();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Failed to update receipt");
        } finally { setReceiptEditLoading(false); }
    };

    const raiseInvoiceFromMilestone = (ms) => {
        setInvoiceForm((prev) => ({
            ...prev,
            description: ms.name, stage: ms.stage || "General",
            amount: ms.amount,
            due_date: ms.due_date || new Date().toISOString().split("T")[0],
            milestone_id: ms.id, variation_id: ""
        }));
        setActiveTab("invoices");
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.info("Proforma form pre-filled from milestone.");
    };

    const raiseInvoiceFromVariation = (v) => {
        setInvoiceForm((prev) => ({
            ...prev,
            description: `Variation: ${v.description}`,
            stage: "General",
            amount: v.amount,
            due_date: new Date().toISOString().split("T")[0],
            milestone_id: "",
            variation_id: v.id
        }));
        setActiveTab("invoices");
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.info("Proforma form pre-filled from approved variation.");
    };

    const logReceiptForVariation = (v) => {
        setPaymentForm((prev) => ({
            ...prev,
            amount: v.amount,
            invoice_id: v.invoice_id || "",
            date: new Date().toISOString().split("T")[0],
            notes: `Payment for variation: ${v.description}`
        }));
        setActiveTab("payments");
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.info(`Receipt form pre-filled for variation: ${v.description}`);
    };

    const recordPaymentForInvoice = (inv) => {
        const remaining = Math.max(0, Number(inv.amount) - Number(inv.paid_amount || 0));
        setPaymentForm((prev) => ({
            ...prev,
            amount: remaining,
            invoice_id: inv.id,
            date: new Date().toISOString().split("T")[0],
            notes: ""
        }));
        setActiveTab("payments");
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.info(`Receipt form pre-filled for ${inv.number} — Outstanding: ${fmtINR(remaining)}`);
    };

    const handleInvoiceSelectInPayment = (invoiceId) => {
        const remaining = getInvoiceRemaining(invoiceId);
        setPaymentForm((prev) => ({
            ...prev,
            invoice_id: invoiceId,
            amount: invoiceId ? remaining : prev.amount
        }));
    };

    const handleCreateVariation = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            await api.post(`/admin/projects/${project.id}/variations`, {
                ...variationForm, amount: Number(variationForm.amount) || 0
            });
            toast.success("Variation logged");
            setVariationForm({ description: "", amount: "", status: "pending" });
            onSaved();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Failed");
        } finally { setLoading(false); }
    };

    const changeVariationStatus = async (id, status) => {
        try {
            await api.patch(`/admin/projects/${project.id}/variations/${id}/status?status=${status}`);
            toast.success(`Variation ${status}`); onSaved();
        } catch { toast.error("Status update failed"); }
    };

    const deleteVariation = async (id) => {
        if (!window.confirm("Delete this variation entry?")) return;
        try {
            await api.delete(`/admin/projects/${project.id}/variations/${id}`);
            toast.success("Deleted"); onSaved();
        } catch { toast.error("Failed"); }
    };

    const savePayment = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            await api.post(`/admin/projects/${project.id}/payments`, {
                amount: Number(paymentForm.amount), date: paymentForm.date,
                method: paymentForm.method, reference: paymentForm.reference,
                notes: paymentForm.notes, invoice_id: paymentForm.invoice_id || null
            });
            toast.success("Receipt logged successfully!");
            setPaymentForm({
                amount: "", date: new Date().toISOString().split("T")[0],
                method: "Bank Transfer", reference: "", notes: "", invoice_id: ""
            });
            onSaved();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Failed");
        } finally { setLoading(false); }
    };

    const handleAddMilestone = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            await api.post(`/admin/projects/${project.id}/payment-schedule`, {
                ...milestoneForm, amount: Number(milestoneForm.amount) || 0
            });
            toast.success("Milestone added");
            setMilestoneForm({ name: "", stage: "General", due_date: "", amount: "", status: "pending" });
            onSaved();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Failed");
        } finally { setLoading(false); }
    };

    const deleteInvoice = async (id) => {
        if (!window.confirm("Delete this proforma?")) return;
        try { await api.delete(`/admin/projects/${project.id}/invoices/${id}`); toast.success("Deleted"); onSaved(); }
        catch { toast.error("Failed"); }
    };

    const deletePayment = async (id) => {
        if (!window.confirm("Reverse this receipt?")) return;
        try { await api.delete(`/admin/projects/${project.id}/payments/${id}`); toast.success("Reversed"); onSaved(); }
        catch { toast.error("Failed"); }
    };

    const deleteMilestone = async (id) => {
        if (!window.confirm("Delete this milestone?")) return;
        try { await api.delete(`/admin/projects/${project.id}/payment-schedule/${id}`); toast.success("Deleted"); onSaved(); }
        catch { toast.error("Failed"); }
    };

    /* =================== RENDER =================== */
    return (
        <div className="space-y-4 font-['Poppins']">

            {/* ====== EDIT INVOICE MODAL ====== */}
            {editingInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-[#B89416]" />
                                <h3 className="text-sm font-bold text-[#252A2A]">Edit Proforma {editingInvoice.number}</h3>
                            </div>
                            <button onClick={() => setEditingInvoice(null)} className="p-1.5 hover:bg-gray-200 rounded-lg transition">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleEditInvoice} className="p-4 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[10px] text-amber-800 font-medium flex items-start gap-2">
                                <Pencil className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <span>Editing this proforma will automatically notify the client via email and push notification with a summary of all changes made.</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Proforma #</label>
                                    <input value={editForm.number} onChange={(e) => setEditForm({ ...editForm, number: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg font-bold outline-none focus:border-[#B89416]" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Stage</label>
                                    <select value={editForm.stage} onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#B89416]">
                                        <option value="General">General</option>
                                        {dynamicStages.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Heading / Description</label>
                                <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] text-xs" />
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-xs">
                                <div>
                                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Amount (₹)</label>
                                    <input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-[#B89416] outline-none focus:border-[#B89416]" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Invoice Date</label>
                                    <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416]" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Due Date</label>
                                    <input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416]" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Status</label>
                                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#B89416] text-xs font-bold">
                                    <option value="upcoming">Upcoming</option>
                                    <option value="due_soon">Due Soon</option>
                                    <option value="partially_paid">Partially Paid</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="void">Void</option>
                                </select>
                            </div>

                            {editingInvoice.edit_history?.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <h4 className="text-[9px] font-bold text-gray-500 uppercase mb-2">Previous Edits</h4>
                                    <div className="space-y-1.5 max-h-24 overflow-y-auto">
                                        {editingInvoice.edit_history.map((h, i) => (
                                            <div key={i} className="text-[9px] text-gray-600 flex items-start gap-1">
                                                <span className="text-gray-400 shrink-0">
                                                    {new Date(h.edited_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                                <span>— {h.changes?.join(", ") || "Edit"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setEditingInvoice(null)} className="px-4 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                                <button type="submit" disabled={editLoading} className="px-4 py-2 bg-[#B89416] hover:bg-[#8F7210] text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5">
                                    {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save & Notify Client
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ====== EDIT MILESTONE MODAL ====== */}
            {editingMilestone && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-[#B89416]" />
                                <h3 className="text-sm font-bold text-[#252A2A]">Edit Milestone</h3>
                            </div>
                            <button onClick={() => setEditingMilestone(null)} className="p-1.5 hover:bg-gray-200 rounded-lg transition"><X className="w-4 h-4 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleEditMilestone} className="p-4 space-y-4">
                            {editingMilestone.status === "paid" && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[10px] text-red-800 font-medium">⚠ Paid milestones cannot be edited.</div>
                            )}
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Milestone Name *</label>
                                <input required value={milestoneEditForm.name} onChange={(e) => setMilestoneEditForm({ ...milestoneEditForm, name: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] text-xs" disabled={editingMilestone.status === "paid"} />
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Stage</label>
                                    <select value={milestoneEditForm.stage} onChange={(e) => setMilestoneEditForm({ ...milestoneEditForm, stage: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#B89416]" disabled={editingMilestone.status === "paid"}>
                                        <option value="General">General</option>
                                        {dynamicStages.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Target Date</label>
                                    <input type="date" value={milestoneEditForm.due_date} onChange={(e) => setMilestoneEditForm({ ...milestoneEditForm, due_date: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416]" disabled={editingMilestone.status === "paid"} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Amount (₹) *</label>
                                <input type="number" required value={milestoneEditForm.amount} onChange={(e) => setMilestoneEditForm({ ...milestoneEditForm, amount: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-[#B89416] outline-none focus:border-[#B89416]" disabled={editingMilestone.status === "paid"} />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setEditingMilestone(null)} className="px-4 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                                <button type="submit" disabled={milestoneEditLoading || editingMilestone.status === "paid"} className="px-4 py-2 bg-[#B89416] hover:bg-[#8F7210] text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5 disabled:opacity-50">
                                    {milestoneEditLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ====== EDIT RECEIPT MODAL ====== */}
            {editingReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-emerald-600" />
                                <h3 className="text-sm font-bold text-[#252A2A]">Edit Receipt {editingReceipt.receipt_number || ""}</h3>
                            </div>
                            <button onClick={() => setEditingReceipt(null)} className="p-1.5 hover:bg-gray-200 rounded-lg transition"><X className="w-4 h-4 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleEditReceipt} className="p-4 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[10px] text-amber-800 font-medium">⚠ Editing amount auto-adjusts linked proforma balance.</div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Amount (₹) *</label>
                                    <input type="number" required value={receiptEditForm.amount} onChange={(e) => setReceiptEditForm({ ...receiptEditForm, amount: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-emerald-600 outline-none focus:border-[#B89416]" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Date</label>
                                    <input type="date" value={receiptEditForm.date} onChange={(e) => setReceiptEditForm({ ...receiptEditForm, date: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416]" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Method</label>
                                <select value={receiptEditForm.method} onChange={(e) => setReceiptEditForm({ ...receiptEditForm, method: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#B89416] text-xs">
                                    <option>Bank Transfer</option><option>UPI</option><option>Cheque</option><option>Cash</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Reference / UTR</label>
                                <input value={receiptEditForm.reference} onChange={(e) => setReceiptEditForm({ ...receiptEditForm, reference: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] text-xs" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                                    Notes (shown on PDF)
                                    <span className="text-gray-400 normal-case font-normal ml-1">— Blank = default thank you</span>
                                </label>
                                <textarea rows="2" value={receiptEditForm.notes} onChange={(e) => setReceiptEditForm({ ...receiptEditForm, notes: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] text-xs" />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setEditingReceipt(null)} className="px-4 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                                <button type="submit" disabled={receiptEditLoading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5">
                                    {receiptEditLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ====== FINANCIAL OVERVIEW STRIP ====== */}
            <div className="bg-[#252A2A] rounded-xl p-4 text-white shadow-sm grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 border-t-2 border-[#B89416]">
                <div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Base Contract</div>
                    <div className="text-sm font-black text-white mt-0.5">{fmtINR(baseContract)}</div>
                </div>
                <div>
                    <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Approved Variations</div>
                    <div className="text-sm font-black text-amber-400 mt-0.5">+ {fmtINR(approvedVariations)}</div>
                    {pendingVariationsSum > 0 && <div className="text-[8px] text-amber-300 mt-0.5">{fmtINR(pendingVariationsSum)} pending</div>}
                </div>
                <div className="bg-white/5 rounded-lg p-1 -m-1">
                    <div className="text-[9px] font-bold text-[#B89416] uppercase tracking-wider">Total Contract Value</div>
                    <div className="text-sm font-black text-[#B89416] mt-0.5">{fmtINR(totalContractValue)}</div>
                    <div className="text-[8px] text-gray-400 mt-0.5">Base + Approved</div>
                </div>
                <div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Invoiced</div>
                    <div className="text-sm font-black text-white mt-0.5">{fmtINR(totalInvoiced)}</div>
                </div>
                <div>
                    <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Total Paid</div>
                    <div className="text-sm font-black text-emerald-400 mt-0.5">{fmtINR(totalPaid)}</div>
                </div>
                <div>
                    <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Outstanding</div>
                    <div className="text-sm font-black text-red-400 mt-0.5">{fmtINR(outstanding)}</div>
                </div>
            </div>

            {/* ====== TABS ====== */}
            <div className="flex items-center gap-4 border-b border-gray-200 overflow-x-auto no-scrollbar">
                {[
                    { id: "schedule", label: `Schedule (${(project.payment_schedule || []).length})` },
                    { id: "invoices", label: `Proforma Invoices (${invoices.length})` },
                    { id: "variations", label: `Variations (${(project.variations || []).length})` },
                    { id: "payments", label: `Receipts (${(project.payments_log || []).length})` },
                    { id: "master", label: "Contract Setup" },
                    // { id: "settings", label: "Proforma Settings" },
                ].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`pb-2 text-xs font-bold whitespace-nowrap relative ${activeTab === tab.id ? "text-[#252A2A]" : "text-gray-400 hover:text-gray-700"}`}>
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B89416]" />}
                    </button>
                ))}
            </div>

            {/* ====== TAB: SCHEDULE ====== */}
            {activeTab === "schedule" && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-xs font-bold text-[#252A2A] mb-3 uppercase tracking-wider">Add Milestone to Schedule</h3>
                        <form onSubmit={handleAddMilestone} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end text-xs">
                            <div className="md:col-span-2">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Milestone Name *</label>
                                <input required value={milestoneForm.name} onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })} placeholder="e.g. Upon Plinth Completion" className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416]" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Related Stage</label>
                                <select value={milestoneForm.stage} onChange={(e) => setMilestoneForm({ ...milestoneForm, stage: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#B89416]">
                                    <option value="General">General</option>
                                    {dynamicStages.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Amount (₹) *</label>
                                <input type="number" required value={milestoneForm.amount} onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-[#B89416] outline-none focus:border-[#B89416]" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Target Date</label>
                                <input type="date" value={milestoneForm.due_date} onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416]" />
                            </div>
                            <button type="submit" disabled={loading} className="bg-[#252A2A] hover:bg-[#B89416] text-white font-bold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1 shadow-sm">
                                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-[11px] min-w-[600px]">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                                <tr><th className="p-3">Milestone</th><th className="p-3">Stage</th><th className="p-3">Target Date</th><th className="p-3">Amount</th><th className="p-3 text-center">Status</th><th className="p-3 text-right">Action</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(project.payment_schedule || []).length === 0 ? (
                                    <tr><td colSpan="6" className="py-8 text-center text-gray-400 italic">No milestones added.</td></tr>
                                ) : (
                                    (project.payment_schedule || []).map((ms) => (
                                        <tr key={ms.id} className="hover:bg-gray-50 transition">
                                            <td className="p-3 font-bold text-[#252A2A]">{ms.name}</td>
                                            <td className="p-3 text-[#B89416] font-semibold">{ms.stage || "General"}</td>
                                            <td className="p-3 text-gray-500">{ms.due_date || "—"}</td>
                                            <td className="p-3 font-bold text-gray-900">{fmtINR(ms.amount)}</td>
                                            <td className="p-3 text-center">
                                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${ms.status === "invoiced" ? "bg-blue-50 text-blue-700 border-blue-200" : ms.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>{ms.status}</span>
                                            </td>
                                            <td className="p-3 text-right whitespace-nowrap">
                                                {ms.status === "pending" ? (
                                                    <button onClick={() => raiseInvoiceFromMilestone(ms)} className="px-3 py-1 bg-[#252A2A] text-white text-[9px] font-bold rounded hover:bg-[#B89416] transition inline-flex items-center gap-1 shadow-sm mr-2">
                                                        Raise Proforma <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                ) : (<span className="text-[9px] font-bold text-gray-400 mr-4 italic">Invoiced</span>)}
                                                
                                                {ms.status !== "paid" && (
                                                    <button onClick={() => openEditMilestone(ms)} className="text-[#B89416] p-1.5 hover:bg-orange-50 rounded-lg mr-1 transition" title="Edit">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                <button onClick={() => deleteMilestone(ms.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ====== TAB 1: PROFORMA INVOICES ====== */}
            {activeTab === "invoices" && (
                <div className="space-y-4 animate-in fade-in">
                    <div className={`p-4 rounded-xl border shadow-sm transition-colors ${invoiceForm.milestone_id ? "bg-amber-50 border-amber-300" : invoiceForm.variation_id ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"}`}>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-[#252A2A] uppercase tracking-wider">Raise New Proforma Invoice</h3>
                            <div className="flex gap-2">
                                {invoiceForm.milestone_id && <span className="text-[9px] font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded uppercase">From Milestone</span>}
                                {invoiceForm.variation_id && <span className="text-[9px] font-bold text-blue-700 bg-blue-200 px-2 py-0.5 rounded uppercase">From Variation</span>}
                            </div>
                        </div>
                        <form onSubmit={handleCreateInvoice} className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end text-xs">
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Proforma #</label>
                                <input required value={invoiceForm.number} onChange={(e) => setInvoiceForm({ ...invoiceForm, number: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg font-bold outline-none focus:border-[#B89416] bg-white" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Description *</label>
                                <input required value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} placeholder="e.g. Phase 3 Structure" className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] bg-white" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Stage</label>
                                <select value={invoiceForm.stage} onChange={(e) => setInvoiceForm({ ...invoiceForm, stage: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] bg-white">
                                    <option value="General">General</option>
                                    {dynamicStages.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Amount (₹) *</label>
                                <input type="number" required value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-[#B89416] outline-none focus:border-[#B89416] bg-white" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Due Date *</label>
                                <input type="date" required value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] bg-white" />
                            </div>
                            <button type="submit" disabled={loading} className="bg-[#252A2A] hover:bg-[#B89416] text-white font-bold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1 shadow-sm">
                                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Raise
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px] min-w-[900px]">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                                    <tr>
                                        <th className="p-3">Proforma #</th>
                                        <th className="p-3">Milestone Heading</th>
                                        <th className="p-3">Stage</th>
                                        <th className="p-3">Due Date</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Paid</th>
                                        <th className="p-3">Balance</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoices.length === 0 ? (
                                        <tr><td colSpan="9" className="p-8 text-center text-gray-400 italic">No proformas raised yet.</td></tr>
                                    ) : (
                                        [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date)).map((inv) => {
                                            const balance = Math.max(0, Number(inv.amount) - Number(inv.paid_amount || 0));
                                            return (
                                                <tr key={inv.id} className="hover:bg-gray-50 transition">
                                                    <td className="p-3 font-mono font-bold text-[#252A2A]">
                                                        {inv.number}
                                                        {inv.edit_history?.length > 0 && (
                                                            <span className="ml-1 text-[8px] text-amber-600 font-normal">(edited {inv.edit_history.length}×)</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 max-w-[220px]">
                                                        <div className="font-bold text-gray-900 truncate">{inv.description}</div>
                                                    </td>
                                                    
                                                    <td className="p-3 text-[10px] text-[#B89416] font-semibold">{inv.stage || "General"}</td>
                                                    <td className="p-3 text-gray-500">{inv.due_date}</td>
                                                    <td className="p-3 font-bold text-gray-900">{fmtINR(inv.amount)}</td>
                                                    <td className="p-3 font-bold text-emerald-600">{fmtINR(inv.paid_amount || 0)}</td>
                                                    <td className="p-3 font-bold text-red-600">{balance > 0 ? fmtINR(balance) : "—"}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${inv.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                            inv.status === "overdue" ? "bg-red-50 text-red-700 border-red-200" :
                                                                inv.status === "void" ? "bg-gray-100 text-gray-500 border-gray-200" :
                                                                    "bg-amber-50 text-amber-700 border-amber-200"
                                                            }`}>{inv.status.replace("_", " ")}</span>
                                                    </td>
                                                    <td className="p-3 text-right whitespace-nowrap">
                                                        <button onClick={() => openEditInvoice(inv)} className="text-[#B89416] p-1.5 hover:bg-orange-50 rounded-lg mr-1 transition" title="Edit">
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        {inv.status !== "paid" && inv.status !== "void" && (
                                                            <button onClick={() => recordPaymentForInvoice(inv)} className="bg-emerald-600 text-white px-2 py-1 rounded text-[9px] font-bold hover:bg-emerald-700 transition mr-1 inline-flex items-center gap-1">
                                                                <IndianRupee className="w-2.5 h-2.5" /> Receipt
                                                            </button>
                                                        )}
                                                        <button onClick={() => window.open(`${API_BASE}/admin/projects/${project.id}/invoices/${inv.id}/pdf?t=${Date.now()}`, "_blank")} className="text-[#1A73E8] p-1.5 hover:bg-blue-50 rounded-lg mr-1 text-[9px] font-bold uppercase transition">PDF</button>
                                                        <button onClick={() => deleteInvoice(inv.id)} className="text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== TAB 3: VARIATIONS ====== */}
            {activeTab === "variations" && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-xs font-bold text-[#252A2A] mb-3 uppercase tracking-wider">Log Variation / Extra Scope Item</h3>
                        <form onSubmit={handleCreateVariation} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs">
                            <div className="sm:col-span-2">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Description *</label>
                                <input required value={variationForm.description} onChange={(e) => setVariationForm({ ...variationForm, description: e.target.value })} placeholder="e.g. Italian marble upgrade" className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416]" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Amount (₹) *</label>
                                <input type="number" required value={variationForm.amount} onChange={(e) => setVariationForm({ ...variationForm, amount: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-amber-600 outline-none focus:border-[#B89416]" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Status</label>
                                <select value={variationForm.status} onChange={(e) => setVariationForm({ ...variationForm, status: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#B89416] font-bold text-gray-700">
                                    <option value="pending">Awaiting Client Approval</option>
                                    <option value="approved">Pre-Approved</option>
                                </select>
                            </div>
                            <button type="submit" disabled={loading} className="bg-[#252A2A] hover:bg-[#B89416] text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-1 shadow-sm">
                                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-[11px] min-w-[700px]">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="p-3">Description</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Proforma</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(project.variations || []).length === 0 ? (
                                    <tr><td colSpan="5" className="py-8 text-center text-gray-400 italic">No variations logged.</td></tr>
                                ) : (
                                    (project.variations || []).map((v) => {
                                        const linkedInvoice = v.invoice_id ? invoices.find((i) => i.id === v.invoice_id) : null;
                                        const isPaid = isVariationPaid(v);
                                        const isPartial = isVariationPartial(v);
                                        return (
                                            <tr key={v.id} className="hover:bg-gray-50 transition">
                                                <td className="p-3 font-bold text-gray-900">{v.description}</td>
                                                <td className="p-3 font-bold text-amber-600">+ {fmtINR(v.amount)}</td>
                                                <td className="p-3">
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${v.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                        v.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                            "bg-red-50 text-red-700 border-red-200"
                                                        }`}>{v.status}</span>
                                                </td>
                                                <td className="p-3">
                                                    {linkedInvoice ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                                {linkedInvoice.number}
                                                            </span>
                                                            {isPaid && (
                                                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-0.5">
                                                                    <CheckCircle2 className="w-2.5 h-2.5" /> PAID
                                                                </span>
                                                            )}
                                                            {isPartial && (
                                                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                    PARTIAL
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : v.status === "approved" ? (
                                                        <span className="text-[9px] text-gray-400 italic">No proforma yet</span>
                                                    ) : (
                                                        <span className="text-[9px] text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right whitespace-nowrap space-x-1">
                                                    {v.status === "approved" && !v.invoice_id && (
                                                        <button onClick={() => raiseInvoiceFromVariation(v)}
                                                            className="px-2 py-1 bg-[#252A2A] text-white font-bold text-[9px] rounded hover:bg-[#B89416] transition inline-flex items-center gap-1">
                                                            <FileText className="w-2.5 h-2.5" /> Raise
                                                        </button>
                                                    )}

                                                    {v.status === "approved" && !isPaid && (
                                                        <button onClick={() => logReceiptForVariation(v)}
                                                            className="px-2 py-1 bg-emerald-600 text-white font-bold text-[9px] rounded hover:bg-emerald-700 transition inline-flex items-center gap-1">
                                                            <Receipt className="w-2.5 h-2.5" /> Receipt
                                                        </button>
                                                    )}

                                                    {v.status === "approved" && isPaid && (
                                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 font-bold text-[9px] rounded border border-emerald-200 inline-flex items-center gap-1">
                                                            <CheckCircle2 className="w-2.5 h-2.5" /> Paid
                                                        </span>
                                                    )}

                                                    {v.status !== "approved" && (
                                                        <button onClick={() => changeVariationStatus(v.id, "approved")}
                                                            className="px-2 py-1 bg-emerald-600 text-white font-bold text-[9px] rounded hover:bg-emerald-700 transition">
                                                            Force Approve
                                                        </button>
                                                    )}
                                                    {v.status === "pending" && (
                                                        <button onClick={() => changeVariationStatus(v.id, "rejected")}
                                                            className="px-2 py-1 bg-red-600 text-white font-bold text-[9px] rounded hover:bg-red-700 transition">
                                                            Reject
                                                        </button>
                                                    )}
                                                    <button onClick={() => deleteVariation(v.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition inline-flex items-center align-middle">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ====== TAB 4: PAYMENT RECEIPTS ====== */}
            {activeTab === "payments" && (
                <div className="space-y-4 animate-in fade-in">
                    <div className={`p-4 rounded-xl border shadow-sm transition-colors ${paymentForm.invoice_id ? "bg-emerald-50 border-emerald-300" : "bg-white border-gray-200"}`}>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-[#252A2A] uppercase tracking-wider">Log Client Payment Receipt</h3>
                            {paymentForm.invoice_id && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-200 px-2 py-0.5 rounded uppercase">
                                        Allocating to {invoices.find((i) => i.id === paymentForm.invoice_id)?.number || "Invoice"}
                                    </span>
                                    <button onClick={() => setPaymentForm((p) => ({ ...p, invoice_id: "", amount: "" }))} className="text-gray-400 hover:text-red-500 transition">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <form onSubmit={savePayment} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end text-xs">
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                                    Allocate to Proforma
                                </label>
                                <select
                                    value={paymentForm.invoice_id}
                                    onChange={(e) => handleInvoiceSelectInPayment(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#B89416]"
                                >
                                    <option value="">General Payment</option>
                                    {invoices
                                        .filter((i) => i.status !== "void" && i.status !== "paid")
                                        .map((i) => (
                                            <option key={i.id} value={i.id}>{getInvoiceLabel(i)}</option>
                                        ))}
                                </select>
                                {invoices.filter((i) => i.status !== "void" && i.status !== "paid").length === 0 && invoices.length > 0 && (
                                    <p className="text-[9px] text-emerald-600 font-semibold mt-1">
                                        ✅ All proformas are fully paid!
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                                    Amount (₹) *
                                    {paymentForm.invoice_id && (
                                        <span className="text-emerald-600 ml-1 normal-case">
                                            (Bal: {fmtINR(getInvoiceRemaining(paymentForm.invoice_id))})
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    className="w-full p-2 border border-gray-200 rounded-lg font-bold text-emerald-600 outline-none focus:border-[#B89416] bg-white"
                                    placeholder={paymentForm.invoice_id ? "Auto-filled" : "Enter amount"}
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Receipt Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={paymentForm.date}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Method</label>
                                <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#B89416]">
                                    <option>Bank Transfer</option><option>UPI</option><option>Cheque</option><option>Cash</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Ref / UTR</label>
                                <input value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="UTR12345" className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] bg-white" />
                            </div>
                            
                            <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-1 shadow-sm">
                                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <IndianRupee className="w-3 h-3" />} Log Receipt
                            </button>

                            <div className="col-span-2 md:col-span-6">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                                    Receipt Notes (shown on PDF)
                                    <span className="text-gray-400 normal-case font-normal ml-1">— Leave blank for default thank you message</span>
                                </label>
                                <textarea
                                    rows="2"
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    placeholder="e.g. Payment received for Phase 2 completion. Thanks for the prompt transfer."
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] bg-white text-xs"
                                />
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-[11px] min-w-[600px]">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="p-3">Date</th><th className="p-3">Amount</th>
                                    <th className="p-3">Method & Ref</th><th className="p-3">Linked Proforma</th>
                                    <th className="p-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(project.payments_log || []).length === 0 ? (
                                    <tr><td colSpan="5" className="py-8 text-center text-gray-400 italic">No payments logged.</td></tr>
                                ) : (
                                    [...project.payments_log].sort((a, b) => new Date(b.date) - new Date(a.date)).map((p) => {
                                        const linkedInv = p.invoice_id ? invoices.find((i) => i.id === p.invoice_id) : null;
                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50 transition">
                                                <td className="p-3 font-bold text-gray-900">{p.date}</td>
                                                <td className="p-3 font-bold text-emerald-600">{fmtINR(p.amount)}</td>
                                                <td className="p-3">
                                                    <span className="font-semibold">{p.method}</span>{" "}
                                                    <span className="text-gray-400 font-mono">({p.reference || "N/A"})</span>
                                                </td>
                                                <td className="p-3">
                                                    {linkedInv ? (
                                                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{linkedInv.number}</span>
                                                    ) : (
                                                        <span className="text-[9px] text-gray-400 italic">General</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right whitespace-nowrap">
                                                    <button onClick={() => openEditReceipt(p)} className="text-[#B89416] p-1.5 hover:bg-orange-50 rounded-lg mr-1 transition" title="Edit">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => window.open(`${API_BASE}/admin/projects/${project.id}/receipts/${p.id}/pdf?t=${Date.now()}`, "_blank")} className="text-[#1A73E8] p-1.5 hover:bg-blue-50 rounded-lg mr-1 text-[9px] font-bold uppercase transition">PDF</button>
                                                    <button onClick={() => deletePayment(p.id)} className="text-red-500 text-[10px] font-bold hover:underline">Reverse</button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ====== TAB 5: MASTER CONTRACT ====== */}
            {activeTab === "master" && (
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm max-w-md animate-in fade-in">
                    <h3 className="text-xs font-bold text-[#252A2A] mb-3 uppercase tracking-wider">Base Contract Value</h3>
                    <div className="space-y-3 text-xs">
                        <div>
                            <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Contract Amount (₹)</label>
                            <input type="number" value={contractValue} onChange={(e) => setContractValue(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg font-black text-lg text-[#252A2A] outline-none focus:border-[#B89416]" />
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-gray-500">Base Contract</span>
                                <span className="font-bold">{fmtINR(contractValue)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] mt-1">
                                <span className="text-gray-500">+ Approved Variations</span>
                                <span className="font-bold text-amber-600">{fmtINR(approvedVariations)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] mt-2 pt-2 border-t border-gray-200">
                                <span className="font-bold text-[#252A2A]">Total Contract Value</span>
                                <span className="font-black text-[#B89416]">{fmtINR(Number(contractValue || 0) + approvedVariations)}</span>
                            </div>
                        </div>
                        <button onClick={saveBaseSettings} disabled={savingSettings} className="w-full bg-[#252A2A] hover:bg-[#B89416] text-white font-bold py-2.5 rounded-lg transition text-xs shadow-sm">
                            {savingSettings ? "Updating..." : "Update Base Contract"}
                        </button>
                    </div>
                </div>
            )}

            {/* ====== TAB 6: INVOICE SETTINGS ====== */}
            {activeTab === "settings" && (
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm max-w-2xl animate-in fade-in">
                    <div className="mb-4 border-b border-gray-100 pb-3">
                        <h3 className="text-sm font-bold text-[#252A2A] mb-1">PDF Proforma & Receipt Settings</h3>
                        <p className="text-[10px] text-gray-500">Update the bank details, terms, and tax percentages that appear on automatically generated PDFs.</p>
                    </div>
                    <div className="space-y-4 text-xs">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Applicable GST (%)</label>
                            <input 
                                type="number" 
                                value={invoiceSettings.invoice_gst_percent} 
                                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_gst_percent: e.target.value })} 
                                className="w-full sm:w-32 p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] bg-white font-bold" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bank Account Details (Visible on PDF)</label>
                            <textarea 
                                rows="4" 
                                value={invoiceSettings.invoice_bank_details} 
                                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_bank_details: e.target.value })} 
                                className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] bg-white font-mono leading-relaxed" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Footer Notes / Terms</label>
                            <textarea 
                                rows="2" 
                                value={invoiceSettings.invoice_footer_notes} 
                                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_footer_notes: e.target.value })} 
                                className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#B89416] bg-white" 
                            />
                        </div>
                        <div className="pt-2">
                            <button onClick={saveInvoiceSettings} disabled={savingSettings} className="bg-[#1A73E8] hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition shadow-sm flex items-center justify-center gap-1.5">
                                {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}