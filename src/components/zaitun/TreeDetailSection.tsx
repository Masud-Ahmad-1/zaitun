"use client";

import { useZaitunStore } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Plus, ArrowLeft, TreePine, Languages, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TreeCanvas } from "./TreeCanvas";
import { PersonFormDialog } from "./PersonFormDialog";
import { UserMenu } from "./AuthDialog";
import { useEffect } from "react";

export function TreeDetailSection() {
  const { trees, activeTreeId, setView, setActiveTreeId, persons, setTreeData, locale, setLocale, setEditingPerson } = useZaitunStore();
  const tree = trees.find((t) => t.id === activeTreeId);

  const fetchData = async () => {
    if (!activeTreeId) return;
    const res = await fetch(`/api/persons?treeId=${activeTreeId}`);
    if (res.ok) {
      const data = await res.json();
      setTreeData(data.persons, data.relationships);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTreeId]);

  if (!tree) return null;

  const goBack = () => {
    setActiveTreeId(null);
    setView("trees");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 md:px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> {t(locale, "common.back")}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
              <TreePine className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-emerald-950">{tree.name}</span>
              <span className="text-xs text-emerald-600/50 ml-2 hidden sm:inline">{tree.inviteCode}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
          <Button variant="ghost" size="sm" onClick={() => setLocale(locale === "en" ? "bn" : "en")} className="gap-1 text-sm">
            {locale === "en" ? "বাংলা" : "English"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView("diary")}
            className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">{t(locale, "diary.diary")}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setEditingPerson({ id: "__new__", treeId: activeTreeId, firstName: "", lastName: null, gender: null, birthDate: null, deathDate: null, photo: null, bio: null, occupation: null, isDeceased: false, sortOrder: 0, createdAt: "", updatedAt: "" } as any)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t(locale, "person.addMember")}</span>
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 space-y-6">
        {/* Stats bar */}
        <div className="flex items-center gap-4 text-sm text-emerald-700/60">
          <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-emerald-100">
            <Users className="w-3.5 h-3.5" /> {persons.length} {t(locale, "tree.persons").toLowerCase()}
          </span>
        </div>

        {persons.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <TreePine className="w-12 h-12 text-emerald-300" />
            </div>
            <p className="text-emerald-700/60 mb-6">{t(locale, "person.noPersons")}</p>
            <Button
              onClick={() => setEditingPerson({ id: "__new__", treeId: activeTreeId, firstName: "", lastName: null, gender: null, birthDate: null, deathDate: null, photo: null, bio: null, occupation: null, isDeceased: false, sortOrder: 0, createdAt: "", updatedAt: "" } as any)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
            >
              <Plus className="w-4 h-4" /> {t(locale, "person.addMember")}
            </Button>
          </motion.div>
        ) : (
          <>
            <Card className="border-emerald-100 overflow-hidden">
              <CardContent className="p-2 md:p-4">
                <TreeCanvas />
              </CardContent>
            </Card>

            {/* Person list below tree */}
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {persons.map((p) => (
                <Card
                  key={p.id}
                  className="border-emerald-50 hover:border-emerald-200 cursor-pointer transition-colors p-3"
                  onClick={() => setEditingPerson(p)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      p.gender === "female" ? "bg-rose-100 text-rose-700" : p.gender === "male" ? "bg-sky-100 text-sky-700" : "bg-violet-100 text-violet-700"
                    }`}>
                      {p.firstName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-emerald-950 text-sm truncate">
                        {p.firstName} {p.lastName || ""} {p.isDeceased ? "✝" : ""}
                      </p>
                      {p.occupation && <p className="text-xs text-emerald-600/50 truncate">{p.occupation}</p>}
                      {p.birthDate && <p className="text-xs text-emerald-600/40">{p.birthDate}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <PersonFormDialog />
    </div>
  );
}