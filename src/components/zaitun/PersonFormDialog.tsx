"use client";

import { useZaitunStore, type Person, type RelType } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const REL_OPTIONS: { value: RelType; labelEn: string; labelBn: string }[] = [
  { value: "father", labelEn: "Father", labelBn: "পিতা" },
  { value: "mother", labelEn: "Mother", labelBn: "মাতা" },
  { value: "spouse", labelEn: "Spouse", labelBn: "স্বামী/স্ত্রী" },
  { value: "son", labelEn: "Son", labelBn: "পুত্র" },
  { value: "daughter", labelEn: "Daughter", labelBn: "কন্যা" },
  { value: "child", labelEn: "Child", labelBn: "সন্তান" },
  { value: "brother", labelEn: "Brother", labelBn: "ভাই" },
  { value: "sister", labelEn: "Sister", labelBn: "বোন" },
  { value: "sibling", labelEn: "Sibling", labelBn: "ভাইবোন" },
  { value: "grandfather", labelEn: "Grandfather", labelBn: "দাদা" },
  { value: "grandmother", labelEn: "Grandmother", labelBn: "দাদী" },
  { value: "uncle", labelEn: "Uncle", labelBn: "চাচা/মামা" },
  { value: "aunt", labelEn: "Aunt", labelBn: "চাচী/মামী" },
  { value: "cousin", labelEn: "Cousin", labelBn: "চাচাতো/মামাতো ভাইবোন" },
  { value: "other", labelEn: "Other", labelBn: "অন্যান্য" },
];

export function PersonFormDialog() {
  const { editingPerson, setEditingPerson, activeTreeId, locale, addPersonLocally, updatePersonLocally, removePersonLocally, persons } = useZaitunStore();

  const isEditing = editingPerson !== null && editingPerson.id !== "__new__";

  const initForm = editingPerson ? {
    firstName: editingPerson.firstName,
    lastName: editingPerson.lastName || "",
    gender: editingPerson.gender || "male",
    birthDate: editingPerson.birthDate || "",
    deathDate: editingPerson.deathDate || "",
    bio: editingPerson.bio || "",
    occupation: editingPerson.occupation || "",
    isDeceased: editingPerson.isDeceased,
    photo: editingPerson.photo || "",
  } : {
    firstName: "", lastName: "", gender: "male" as string, birthDate: "", deathDate: "",
    bio: "", occupation: "", isDeceased: false, photo: "",
  };

  const [form, setForm] = useState(initForm);
  const [relType, setRelType] = useState<RelType | "">("");
  const [relToPersonId, setRelToPersonId] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSave = async () => {
    if (!form.firstName.trim() || !activeTreeId) return;
    setLoading(true);

    if (isEditing && editingPerson) {
      const res = await fetch("/api/persons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPerson.id, ...form }),
      });
      if (res.ok) {
        const updated = await res.json();
        updatePersonLocally(updated);
        toast.success(t(locale, "person.saveSuccess"));
        setEditingPerson(null);
      }
    } else {
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treeId: activeTreeId, ...form,
          relType: relType || undefined,
          relToPersonId: relToPersonId || undefined,
        }),
      });
      if (res.ok) {
        const person = await res.json();
        addPersonLocally(person);
        toast.success(t(locale, "person.saveSuccess"));
        setEditingPerson(null);
      }
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!editingPerson || !confirm(t(locale, "person.deleteConfirm"))) return;
    setDeleteLoading(true);
    await fetch(`/api/persons?id=${editingPerson.id}`, { method: "DELETE" });
    removePersonLocally(editingPerson.id);
    toast.success(t(locale, "person.deleteSuccess"));
    setEditingPerson(null);
    setDeleteLoading(false);
  };

  const otherPersons = persons.filter((p) => p.id !== editingPerson?.id);

  return (
    <Dialog open={editingPerson !== null} onOpenChange={(o) => !o && setEditingPerson(null)}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" key={editingPerson?.id ?? "closed"}>
        <DialogHeader>
          <DialogTitle className="text-emerald-950">
            {isEditing ? t(locale, "person.editMember") : t(locale, "person.addMember")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t(locale, "person.firstName")} *</Label>
              <Input placeholder={t(locale, "person.firstNamePlaceholder")} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t(locale, "person.lastName")}</Label>
              <Input placeholder={t(locale, "person.lastNamePlaceholder")} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t(locale, "person.gender")}</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t(locale, "person.male")}</SelectItem>
                  <SelectItem value="female">{t(locale, "person.female")}</SelectItem>
                  <SelectItem value="other">{t(locale, "person.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t(locale, "person.occupation")}</Label>
              <Input placeholder={t(locale, "person.occupationPlaceholder")} value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t(locale, "person.birthDate")}</Label>
              <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t(locale, "person.deathDate")}</Label>
              <Input type="date" value={form.deathDate} onChange={(e) => setForm({ ...form, deathDate: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>{t(locale, "person.deceased")}</Label>
            <Switch checked={form.isDeceased} onCheckedChange={(v) => setForm({ ...form, isDeceased: v })} />
          </div>

          <div className="space-y-2">
            <Label>{t(locale, "person.bio")}</Label>
            <Textarea placeholder={t(locale, "person.bioPlaceholder")} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
          </div>

          {!isEditing && otherPersons.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <Label>{t(locale, "person.relationship")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <Select value={relType} onValueChange={(v) => setRelType(v as RelType)}>
                  <SelectTrigger><SelectValue placeholder={t(locale, "person.relationship")} /></SelectTrigger>
                  <SelectContent>
                    {REL_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {locale === "bn" ? r.labelBn : r.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {relType && (
                  <Select value={relToPersonId} onValueChange={setRelToPersonId}>
                    <SelectTrigger><SelectValue placeholder={t(locale, "person.relationshipTo")} /></SelectTrigger>
                    <SelectContent>
                      {otherPersons.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          {isEditing && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteLoading} className="mr-auto">
              {t(locale, "common.delete")}
            </Button>
          )}
          <Button variant="outline" onClick={() => setEditingPerson(null)}>{t(locale, "common.cancel")}</Button>
          <Button onClick={handleSave} disabled={loading || !form.firstName.trim()} className="bg-emerald-700 hover:bg-emerald-800 text-white">
            {loading ? t(locale, "common.loading") : t(locale, "common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}