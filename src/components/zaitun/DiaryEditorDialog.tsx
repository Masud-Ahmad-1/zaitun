"use client";

import { useZaitunStore, type DiaryEntry } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";

const PRIVACY_OPTIONS = [
  { value: "private", en: "Private", bn: "ব্যক্তিগত" },
  { value: "family", en: "Family", bn: "পরিবার" },
  { value: "public", en: "Public", bn: "প্রকাশ্য" },
];

function EditorForm({
  entry,
  onSave,
  onCancel,
  locale,
  persons,
}: {
  entry: DiaryEntry | null;
  onSave: (data: { personId: string; date: string; title: string; content: string; privacy: string; tags: string }) => Promise<void>;
  onCancel: () => void;
  locale: "en" | "bn";
  persons: { id: string; firstName: string; lastName: string | null }[];
}) {
  const isNew = entry === null || entry.id === "__new__";
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    personId: entry?.personId || "",
    date: entry?.date || today,
    title: entry?.title || "",
    content: entry?.content || "",
    privacy: (entry?.privacy || "family") as string,
    tags: entry?.tags || "",
  });
  const [loading, setLoading] = useState(false);

  const wordCount = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;

  const handleSave = async () => {
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="text-emerald-950">
          {isNew ? t(locale, "diary.newEntry") : t(locale, "diary.editEntry")}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>{t(locale, "diary.selectPerson")}</Label>
          <Select value={form.personId} onValueChange={(v) => setForm({ ...form, personId: v })}>
            <SelectTrigger>
              <SelectValue placeholder={t(locale, "diary.selectPerson")} />
            </SelectTrigger>
            <SelectContent>
              {persons.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.firstName} {p.lastName || ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t(locale, "diary.entryDate")}</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>{t(locale, "diary.entryTitle")}</Label>
          <Input placeholder={t(locale, "diary.entryTitlePlaceholder")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t(locale, "diary.entryContent")}</Label>
            <span className="text-xs text-muted-foreground">{wordCount} {t(locale, "diary.wordCount")}</span>
          </div>
          <Textarea placeholder={t(locale, "diary.entryContentPlaceholder")} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} className="resize-y min-h-[200px]" />
        </div>

        <div className="space-y-2">
          <Label>{t(locale, "diary.privacy")}</Label>
          <Select value={form.privacy} onValueChange={(v) => setForm({ ...form, privacy: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIVACY_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {locale === "bn" ? p.bn : p.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t(locale, "diary.tags")}</Label>
          <Input placeholder={t(locale, "diary.tagsPlaceholder")} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel}>{t(locale, "common.cancel")}</Button>
        <Button onClick={handleSave} disabled={loading || !form.personId || !form.title.trim() || !form.date} className="bg-emerald-700 hover:bg-emerald-800 text-white">
          {loading ? t(locale, "common.loading") : t(locale, "common.save")}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function DiaryEditorDialog() {
  const {
    editingDiaryEntry, setEditingDiaryEntry, activeTreeId,
    locale, persons, addDiaryEntryLocally, updateDiaryEntryLocally,
  } = useZaitunStore();

  const isOpen = editingDiaryEntry !== null;

  const handleSave = async (data: { personId: string; date: string; title: string; content: string; privacy: string; tags: string }) => {
    if (!activeTreeId) return;

    const isNew = editingDiaryEntry === null || editingDiaryEntry!.id === "__new__";

    if (isNew) {
      const res = await fetch("/api/diaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treeId: activeTreeId, ...data }),
      });
      if (res.ok) {
        const entry: DiaryEntry = await res.json();
        addDiaryEntryLocally(entry);
        toast.success(t(locale, "diary.saveSuccess"));
        setEditingDiaryEntry(null);
      }
    } else {
      const res = await fetch("/api/diaries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingDiaryEntry!.id, ...data }),
      });
      if (res.ok) {
        const entry: DiaryEntry = await res.json();
        updateDiaryEntryLocally(entry);
        toast.success(t(locale, "diary.saveSuccess"));
        setEditingDiaryEntry(null);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && setEditingDiaryEntry(null)}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        {editingDiaryEntry && (
          <EditorForm
            key={editingDiaryEntry.id}
            entry={editingDiaryEntry.id === "__new__" ? null : editingDiaryEntry}
            onSave={handleSave}
            onCancel={() => setEditingDiaryEntry(null)}
            locale={locale}
            persons={persons}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}