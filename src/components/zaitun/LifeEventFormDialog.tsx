"use client";

import { t } from "@/lib/i18n";
import { useZaitunStore } from "@/store/zaitun";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export type LifeEventData = {
  id?: string;
  year: string;
  title: string;
  description: string;
  sortOrder?: number;
};

type LifeEventFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: LifeEventData | null;
  personId: string;
  treeId: string;
  onSave: (data: LifeEventData) => void;
};

export function LifeEventFormDialog({
  open,
  onOpenChange,
  event,
  personId,
  treeId,
  onSave,
}: LifeEventFormDialogProps) {
  const { locale } = useZaitunStore();
  const isEditing = event !== null && !!event.id;

  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setYear(event?.year || "");
      setTitle(event?.title || "");
      setDescription(event?.description || "");
      setSortOrder(event?.sortOrder ?? 0);
    }
  }, [open, event]);

  const handleSave = async () => {
    if (!year.trim() || !title.trim()) return;
    setLoading(true);

    const payload: Record<string, unknown> = {
      personId,
      year: year.trim(),
      title: title.trim(),
      description: description.trim() || null,
      sortOrder,
    };

    try {
      let res: Response;
      if (isEditing && event?.id) {
        res = await fetch("/api/persons/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: event.id, ...payload }),
        });
      } else {
        res = await fetch("/api/persons/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const data = await res.json();
        onSave({
          id: data.id,
          year: data.year,
          title: data.title,
          description: data.description || "",
          sortOrder: data.sortOrder,
        });
        onOpenChange(false);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-950">
            {isEditing
              ? t(locale, "timeline.editEvent")
              : t(locale, "timeline.addEvent")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t(locale, "timeline.year")} *</Label>
            <Input
              placeholder={t(locale, "timeline.yearPlaceholder")}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t(locale, "timeline.eventTitle")} *</Label>
            <Input
              placeholder={t(locale, "timeline.titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t(locale, "timeline.description")}</Label>
            <Textarea
              placeholder={t(locale, "timeline.descPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t(locale, "common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !year.trim() || !title.trim()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t(locale, "common.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}