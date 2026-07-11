"use client";

import { useZaitunStore } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { useState } from "react";
import { ArrowLeft, TreePine, Languages, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserMenu } from "./AuthDialog";
import { toast } from "sonner";

export function JoinSection() {
  const { locale, setLocale, setView, trees, setTrees, setActiveTreeId, user, setAuthMode, setShowAuthDialog } = useZaitunStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) return;
    if (!user) {
      setAuthMode("login");
      setShowAuthDialog(true);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/trees/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code.trim(), userId: user.id }),
    });
    if (res.ok) {
      const tree = await res.json();
      toast.success(t(locale, "join.joinSuccess"));
      // Refresh trees and go to detail
      const treesRes = await fetch("/api/trees");
      if (treesRes.ok) {
        const allTrees = await treesRes.json();
        setTrees(allTrees);
      }
      setActiveTreeId(tree.id);
      setView("tree-detail");
    } else {
      toast.error(t(locale, "join.invalidCode"));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("hero")} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> {t(locale, "common.back")}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
              <TreePine className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-emerald-900">{t(locale, "common.appName")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
          <Button variant="ghost" size="sm" onClick={() => setLocale(locale === "en" ? "bn" : "en")} className="gap-1.5 text-sm">
            {locale === "en" ? "বাংলা" : "English"}
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <Card className="w-full max-w-md border-emerald-100">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-7 h-7 text-emerald-600" />
            </div>
            <CardTitle className="text-emerald-950 text-xl">{t(locale, "join.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-emerald-700/60 text-center">{t(locale, "join.enterCode")}</p>
            <Input
              placeholder={t(locale, "join.codePlaceholder")}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="text-center text-lg font-mono tracking-widest border-emerald-200"
            />
            <Button
              onClick={handleJoin}
              disabled={loading || !code.trim()}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {loading ? t(locale, "common.loading") : t(locale, "common.join")}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}