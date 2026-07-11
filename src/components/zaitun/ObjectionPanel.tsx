"use client";

import { useState, useEffect, useCallback } from "react";
import { useZaitunStore } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Check, X, MessageSquare, Trash2, Shield,
  ChevronDown, ChevronUp, Send, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ObjectionItem = {
  id: string;
  personId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string;
  rebuttal: string | null;
  status: string;
  raisedBy: string;
  resolvedBy: string | null;
  raisedByName: string;
  resolvedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

const FIELD_LABELS: Record<string, Record<string, string>> = {
  en: {
    firstName: "First Name", lastName: "Last Name", gender: "Gender",
    birthDate: "Birth Date", deathDate: "Death Date", bio: "Bio",
    occupation: "Occupation", isDeceased: "Deceased", photo: "Photo",
  },
  bn: {
    firstName: "নামের প্রথম অংশ", lastName: "নামের শেষ অংশ", gender: "লিঙ্গ",
    birthDate: "জন্ম তারিখ", deathDate: "মৃত্যু তারিখ", bio: "জীবনী",
    occupation: "পেশা", isDeceased: "মৃত", photo: "ছবি",
  },
};

const FIELD_OPTIONS = ["firstName", "lastName", "gender", "birthDate", "deathDate", "bio", "occupation"];

type ObjectionPanelProps = {
  personId: string;
  personName: string;
  personFields: Record<string, string | null | boolean>;
  isOwner: boolean;
  isProfileOwner: boolean;
};

export function ObjectionPanel({ personId, personName, personFields, isOwner, isProfileOwner }: ObjectionPanelProps) {
  const { locale, user } = useZaitunStore();
  const [objections, setObjections] = useState<ObjectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formField, setFormField] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formNewValue, setFormNewValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rebuttalId, setRebuttalId] = useState<string | null>(null);
  const [rebuttalText, setRebuttalText] = useState("");
  const [submittingRebuttal, setSubmittingRebuttal] = useState(false);

  const fetchObjections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/persons/${personId}/objections?personId=${personId}`);
      if (res.ok) {
        const data = await res.json();
        setObjections(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    if (expanded) fetchObjections();
  }, [expanded, fetchObjections]);

  const handleRaise = async () => {
    if (!formField || !formReason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/persons/${personId}/objections".replace("${personId}", personId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          field: formField,
          oldValue: personFields[formField] ? String(personFields[formField]) : null,
          newValue: formNewValue.trim() || null,
          reason: formReason.trim(),
        }),
      });
      if (res.ok) {
        toast.success(t(locale, "objection.raiseSuccess"));
        setFormField("");
        setFormReason("");
        setFormNewValue("");
        setShowForm(false);
        fetchObjections();
      } else {
        const data = await res.json();
        if (data.error === "cannot_object_own") {
          toast.error(t(locale, "objection.cannotObjectOwn"));
        } else {
          toast.error(data.error || "Error");
        }
      }
    } catch {
      toast.error("Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRebuttal = async (objId: string) => {
    if (!rebuttalText.trim()) return;
    setSubmittingRebuttal(true);
    try {
      const res = await fetch("/api/persons/${personId}/objections".replace("${personId}", personId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: objId, rebuttal: rebuttalText.trim() }),
      });
      if (res.ok) {
        toast.success(t(locale, "objection.rebuttalSuccess"));
        setRebuttalId(null);
        setRebuttalText("");
        fetchObjections();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error");
      }
    } catch {
      toast.error("Error");
    } finally {
      setSubmittingRebuttal(false);
    }
  };

  const handleResolve = async (objId: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/persons/${personId}/objections".replace("${personId}", personId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: objId, status }),
      });
      if (res.ok) {
        toast.success(t(locale, "objection.resolveSuccess"));
        fetchObjections();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error");
      }
    } catch {
      toast.error("Error");
    }
  };

  const handleDelete = async (objId: string) => {
    try {
      const res = await fetch("/api/persons/${personId}/objections?id=${objId}".replace("${personId}", personId).replace("${objId}", objId));
      if (res.ok) {
        toast.success(t(locale, "objection.deleteSuccess"));
        fetchObjections();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error");
      }
    } catch {
      toast.error("Error");
    }
  };

  const statusColor = (status: string) => {
    if (status === "approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
    return "bg-amber-100 text-amber-700 border-amber-200";
  };

  const statusLabel = (status: string) => {
    if (status === "approved") return t(locale, "objection.approved");
    if (status === "rejected") return t(locale, "objection.rejected");
    return t(locale, "objection.pending");
  };

  const canRaise = user && !isProfileOwner;
  const canResolve = isOwner || user?.role === "admin";
  const canRebut = isProfileOwner || user?.role === "admin";
  const pendingCount = objections.filter((o) => o.status === "pending").length;

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-emerald-600/70 hover:text-emerald-700 transition-colors"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>{t(locale, "objection.title")}</span>
        {pendingCount > 0 && (
          <Badge className="h-5 px-1.5 text-xs bg-amber-100 text-amber-700 border-amber-200">
            {pendingCount}
          </Badge>
        )}
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-3">
              {/* Raise objection button */}
              {canRaise && (
                <div>
                  {showForm ? (
                    <div className="bg-white border border-emerald-100 rounded-lg p-3 space-y-2">
                      <Select value={formField} onValueChange={setFormField}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder={t(locale, "objection.selectField")} />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {FIELD_LABELS[locale]?.[f] || f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {formField && personFields[formField] && (
                        <div className="text-xs text-emerald-600/60 space-y-0.5">
                          <span>{t(locale, "objection.oldValue")}: {String(personFields[formField])}</span>
                        </div>
                      )}

                      <Input
                        placeholder={t(locale, "objection.suggestedValue")}
                        value={formNewValue}
                        onChange={(e) => setFormNewValue(e.target.value)}
                        className="text-sm"
                      />
                      <Textarea
                        placeholder={t(locale, "objection.reasonPlaceholder")}
                        value={formReason}
                        onChange={(e) => setFormReason(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleRaise}
                          disabled={!formField || !formReason.trim() || submitting}
                          className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs"
                        >
                          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                          {t(locale, "objection.raise")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-xs">
                          {t(locale, "common.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowForm(true)}
                      className="text-xs border-amber-200 text-amber-700 hover:bg-amber-50 gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t(locale, "objection.raise")}
                    </Button>
                  )}
                </div>
              )}

              {/* Objections list */}
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                </div>
              ) : objections.length === 0 ? (
                <p className="text-xs text-emerald-600/40 py-2">{t(locale, "objection.noObjections")}</p>
              ) : (
                <div className="space-y-2">
                  {objections.map((obj) => (
                    <div
                      key={obj.id}
                      className="bg-white border border-emerald-50 rounded-lg p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {FIELD_LABELS[locale]?.[obj.field] || obj.field}
                          </Badge>
                          <Badge className={`text-xs ${statusColor(obj.status)}`}>
                            {statusLabel(obj.status)}
                          </Badge>
                          <span className="text-xs text-emerald-600/40">
                            {t(locale, "objection.raisedBy")}: {obj.raisedByName}
                          </span>
                        </div>
                        {obj.status === "pending" && (
                          <div className="flex gap-1">
                            {canResolve && (
                              <>
                                <button
                                  onClick={() => handleResolve(obj.id, "approved")}
                                  className="h-6 w-6 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                                  title={t(locale, "objection.approve")}
                                >
                                  <Check className="w-3 h-3 text-emerald-700" />
                                </button>
                                <button
                                  onClick={() => handleResolve(obj.id, "rejected")}
                                  className="h-6 w-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                                  title={t(locale, "objection.reject")}
                                >
                                  <X className="w-3 h-3 text-red-700" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(obj.id)}
                              className="h-6 w-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                              title={t(locale, "common.delete")}
                            >
                              <Trash2 className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Values */}
                      {(obj.oldValue || obj.newValue) && (
                        <div className="flex gap-3 text-xs flex-wrap">
                          {obj.oldValue && (
                            <span className="text-red-600/70 line-through">{t(locale, "objection.oldValue")}: {obj.oldValue}</span>
                          )}
                          {obj.newValue && (
                            <span className="text-emerald-700">{t(locale, "objection.newValue")}: {obj.newValue}</span>
                          )}
                        </div>
                      )}

                      {/* Reason */}
                      <p className="text-sm text-emerald-900/80">{obj.reason}</p>

                      {/* Rebuttal */}
                      {obj.rebuttal ? (
                        <div className="bg-sky-50 border border-sky-100 rounded p-2 mt-1">
                          <p className="text-xs text-sky-600 mb-0.5 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> {t(locale, "objection.rebut")}
                          </p>
                          <p className="text-sm text-sky-900/80">{obj.rebuttal}</p>
                        </div>
                      ) : canRebut && obj.status === "pending" ? (
                        rebuttalId === obj.id ? (
                          <div className="flex gap-2 mt-1">
                            <Textarea
                              placeholder={t(locale, "objection.rebuttalPlaceholder")}
                              value={rebuttalText}
                              onChange={(e) => setRebuttalText(e.target.value)}
                              rows={1}
                              className="text-sm flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleRebuttal(obj.id)}
                              disabled={!rebuttalText.trim() || submittingRebuttal}
                              className="bg-sky-600 hover:bg-sky-700 text-white gap-1 text-xs shrink-0"
                            >
                              {submittingRebuttal ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              {t(locale, "objection.rebut")}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setRebuttalId(obj.id); setRebuttalText(""); }}
                            className="text-xs text-sky-600 gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            {t(locale, "objection.rebut")}
                          </Button>
                        )
                      ) : null}

                      {/* Resolution info */}
                      {obj.status !== "pending" && obj.resolvedByName && (
                        <p className="text-xs text-emerald-600/40">
                          {t(locale, "objection.resolvedBy")}: {obj.resolvedByName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}