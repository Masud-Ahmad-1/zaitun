"use client";

import { useZaitunStore } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { useState } from "react";
import { ShieldCheck, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function ProfileClaimDialog() {
  const {
    showClaimDialog, setShowClaimDialog, claimTargetPerson, setClaimTargetPerson,
    locale, activeTreeId, user,
  } = useZaitunStore();

  const [relationship, setRelationship] = useState("");
  const [evidence, setEvidence] = useState("");
  const [witnessEmails, setWitnessEmails] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  if (!claimTargetPerson || !activeTreeId || !user) return null;

  const personName = `${claimTargetPerson.firstName} ${claimTargetPerson.lastName || ""}`.trim();

  const resetForm = () => {
    setRelationship("");
    setEvidence("");
    setWitnessEmails([""]);
  };

  const handleClose = () => {
    setShowClaimDialog(false);
    setClaimTargetPerson(null);
    resetForm();
  };

  const addWitnessField = () => {
    if (witnessEmails.length < 5) {
      setWitnessEmails([...witnessEmails, ""]);
    }
  };

  const removeWitnessField = (idx: number) => {
    setWitnessEmails(witnessEmails.filter((_, i) => i !== idx));
  };

  const updateWitnessEmail = (idx: number, val: string) => {
    const updated = [...witnessEmails];
    updated[idx] = val;
    setWitnessEmails(updated);
  };

  const handleSubmit = async () => {
    if (!evidence.trim()) {
      toast.error(locale === "bn" ? "প্রমাণ/ব্যাখ্যা আবশ্যক" : "Evidence is required");
      return;
    }

    setLoading(true);
    try {
      // Collect witness IDs (if the witness emails belong to tree members)
      const witnessIds: string[] = [];

      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: claimTargetPerson.id,
          treeId: activeTreeId,
          relationship: relationship || null,
          evidence: evidence.trim(),
          witnessIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(t(locale, "claim.claimSubmitted"));
        handleClose();
      } else {
        toast.error(data.error || "Error");
      }
    } catch {
      toast.error("Server error");
    }
    setLoading(false);
  };

  return (
    <Dialog open={showClaimDialog} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-emerald-950 text-xl">
            {t(locale, "claim.claimTitle")}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-emerald-700/60">
            {personName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            {locale === "bn"
              ? "এটি একটি আনুষ্ঠানিক দাবি প্রক্রিয়া। আপনার দাবি ট্রির মালিক বা এই প্রোফাইল তৈরিকারক পর্যালোচনা করবেন।"
              : "This is a formal claim process. Your claim will be reviewed by the tree owner or profile contributor."}
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label>{t(locale, "claim.relationship")}</Label>
            <Input
              placeholder={t(locale, "claim.relationshipPlaceholder")}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            />
          </div>

          {/* Evidence */}
          <div className="space-y-2">
            <Label className="text-red-700">{t(locale, "claim.evidence")} *</Label>
            <Textarea
              placeholder={t(locale, "claim.evidencePlaceholder")}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Witnesses */}
          <div className="space-y-2">
            <Label>{t(locale, "claim.witnesses")}</Label>
            <p className="text-xs text-emerald-600/50">
              {locale === "bn"
                ? "ট্রির অন্য সদস্যদের ইমেইল দিন যারা আপনার দাবি সমর্থন করতে পারবেন"
                : "Enter emails of tree members who can support your claim"}
            </p>
            {witnessEmails.map((email, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="member@email.com"
                  value={email}
                  onChange={(e) => updateWitnessEmail(idx, e.target.value)}
                  className="flex-1"
                />
                {witnessEmails.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWitnessField(idx)}
                    className="text-red-500 hover:text-red-700 shrink-0"
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            {witnessEmails.length < 5 && (
              <button
                type="button"
                onClick={addWitnessField}
                className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {t(locale, "claim.addWitness")}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 border-emerald-200 text-emerald-700"
          >
            {t(locale, "common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !evidence.trim()}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {t(locale, "claim.submitClaim")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}