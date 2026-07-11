"use client";

import { useZaitunStore, type PublicDiaryEntry } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TreePine, Calendar, User, Globe,
  Users, Lock, Tag, BookOpen, Clock, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function DiaryReadingDialog() {
  const {
    locale,
    showReadingDialog,
    readingDiary,
    closeReadingDialog,
  } = useZaitunStore();

  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");

  if (!readingDiary) return null;

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

  const isPublic = entry.privacy === "public";
  const isFamily = entry.privacy === "family";

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
    <Dialog open={showReadingDialog} onOpenChange={(open) => { if (!open) closeReadingDialog(); }}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] overflow-y-auto p-0 gap-0 bg-gradient-to-br from-emerald-50/50 via-white to-amber-50/30">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center shrink-0">
              <TreePine className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm text-emerald-600/70 truncate">{entry.tree?.name || ""}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-0.5 bg-emerald-50 rounded-lg p-0.5">
              {(["normal", "large", "xlarge"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
                    fontSize === size
                      ? "bg-emerald-700 text-white"
                      : "text-emerald-600 hover:bg-emerald-100"
                  }`}
                >
                  {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Author */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-11 h-11 rounded-full ${genderColor} flex items-center justify-center font-bold text-lg shrink-0`}>
              {displayName[0] || "?"}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-base">{displayName}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(entry.date, locale)}
                </span>
                <Badge variant="outline" className={`text-[10px] gap-0.5 px-1.5 py-0 ${
                  isPublic ? "bg-sky-50 text-sky-600 border-sky-200"
                  : isFamily ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
                }`}>
                  {isPublic ? <Globe className="w-2.5 h-2.5" /> : isFamily ? <Users className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                  {isPublic ? t(locale, "common.public") : isFamily ? t(locale, "diary.family") : t(locale, "diary.private")}
                </Badge>
              </div>
            </div>
          </div>

          {/* Title */}
          <DialogHeader className="text-left px-0 mb-0">
            <DialogTitle className="text-xl md:text-2xl font-extrabold text-emerald-950 leading-tight">
              {entry.title}
            </DialogTitle>
          </DialogHeader>

          {/* Content */}
          <article className={`text-gray-800 whitespace-pre-wrap mt-5 ${fontSizeClass} selection:bg-emerald-200`}>
            {entry.content}
          </article>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 mt-8 pt-5 border-t border-emerald-100 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between mt-5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {locale === "bn" ? toBanglaNum(wordCount) : wordCount} {t(locale, "diary.wordCount")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(entry.createdAt?.split("T")[0] || entry.date, locale)}
            </span>
          </div>

          {/* Author bio card */}
          {entry.person?.bio && entry.person.bio.length > 10 && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <h3 className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {locale === "bn" ? `লেখক পরিচিতি — ${displayName}` : `About — ${displayName}`}
              </h3>
              <p className="text-xs text-emerald-600/70 leading-relaxed">{entry.person.bio}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}