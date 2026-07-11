"use client";

import { useZaitunStore } from "@/store/zaitun";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { HeroSection } from "@/components/zaitun/HeroSection";
import { TreesSection } from "@/components/zaitun/TreesSection";
import { TreeDetailSection } from "@/components/zaitun/TreeDetailSection";
import { DiarySection } from "@/components/zaitun/DiarySection";
import { DiaryEditorDialog } from "@/components/zaitun/DiaryEditorDialog";
import { AuthDialog } from "@/components/zaitun/AuthDialog";
import { AdminSection } from "@/components/zaitun/AdminSection";
import { JoinSection } from "@/components/zaitun/JoinSection";

export default function Home() {
  const { view, setUser, setTrees, setView } = useZaitunStore();

  // Check session on mount
  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            const treesRes = await fetch("/api/trees");
            if (treesRes.ok && !cancelled) {
              const trees = await treesRes.json();
              setTrees(trees);
              if (trees.length > 0) {
                setView("trees");
              }
            }
          }
        }
      } catch {
        // ignore
      }
    };
    checkSession();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {view === "hero" && <HeroSection key="hero" />}
        {view === "trees" && <TreesSection key="trees" />}
        {view === "tree-detail" && <TreeDetailSection key="tree-detail" />}
        {view === "diary" && <DiarySection key="diary" />}
        {view === "join" && <JoinSection key="join" />}
        {view === "admin" && <AdminSection key="admin" />}
      </AnimatePresence>
      <DiaryEditorDialog />
      <AuthDialog />
    </>
  );
}