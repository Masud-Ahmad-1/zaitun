"use client";

import { useZaitunStore, type DiaryEntry } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { motion } from "framer-motion";
import {
  ArrowLeft, TreePine, Languages, Plus, BookOpen, Calendar,
  User, Lock, Globe, Users, Eye, Trash2, Edit3, Tag, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserMenu } from "./AuthDialog";
import { toast } from "sonner";
import { useState, useMemo, useEffect, useCallback } from "react";

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_BN = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

function getMonthName(monthIndex: number, locale: "en" | "bn"): string {
  return locale === "bn" ? MONTHS_BN[monthIndex] : MONTHS_EN[monthIndex];
}

function formatDate(dateStr: string, locale: "en" | "bn"): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const PRIVACY_ICON: Record<string, React.ReactNode> = {
  private: <Lock className="w-3.5 h-3.5 text-amber-500" />,
  family: <Users className="w-3.5 h-3.5 text-emerald-500" />,
  public: <Globe className="w-3.5 h-3.5 text-sky-500" />,
};

function DiaryEntryCard({ entry, locale }: { entry: DiaryEntry; locale: "en" | "bn" }) {
  const { setEditingDiaryEntry, removeDiaryEntryLocally } = useZaitunStore();
  const [expanded, setExpanded] = useState(false);
  const wordCount = entry.content.trim() ? entry.content.trim().split(/\s+/).length : 0;
  const preview = entry.content.length > 200 ? entry.content.slice(0, 200) + "..." : entry.content;
  const tags = entry.tags ? entry.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const handleDelete = async () => {
    if (!confirm(t(locale, "diary.deleteConfirm"))) return;
    await fetch(`/api/diaries?id=${entry.id}`, { method: "DELETE" });
    removeDiaryEntryLocally(entry.id);
    toast.success(t(locale, "diary.deleteSuccess"));
  };

  const displayName = entry.person
    ? `${entry.person.firstName} ${entry.person.lastName || ""}`
    : (locale === "bn" ? "অজানা" : "Unknown");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="border-emerald-50 hover:border-emerald-200 transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  entry.person?.gender === "female"
                    ? "bg-rose-100 text-rose-700"
                    : entry.person?.gender === "male"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-violet-100 text-violet-700"
                }`}
              >
                {displayName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-emerald-950 text-base leading-snug line-clamp-2">
                  {entry.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 text-xs text-emerald-600/60 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(entry.date, locale)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {displayName}
                  </span>
                  <span className="flex items-center gap-1">
                    {PRIVACY_ICON[entry.privacy]}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setEditingDiaryEntry(entry)}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-sm text-emerald-800/80 leading-relaxed whitespace-pre-wrap">
            {expanded ? entry.content : preview}
          </p>
          {entry.content.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-emerald-600 hover:text-emerald-800 mt-2 flex items-center gap-1"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
              {expanded ? (locale === "bn" ? "সংক্ষিপ্ত করুন" : "Show less") : (locale === "bn" ? "আরও পড়ুন" : "Read more")}
            </button>
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-100 gap-1">
                <Tag className="w-3 h-3" /> {tag}
              </Badge>
            ))}
            <span className="text-xs text-emerald-500/50 ml-auto">
              {wordCount} {t(locale, "diary.wordCount")}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DiarySection() {
  const {
    trees, activeTreeId, setView, setActiveTreeId,
    locale, setLocale, diaryEntries, setDiaryEntries,
    persons, setEditingDiaryEntry,
    diaryFilterPersonId, setDiaryFilterPersonId,
  } = useZaitunStore();

  const tree = trees.find((tr) => tr.id === activeTreeId);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"timeline" | "calendar">("timeline");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const fetchDiaries = useCallback(async (personId?: string | null) => {
    if (!activeTreeId) return;
    setLoading(true);
    const params = new URLSearchParams({ treeId: activeTreeId });
    if (personId) params.set("personId", personId);
    try {
      const res = await fetch(`/api/diaries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDiaryEntries(data);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTreeId, setDiaryEntries]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await fetchDiaries(diaryFilterPersonId);
      if (cancelled) return;
    };
    load();
    return () => { cancelled = true; };
  }, [fetchDiaries, diaryFilterPersonId]);

  const filteredEntries = useMemo(() => {
    if (!diaryFilterPersonId) return diaryEntries;
    return diaryEntries.filter((e) => e.personId === diaryFilterPersonId);
  }, [diaryEntries, diaryFilterPersonId]);

  // Group entries by month for timeline
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, DiaryEntry[]> = {};
    for (const entry of filteredEntries) {
      const d = new Date(entry.date + "T00:00:00");
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredEntries]);

  // Calendar: days with entries
  const calEntriesMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of filteredEntries) {
      if (entry.date.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, "0")}`)) {
        map[entry.date] = (map[entry.date] || 0) + 1;
      }
    }
    return map;
  }, [filteredEntries, calYear, calMonth]);

  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calMonthEntries = filteredEntries.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return d.getFullYear() === calYear && d.getMonth() === calMonth;
  });

  const goBack = () => {
    setActiveTreeId(null);
    setView("trees");
  };

  const goToTree = () => {
    setView("tree-detail");
  };

  if (!tree) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 md:px-6 py-4 max-w-6xl mx-auto w-full">
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
              <span className="text-xs text-emerald-600/50 ml-2 hidden sm:inline">— {t(locale, "diary.diary")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
          <Button
            variant="outline"
            size="sm"
            onClick={goToTree}
            className="gap-1.5 text-sm hidden sm:flex"
          >
            <Eye className="w-3.5 h-3.5" />
            {t(locale, "tree.viewTree")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLocale(locale === "en" ? "bn" : "en")} className="gap-1 text-sm">
            {locale === "en" ? "বাংলা" : "English"}
          </Button>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-950 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-600" />
              {t(locale, "diary.diaries")}
            </h1>
            <p className="text-sm text-emerald-700/60 mt-1">
              {filteredEntries.length} {t(locale, "diary.entries")}
              {diaryFilterPersonId && (
                <> — {t(locale, "diary.diaryOf")}{" "}
                  <span className="font-medium text-emerald-800">
                    {persons.find((p) => p.id === diaryFilterPersonId)?.firstName}
                  </span>
                </>
              )}
            </p>
          </div>
          <Button
            onClick={() => setEditingDiaryEntry({ id: "__new__", treeId: activeTreeId!, personId: "", date: new Date().toISOString().split("T")[0], title: "", content: "", privacy: "family", tags: "", createdAt: "", updatedAt: "" } as unknown as DiaryEntry)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 rounded-xl"
            disabled={persons.length === 0}
          >
            <Plus className="w-4 h-4" /> {t(locale, "diary.writeDiary")}
          </Button>
        </div>

        {/* Filters */}
        {persons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={diaryFilterPersonId || "__all__"}
              onValueChange={(v) => setDiaryFilterPersonId(v === "__all__" ? null : v)}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t(locale, "diary.allEntries")}</SelectItem>
                {persons.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.firstName} {p.lastName || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-emerald-200 overflow-hidden">
              <Button
                variant={viewMode === "timeline" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("timeline")}
                className={`rounded-none border-0 text-sm ${viewMode === "timeline" ? "bg-emerald-700 text-white" : ""}`}
              >
                {t(locale, "diary.timeline")}
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className={`rounded-none border-0 text-sm ${viewMode === "calendar" ? "bg-emerald-700 text-white" : ""}`}
              >
                {t(locale, "diary.calendar")}
              </Button>
            </div>
          </div>
        )}

        {persons.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="text-emerald-700/60">
              {locale === "bn"
                ? "প্রথমে পরিবারের সদস্য যোগ করুন, তারপর দিনলিপি লেখা শুরু করুন।"
                : "Add family members first, then start writing diary entries."}
            </p>
            <Button variant="outline" onClick={goToTree} className="mt-4">
              {t(locale, "person.addMember")}
            </Button>
          </motion.div>
        ) : loading ? (
          <div className="text-center py-20 text-emerald-600/60">{t(locale, "common.loading")}</div>
        ) : viewMode === "timeline" ? (
          /* Timeline view */
          filteredEntries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-emerald-400" />
              </div>
              <p className="text-emerald-700/60">{t(locale, "diary.noEntries")}</p>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {groupedByMonth.map(([monthKey, entries]) => {
                const [yr, mo] = monthKey.split("-").map(Number);
                return (
                  <div key={monthKey}>
                    <h2 className="text-sm font-semibold text-emerald-600/80 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {getMonthName(mo - 1, locale)} {yr}
                      <span className="text-emerald-400 font-normal">({entries.length})</span>
                    </h2>
                    <div className="space-y-3">
                      {entries.map((entry) => (
                        <DiaryEntryCard key={entry.id} entry={entry} locale={locale} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Calendar view */
          <div className="space-y-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}>
                <ChevronDown className="w-4 h-4 rotate-90" />
              </Button>
              <h2 className="text-lg font-semibold text-emerald-950">
                {getMonthName(calMonth, locale)} {calYear}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </Button>
            </div>

            {/* Calendar grid */}
            <Card className="border-emerald-100">
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-1 text-center">
                  {[0,1,2,3,4,5,6].map((d) => (
                    <div key={d} className="text-xs font-medium text-emerald-600/50 py-2">
                      {locale === "bn" ? ["রবি","সোম","মঙ্গল","বুধ","বৃহ","শুক্র","শনি"][d] : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]}
                    </div>
                  ))}
                  {Array.from({ length: calFirstDay }, (_, i) => (
                    <div key={`empty-${i}`} className="h-12" />
                  ))}
                  {Array.from({ length: calDaysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const entryCount = calEntriesMap[dateStr] || 0;
                    return (
                      <button
                        key={day}
                        className="h-12 rounded-lg text-sm hover:bg-emerald-50 transition-colors relative flex flex-col items-center justify-center"
                      >
                        <span className="text-emerald-900">{locale === "bn" ? String(day).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]) : day}</span>
                        {entryCount > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {Array.from({ length: Math.min(entryCount, 3) }, (_, j) => (
                              <div key={j} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Entries for this month */}
            {calMonthEntries.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-emerald-700/70 mb-3">
                  {t(locale, "diary.entriesFor")} {getMonthName(calMonth, locale)} {calYear} ({calMonthEntries.length})
                </h3>
                <div className="space-y-3">
                  {calMonthEntries.map((entry) => (
                    <DiaryEntryCard key={entry.id} entry={entry} locale={locale} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-emerald-600/40 mt-auto">
        {t(locale, "common.appName")} — {t(locale, "diary.diary")}
      </footer>
    </div>
  );
}