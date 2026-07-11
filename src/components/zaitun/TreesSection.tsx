"use client";

import { useZaitunStore, type FamilyTreeData } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Plus, TreePine, Lock, Globe, Trash2, Eye, Users, Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserMenu } from "./AuthDialog";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";

export function TreesSection() {
  const { trees, setTrees, setView, setActiveTreeId, locale, user, setLocale } = useZaitunStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTrees = useCallback(async () => {
    const res = await fetch("/api/trees");
    if (res.ok) setTrees(await res.json());
  }, [setTrees]);

  useEffect(() => { fetchTrees(); }, [fetchTrees]);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    const res = await fetch("/api/trees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc, isPrivate }),
    });
    if (res.ok) {
      toast.success(t(locale, "tree.createSuccess"));
      setShowCreate(false);
      setName("");
      setDesc("");
      fetchTrees();
    }
    setLoading(false);
  };

  const handleDelete = async (tree: FamilyTreeData) => {
    if (!confirm(t(locale, "tree.deleteConfirm"))) return;
    await fetch(`/api/trees?id=${tree.id}`, { method: "DELETE" });
    toast.success(t(locale, "tree.deleteSuccess"));
    fetchTrees();
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openTree = (tree: FamilyTreeData) => {
    setActiveTreeId(tree.id);
    setView("tree-detail");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
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

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-950">{t(locale, "tree.myTrees")}</h1>
            <p className="text-sm text-emerald-700/60 mt-1">{trees.length} {locale === "en" ? "trees" : "বৃক্ষ"}</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> {t(locale, "tree.createTree")}
          </Button>
        </div>

        {trees.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <TreePine className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="text-emerald-700/60">{t(locale, "tree.noTrees")}</p>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {trees.map((tree, i) => (
              <motion.div
                key={tree.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-emerald-950 text-lg flex items-center gap-2">
                        <TreePine className="w-5 h-5 text-emerald-600" />
                        {tree.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {tree.isPrivate ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tree.description && <p className="text-sm text-emerald-700/60 line-clamp-2">{tree.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-emerald-600/60">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {tree.persons?.length || 0}</span>
                      <span className="flex items-center gap-1">{tree.isPrivate ? t(locale, "common.private") : t(locale, "common.public")}</span>
                    </div>
                    {/* Invite code */}
                    <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                      <span className="text-xs text-emerald-600/60 font-mono flex-1">{tree.inviteCode}</span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyCode(tree.id, tree.inviteCode)}>
                        {copiedId === tree.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <p className="text-xs text-emerald-500/60">{t(locale, "tree.shareInvite")}</p>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => openTree(tree)} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 rounded-lg">
                        <Eye className="w-3.5 h-3.5" /> {t(locale, "tree.viewTree")}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(tree)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-950">{t(locale, "tree.createTree")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t(locale, "tree.treeName")}</Label>
              <Input placeholder={t(locale, "tree.treeNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t(locale, "tree.description")}</Label>
              <Textarea placeholder={t(locale, "tree.descriptionPlaceholder")} value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t(locale, "tree.privacy")}</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{isPrivate ? t(locale, "common.private") : t(locale, "common.public")}</span>
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t(locale, "common.cancel")}</Button>
            <Button onClick={handleCreate} disabled={loading || !name.trim()} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              {loading ? t(locale, "common.loading") : t(locale, "common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}