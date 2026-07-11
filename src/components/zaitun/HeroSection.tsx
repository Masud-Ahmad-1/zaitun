"use client";

import { useZaitunStore } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { TreePine, Languages, Plus, Users, LogIn, Leaf, ChevronRight, Globe, Users as UsersIcon, BookOpen, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./AuthDialog";
import { useState, useEffect, useCallback, useRef } from "react";

type PublicDiary = {
  id: string;
  treeId: string;
  personId: string;
  date: string;
  title: string;
  content: string;
  privacy: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
  person: { firstName: string; lastName: string | null; gender: string | null };
  tree: { name: string };
};

type FilterType = "all" | "public" | "family";

function formatDate(dateStr: string, locale: "en" | "bn"): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RecentDiariesSection() {
  const { locale, user, setAuthMode, setShowAuthDialog } = useZaitunStore();
  const [diaries, setDiaries] = useState<PublicDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const offsetRef = useRef(0);
  const PAGE_SIZE = 6;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchDiaries = useCallback(async (filter: FilterType, offset: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await fetch(`/api/diaries/public?filter=${filter}&limit=${PAGE_SIZE}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        const entries: PublicDiary[] = data.entries || data;
        setDiaries((prev) => (append ? [...prev, ...entries] : entries));
        setHasMore(data.hasMore ?? entries.length === PAGE_SIZE);
        offsetRef.current = offset + entries.length;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Reset on filter change
  useEffect(() => {
    offsetRef.current = 0;
    setDiaries([]);
    setHasMore(true);
    fetchDiaries(activeFilter, 0, false);
  }, [activeFilter, fetchDiaries]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!hasMore || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchDiaries(activeFilter, offsetRef.current, true);
        }
      },
      { rootMargin: "300px" }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, activeFilter, fetchDiaries]);

  const handleCardClick = () => {
    if (!user) {
      setAuthMode("login");
      setShowAuthDialog(true);
    }
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: t(locale, "home.all") },
    { key: "public", label: t(locale, "home.public") },
    { key: "family", label: t(locale, "home.family") },
  ];

  return (
    <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-950 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            {t(locale, "home.recentDiaries")}
          </h2>
        </div>

        {/* Filter tabs */}
        <div className="flex rounded-lg border border-emerald-200 overflow-hidden w-fit mb-6">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={activeFilter === f.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(f.key)}
              className={`rounded-none border-0 text-sm ${
                activeFilter === f.key
                  ? "bg-emerald-700 text-white"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : diaries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-emerald-300" />
            </div>
            <p className="text-emerald-700/60">{t(locale, "home.noPublicDiaries")}</p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {diaries.map((diary, index) => {
                const tags = diary.tags
                  ? diary.tags.split(",").map((tg) => tg.trim()).filter(Boolean)
                  : [];
                const displayName = diary.person
                  ? `${diary.person.firstName} ${diary.person.lastName || ""}`
                  : "";
                const genderColor =
                  diary.person?.gender === "female"
                    ? "bg-rose-100 text-rose-700"
                    : diary.person?.gender === "male"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-violet-100 text-violet-700";

                return (
                  <motion.div
                    key={diary.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(index % PAGE_SIZE, 5) * 0.06 }}
                    onClick={handleCardClick}
                    className="cursor-pointer"
                  >
                    <Card className="border-emerald-50 hover:border-emerald-200 hover:shadow-md transition-all duration-300 h-full">
                      <CardContent className="p-4 flex flex-col gap-3">
                        {/* Person + Tree info */}
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${genderColor}`}
                          >
                            {displayName[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-emerald-950 text-sm truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-emerald-600/50 truncate">
                              {t(locale, "home.treeBy")} {diary.tree?.name}
                            </p>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-emerald-950 text-base leading-snug line-clamp-2">
                          {diary.title}
                        </h3>

                        {/* Date + Privacy */}
                        <div className="flex items-center gap-2 text-xs text-emerald-600/60">
                          <span>{formatDate(diary.date, locale)}</span>
                          {diary.privacy === "public" ? (
                            <Globe className="w-3.5 h-3.5 text-sky-500" />
                          ) : (
                            <UsersIcon className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>

                        {/* Content preview */}
                        <p className="text-sm text-emerald-800/70 leading-relaxed line-clamp-3">
                          {diary.content.length > 100
                            ? diary.content.slice(0, 100) + "..."
                            : diary.content}
                        </p>

                        {/* Tags */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs bg-emerald-50 text-emerald-700 border-emerald-100 gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Login prompt for non-authenticated users */}
                        {!user && (
                          <p className="text-xs text-emerald-600/40 mt-auto pt-2 border-t border-emerald-50">
                            {t(locale, "home.loginToRead")}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="py-8">
              {loadingMore && (
                <div className="flex items-center justify-center gap-2 text-emerald-600/60">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{t(locale, "common.loading")}</span>
                </div>
              )}
              {!hasMore && diaries.length > 0 && (
                <p className="text-center text-sm text-emerald-600/40">
                  — {t(locale, "common.noData")} —
                </p>
              )}
            </div>
          </>
        )}
      </motion.div>
    </section>
  );
}

export function HeroSection() {
  const { user, setView, locale, setLocale, setAuthMode, setShowAuthDialog } = useZaitunStore();
  const [code, setCode] = useState("");

  const handleJoin = () => {
    if (code.trim().length >= 4) {
      sessionStorage.setItem("zaitun_join_code", code.trim());
      setView("join");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-amber-50" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-emerald-100/40 blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-100/40 blur-3xl translate-y-1/3 -translate-x-1/4" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center">
            <TreePine className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-emerald-900 tracking-tight">{t(locale, "common.appName")}</span>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocale(locale === "en" ? "bn" : "en")}
            className="gap-1.5 text-sm"
          >
            <Languages className="w-4 h-4" />
            {locale === "en" ? "বাংলা" : "English"}
          </Button>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl text-center space-y-8"
        >
          {/* Leaf decorations */}
          <div className="flex justify-center gap-2 text-emerald-300">
            <Leaf className="w-6 h-6" />
            <Leaf className="w-8 h-8" />
            <Leaf className="w-6 h-6" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-emerald-950 leading-tight tracking-tight">
            {t(locale, "hero.title")}
          </h1>

          <p className="text-lg md:text-xl text-emerald-800/70 max-w-lg mx-auto leading-relaxed">
            {t(locale, "hero.subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => {
                if (!user) { setAuthMode("signup"); setShowAuthDialog(true); return; }
                setView("trees");
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-6 text-base gap-2 rounded-xl shadow-lg shadow-emerald-200"
            >
              <Plus className="w-5 h-5" />
              {t(locale, "hero.cta")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                if (!user) { setAuthMode("login"); setShowAuthDialog(true); return; }
                setView("join");
              }}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-base gap-2 rounded-xl"
            >
              <LogIn className="w-5 h-5" />
              {t(locale, "hero.orJoin")}
            </Button>
          </div>

          {/* Join code input */}
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <Input
                placeholder={t(locale, "join.codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                className="rounded-xl border-emerald-200 bg-white/80 backdrop-blur"
              />
              <Button
                variant="outline"
                onClick={handleJoin}
                className="rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 shrink-0"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-2 text-sm text-emerald-600/60 pt-4">
            <Users className="w-4 h-4" />
            <span>127+ {t(locale, "hero.memberCount")}</span>
          </div>
        </motion.div>
      </main>

      {/* Recent Diaries Section with Infinite Scroll */}
      <RecentDiariesSection />

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-sm text-emerald-600/50">
        {t(locale, "common.appName")} — {t(locale, "common.tagline")}
      </footer>
    </div>
  );
}