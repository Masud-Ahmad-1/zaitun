"use client";

import { useZaitunStore } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { motion } from "framer-motion";
import {
  ArrowLeft, TreePine, Languages, Shield, Users, BookOpen, BarChart3,
  Trash2, Search, ChevronLeft, ChevronRight, Loader2, UserCog, TreePineIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./AuthDialog";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";

type Tab = "dashboard" | "users" | "trees" | "diaries";

export function AdminSection() {
  const { locale, setLocale, setView, user } = useZaitunStore();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <Card className="border-emerald-100 max-w-sm">
          <CardContent className="py-10 text-center">
            <Shield className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-emerald-700/60">{t(locale, "admin.forbidden")}</p>
            <Button variant="ghost" onClick={() => setView("hero")} className="mt-4">
              {t(locale, "common.back")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 md:px-6 py-4 max-w-7xl mx-auto border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("trees")} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> {t(locale, "common.back")}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">{t(locale, "admin.panel")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
          <Button variant="ghost" size="sm" onClick={() => setLocale(locale === "en" ? "bn" : "en")} className="gap-1.5 text-sm">
            {locale === "en" ? "বাংলা" : "English"}
          </Button>
        </div>
      </nav>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {([
            ["dashboard", BarChart3],
            ["users", Users],
            ["trees", TreePine],
            ["diaries", BookOpen],
          ] as [Tab, typeof BarChart3][]).map(([key, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                tab === key
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t(locale, `admin.${key}` as const)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "users" && <UsersTab />}
        {tab === "trees" && <TreesTab />}
        {tab === "diaries" && <DiariesTab />}
      </main>
    </div>
  );
}

/* ─── Dashboard ─── */
function DashboardTab() {
  const { locale } = useZaitunStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>;
  if (!stats) return null;

  const cards = [
    { label: t(locale, "admin.totalUsers"), value: stats.totalUsers, icon: Users, color: "bg-blue-50 text-blue-700" },
    { label: t(locale, "admin.totalTrees"), value: stats.totalTrees, icon: TreePine, color: "bg-emerald-50 text-emerald-700" },
    { label: t(locale, "admin.totalPersons"), value: stats.totalPersons, icon: UserCog, color: "bg-amber-50 text-amber-700" },
    { label: t(locale, "admin.totalDiaries"), value: stats.totalDiaries, icon: BookOpen, color: "bg-rose-50 text-rose-700" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{c.value}</p>
                  <p className="text-xs text-slate-500">{c.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900 text-base">{t(locale, "admin.recentSignups")}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentUsers.length === 0 ? (
            <p className="text-sm text-slate-400">{t(locale, "admin.noUsers")}</p>
          ) : (
            <div className="space-y-2">
              {stats.recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                    {u.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Users Tab ─── */
function UsersTab() {
  const { locale } = useZaitunStore();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "15" });
      if (q) params.set("search", q);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setPages(data.pages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(1, ""); }, [fetchUsers]);

  const handleSearch = (val: string) => {
    setSearch(val);
    fetchUsers(1, val);
  };

  const changeRole = async (userId: string, newRole: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, role: newRole }),
    });
    if (res.ok) {
      toast.success("Role updated");
      fetchUsers(page, search);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm(t(locale, "admin.deleteConfirm"))) return;
    const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("User deleted");
      fetchUsers(page, search);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t(locale, "admin.searchUsers")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-slate-500">{total} {locale === "en" ? "users" : "ব্যবহারকারী"}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : users.length === 0 ? (
        <p className="text-center text-slate-400 py-10">{t(locale, "admin.noUsers")}</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-4 py-3 font-medium text-slate-500">{t(locale, "admin.name")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500 hidden md:table-cell">{t(locale, "admin.email")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500">{t(locale, "admin.role")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">{t(locale, "admin.treesCount")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">{t(locale, "admin.joined")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500">{t(locale, "admin.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 shrink-0">
                            {u.name[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800 truncate max-w-[120px]">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                          {u.role === "admin" ? t(locale, "admin.admin") : t(locale, "admin.member")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{u._count.createdTrees}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">
                        {new Date(u.createdAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => changeRole(u.id, u.role === "admin" ? "member" : "admin")}
                          >
                            {u.role === "admin" ? t(locale, "admin.makeMember") : t(locale, "admin.makeAdmin")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteUser(u.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchUsers(page - 1, search); }}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-500">{page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => { setPage(page + 1); fetchUsers(page + 1, search); }}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Trees Tab ─── */
function TreesTab() {
  const { locale } = useZaitunStore();
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchTrees = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/trees?page=${p}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setTrees(data.trees);
        setPages(data.pages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrees(1); }, [fetchTrees]);

  const deleteTree = async (id: string) => {
    if (!confirm(t(locale, "admin.deleteTreeConfirm"))) return;
    const res = await fetch(`/api/admin/trees?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Tree deleted");
      fetchTrees(page);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : trees.length === 0 ? (
        <p className="text-center text-slate-400 py-10">{t(locale, "admin.noTrees")}</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-4 py-3 font-medium text-slate-500">{t(locale, "admin.treeName")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500 hidden md:table-cell">{t(locale, "admin.creator")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500">{t(locale, "admin.persons")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">{t(locale, "admin.entries")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500">{t(locale, "admin.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {trees.map((tr) => (
                    <tr key={tr.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">{tr.name}</td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{tr.creator?.name || "-"}</td>
                      <td className="px-4 py-3 text-slate-500">{tr._count.persons}</td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{tr._count.diaryEntries}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteTree(tr.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchTrees(page - 1); }}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-500">{page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => { setPage(page + 1); fetchTrees(page + 1); }}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Diaries Tab ─── */
function DiariesTab() {
  const { locale } = useZaitunStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchEntries = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/diaries?page=${p}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setPages(data.pages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(1); }, [fetchEntries]);

  const deleteEntry = async (id: string) => {
    if (!confirm(t(locale, "admin.deleteDiaryConfirm"))) return;
    const res = await fetch(`/api/admin/diaries?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Entry deleted");
      fetchEntries(page);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : entries.length === 0 ? (
        <p className="text-center text-slate-400 py-10">{t(locale, "admin.noDiaries")}</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-4 py-3 font-medium text-slate-500">{t(locale, "admin.diaryTitle")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500 hidden md:table-cell">{t(locale, "admin.tree")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">{t(locale, "admin.person")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">{t(locale, "admin.date")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500">{t(locale, "admin.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-[200px]">{e.title}</td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{e.tree?.name || "-"}</td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                        {e.person?.firstName} {e.person?.lastName || ""}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">{e.date}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteEntry(e.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchEntries(page - 1); }}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-500">{page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => { setPage(page + 1); fetchEntries(page + 1); }}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}