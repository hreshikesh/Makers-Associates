"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, User, Mail, MapPin, MessageSquare, ShieldCheck, Loader2 } from "lucide-react";
import { publicApi } from "@/lib/api";
import { toast } from "sonner";

export default function LeadModal({ isOpen, onClose, context = {} }) {
  const [form, setForm] = useState({
    name: "",
    phone: "+91 ",
    email: "",
    city: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setForm({ name: "", phone: "+91 ", email: "", city: "", message: "" });
    }
  }, [isOpen]);

  // Name handler: Alphabets & spaces only, max 30 characters
  const handleNameChange = (val) => {
    if (/^[a-zA-Z\s]*$/.test(val) && val.length <= 30) {
      setForm((prev) => ({ ...prev, name: val }));
      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  // Phone handler: Fixed +91 prefix, strictly 10 numeric digits
  const handlePhoneChange = (val) => {
    const digitsOnly = val.replace(/^\+91\s?/, "").replace(/\D/g, "").slice(0, 10);
    setForm((prev) => ({ ...prev, phone: `+91 ${digitsOnly}` }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  // City handler: Alphabets & spaces only
  const handleCityChange = (val) => {
    if (/^[a-zA-Z\s]*$/.test(val)) {
      setForm((prev) => ({ ...prev, city: val }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name Validation
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      newErrors.name = "Full name is required";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Phone Number Validation (Strictly 10 digits after +91)
    const phoneDigits = form.phone.replace(/^\+91\s?/, "").replace(/\D/g, "");
    if (!phoneDigits) {
      newErrors.phone = "Phone number is required";
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = "Enter a valid 10-digit mobile number";
    }

    // Optional Email Validation
    if (form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        newErrors.email = "Enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setErrors({});
    setForm({ name: "", phone: "+91 ", email: "", city: "", message: "" });
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicApi.submitLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        city: form.city.trim() || undefined,
        message: form.message.trim() || undefined,
        interested_home: context.home || undefined,
        interested_package: context.package || undefined,
        source: context.source || "consultation",
        quiz_submission_id: context.quiz_submission_id || undefined,
      });

      toast.success(res.message || "Thanks! Our team will call you shortly.");
      handleClose();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            data-testid="lead-modal"
            initial={{ scale: 0.96, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-premium overflow-hidden"
          >
            <div className="relative p-6 pb-4 bg-gradient-to-br from-brand-navy to-brand-navySoft text-white">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="section-eyebrow text-brand-orangeLight">Get Free Consultation</div>
              <h3 className="mt-2 text-2xl font-bold">Build your dream home with [Your Brand]s</h3>
              <p className="text-white/70 text-sm mt-1">
                Talk to our AI-powered consultants. It’s free & no obligation.
              </p>
              {(context.home || context.package) && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-full">
                  {context.home && <span>Home: <b>{context.home}</b></span>}
                  {context.package && <span>Package: <b>{context.package}</b></span>}
                </div>
              )}
            </div>

            <form onSubmit={submit} className="p-6 space-y-3">
              <Field
                icon={User}
                placeholder="Full name*"
                value={form.name}
                onChange={handleNameChange}
                error={errors.name}
                testId="lead-name"
                maxLength={30}
              />

              <Field
                icon={Phone}
                placeholder="Phone number*"
                type="tel"
                value={form.phone}
                onChange={handlePhoneChange}
                error={errors.phone}
                testId="lead-phone"
              />

              <Field
                icon={Mail}
                placeholder="Email (optional)"
                type="email"
                value={form.email}
                onChange={(v) => setForm((prev) => ({ ...prev, email: v }))}
                error={errors.email}
                testId="lead-email"
              />

              <Field
                icon={MapPin}
                placeholder="City (optional)"
                value={form.city}
                onChange={handleCityChange}
                testId="lead-city"
              />

              <Field
                icon={MessageSquare}
                placeholder="Message (optional)"
                value={form.message}
                onChange={(v) => setForm((prev) => ({ ...prev, message: v }))}
                isTextarea
                testId="lead-message"
              />

              <button
                type="submit"
                disabled={submitting}
                data-testid="lead-submit"
                className="btn-primary w-full mt-2 disabled:opacity-70 flex items-center justify-center gap-2 py-3 bg-[#B89416] hover:bg-[#8F7210] text-white font-semibold rounded-xl transition shadow-md"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {submitting ? "Submitting..." : "Request Free Consultation"}
              </button>

              <p className="text-[11px] text-brand-navy/50 text-center pt-1">
                By submitting, you agree to be contacted by [Your Brand]s. No spam, ever.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ icon: Icon, placeholder, value, onChange, type = "text", isTextarea, error, testId, maxLength }) {
  return (
    <div className="w-full">
      <div
        className={`flex items-start gap-2 rounded-xl border bg-white px-3 py-2.5 transition ${
          error
            ? "border-red-500 focus-within:border-red-500 ring-1 ring-red-500/20"
            : "border-black/10 focus-within:border-[#B89416]"
        }`}
      >
        <Icon className={`w-4 h-4 mt-1 shrink-0 ${error ? "text-red-500" : "text-brand-navy/50"}`} />
        {isTextarea ? (
          <textarea
            data-testid={testId}
            className="flex-1 bg-transparent outline-none text-sm resize-none min-h-[60px]"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            data-testid={testId}
            type={type}
            maxLength={maxLength}
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
      {error && <p className="mt-1 ml-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}