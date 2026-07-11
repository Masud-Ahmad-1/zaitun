"use client";

import { useZaitunStore, type PublicDiaryEntry } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { motion } from "framer-motion";
import {
  ArrowLeft, TreePine, Languages, Calendar, User, Globe,
  Users, Lock, Tag, BookOpen, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./AuthDialog";
import { useState } from "react";

function formatDate(dateStr: string, locale: "en" | "bn"): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toBanglaNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
}

export function DiaryReadingView() {
  const {
    locale, setLocale,
    readingDiary, readingDiaryFrom, setView,
    setReadingDiary,
  } = useZaitunStore();

  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");

  // Go back — defined BEFORE any usage
  const goBack = () => {
    const from = useZaitunStore.getState().readingDiaryFrom;
    setReadingDiary(null, null);
    if (from === "diary-section") {
      setView("diary");
    } else {
      setView("hero");
    }
  };

  // Safety: if no entry, go back immediately
  if (!readingDiary) {
    goBack();
    return null;
  }

  const entry = readingDiary;

  const displayName = entry.person
    ? `${entry.person.firstName} ${entry.person.lastName || ""}`.trim()
    : (locale === "bn" ? "অজানা" : "Unknown");

  const wordCount = entry.content?.trim()
    ? entry.content.trim().split(/\s+/).length
    : 0;

  const tags = entry.tags
    ? entry.tags.split(",").map((tg) => tg.trim()).filter(Boolean)
    : [];

  const privacyIcon = entry.privacy === "public"
    ? <Globe className="w-3.5 h-3.5" />
    : entry.privacy === "family"
    ? <Users className="w-3.5 h-3.5" />
    : <Lock className="w-3.5 h-3.5" />;

  const privacyLabel = entry.privacy === "public"
    ? t(locale, "common.public")
    : entry.privacy === "family"
    ? t(locale, "diary.family")
    : t(locale, "diary.private");

  const privacyColor = entry.privacy === "public"
    ? "bg-sky-50 text-sky-700 border-sky-200"
    : entry.privacy === "family"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

  const genderColor = entry.person?.gender === "female"
    ? "bg-rose-100 text-rose-700"
    : entry.person?.gender === "male"
    ? "bg-sky-100 text-sky-700"
    : "bg-violet-100 text-violet-700";

  const fontSizeClass = fontSize === "xlarge"
    ? "text-xl leading-[2]"
    : fontSize === "large"
    ? "text-lg leading-[1.9]"
    : "text-base leading-[1.85]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex flex-col"
    >
      {/* Top Nav Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-emerald-100">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t(locale, "common.back")}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {/* Font size controls */}
            <div className="flex items-center gap-1 bg-emerald-50 rounded-lg p-0.5">
              {(["normal", "large", "xlarge"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    fontSize === size
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
                </button>
              ))}
            </div>
            <UserMenu />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale(locale === "en" ? "bn" : "en")}
              className="gap-1 text-sm"
            >
              <Languages className="w-4 h-4" />
              {locale === "en" ? "বাংলা" : "English"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 md:px-6 py-8 w-full">
        {/* Tree Name Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-emerald-600/60 mb-6">
          <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center">
            <TreePine className="w-3.5 h-3.5 text-white" />
          </div>
          <span>{entry.tree?.name || ""}</span>
        </div>

        {/* Author Card */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-14 h-14 rounded-full ${genderColor} flex items-center justify-center font-bold text-xl shadow-md`}>
            {displayName[0] || "?"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
            {entry.person?.occupation && (
              <p className="text-sm text-gray-500">{entry.person.occupation}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(entry.date, locale)}
              </span>
              <Badge variant="outline" className={`text-xs gap-1 ${privacyColor}`}>
                {privacyIcon}
                {privacyLabel}
              </Badge>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-950 leading-tight mb-8">
          {entry.title}
        </h1>

        {/* Body Content */}
        <article className={`text-gray-800 whitespace-pre-wrap ${fontSizeClass} selection:bg-emerald-200`}>
          {entry.content}
        </article>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2 mt-10 pt-6 border-t border-emerald-100 flex-wrap">
            <Tag className="w-4 h-4 text-emerald-400" />
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Meta Footer */}
        <div className="mt-10 pt-6 border-t border-emerald-100">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {locale === "bn" ? toBanglaNum(wordCount) : wordCount} {t(locale, "diary.wordCount")}
              </span>
              {entry.person?.bio && (
                <span className="flex items-center gap-1 max-w-xs truncate">
                  <User className="w-3.5 h-3.5" />
                  {entry.person.bio.length > 60 ? entry.person.bio.slice(0, 60) + "..." : entry.person.bio}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(entry.createdAt?.split("T")[0] || entry.date, locale)}
            </span>
          </div>
        </div>

        {/* Person Bio Card (if available) */}
        {entry.person?.bio && entry.person.bio.length > 10 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100"
          >
            <h3 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              {locale === "bn" ? `লেখক পরিচিতি — ${displayName}` : `About the Author — ${displayName}`}
            </h3>
            <p className="text-sm text-emerald-700/70 leading-relaxed">{entry.person.bio}</p>
          </motion.div>
        )}
      </main>

      {/* Bottom Bar */}
      <footer className="border-t border-emerald-100 bg-white/60 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t(locale, "reading.backToList")}
          </button>
          <span className="text-xs text-emerald-400">
            {t(locale, "common.appName")} — {t(locale, "common.tagline")}
          </span>
        </div>
      </footer>
    </motion.div>
  );
}