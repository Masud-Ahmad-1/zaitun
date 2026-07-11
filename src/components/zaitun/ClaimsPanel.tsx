"use client";

import { useZaitunStore } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { ShieldCheck, ShieldX, Clock, CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function ClaimsPanel() {
  const {
    showClaimsPanel, setShowClaimsPanel, locale, activeTreeId,
    pendingClaims, setPendingClaims, user,
  } = useZaitunStore();

  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchClaims = async (status: string) => {
    if (!activeTreeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/claims?treeId=${activeTreeId}&status=${status}`);
      if (res.ok) {
        const data = await res.json();
        if (status === "pending") setPendingClaims(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    if (showClaimsPanel && activeTreeId) {
      fetchClaims(tab);
    }
  }, [showClaimsPanel, activeTreeId, tab]);

  const handleAction = async (claimId: string, action: "approve" | "reject") => {
    setActionLoading(claimId);
    try {
      const res = await fetch("/api/claims", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, action }),
      });
      if (res.ok) {
        toast.success(action === "approve"
          ? t(locale, "claim.approved")
          : t(locale, "claim.rejected")
        );
        fetchClaims("pending");
      } else {
        const data = await res.json();
        toast.error(data.error || "Error");
      }
    } catch {
      toast.error("Server error");
    }
    setActionLoading(null);
  };

  if (!showClaimsPanel) return null;

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-amber-500" />;
      case "approved": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-50 border-amber-200 text-amber-700";
      case "approved": return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "rejected": return "bg-red-50 border-red-200 text-red-700";
      default: return "";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending": return t(locale, "claim.pending");
      case "approved": return t(locale, "claim.approved");
      case "rejected": return t(locale, "claim.rejected");
      default: return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setShowClaimsPanel(false)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-emerald-950">{t(locale, "claim.panel")}</h2>
            {pendingClaims.length > 0 && (
              <Badge className="bg-amber-500 text-white">{pendingClaims.length}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowClaimsPanel(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === s
                  ? "bg-emerald-100 text-emerald-800"
                  : "text-emerald-600/60 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {statusLabel(s)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
            </div>
          ) : pendingClaims.length === 0 && tab === "pending" ? (
            <p className="text-center text-emerald-600/50 py-12">{t(locale, "claim.noClaims")}</p>
          ) : (
            <AnimatePresence>
              {pendingClaims
                .filter((c) => tab === "pending" || c.status === tab)
                .map((claim) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`border rounded-xl p-4 ${statusColor(claim.status)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {statusIcon(claim.status)}
                        <span className="font-medium text-sm">
                          {claim.claimant?.name || "Unknown"}
                        </span>
                        <span className="text-xs opacity-60">→</span>
                        <span className="font-medium text-sm">
                          {claim.person?.firstName} {claim.person?.lastName || ""}
                        </span>
                      </div>

                      {claim.relationship && (
                        <p className="text-xs opacity-70 mb-1">
                          {t(locale, "claim.relationship")}: {claim.relationship}
                        </p>
                      )}

                      {claim.evidence && (
                        <p className="text-sm mt-2 bg-white/60 rounded-lg p-2.5 border border-white/80">
                          {claim.evidence}
                        </p>
                      )}

                      {claim.witnesses && claim.witnesses.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                          <span>{t(locale, "claim.witnesses")}:</span>
                          {claim.witnesses.map((w) => w.user.name).join(", ")}
                        </div>
                      )}

                      <p className="text-xs opacity-40 mt-2">
                        {new Date(claim.createdAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US")}
                      </p>
                    </div>

                    {claim.status === "pending" && user && (
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleAction(claim.id, "approve")}
                          disabled={actionLoading === claim.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-xs gap-1"
                        >
                          {actionLoading === claim.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          {t(locale, "claim.approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(claim.id, "reject")}
                          disabled={actionLoading === claim.id}
                          className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3 text-xs gap-1"
                        >
                          <ShieldX className="w-3.5 h-3.5" />
                          {t(locale, "claim.reject")}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}