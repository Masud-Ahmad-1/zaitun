"use client";

import { useZaitunStore } from "@/store/zaitun";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { LogIn, UserPlus, Loader2, Shield } from "lucide-react";

export function AuthDialog() {
  const {
    showAuthDialog, setShowAuthDialog, authMode, setAuthMode,
    locale,
  } = useZaitunStore();

  const isLogin = authMode === "login";

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const resetForms = () => {
    setLoginEmail("");
    setLoginPassword("");
    setSignupName("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupConfirm("");
  };

  const switchMode = (mode: "login" | "signup") => {
    resetForms();
    setAuthMode(mode);
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) return;
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        const { setUser } = useZaitunStore.getState();
        setUser(data);
        setShowAuthDialog(false);
        toast.success(t(locale, "auth.loginSuccess"));
        const { setTrees, setView } = useZaitunStore.getState();
        const treesRes = await fetch("/api/trees");
        if (treesRes.ok) setTrees(await treesRes.json());
        setView("trees");
      } else {
        toast.error(data.error || t(locale, "auth.invalidCredentials"));
      }
    } catch {
      toast.error(t(locale, "auth.invalidCredentials"));
    }
    setLoginLoading(false);
  };

  const handleSignup = async () => {
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) return;
    if (signupPassword.length < 6) {
      toast.error(t(locale, "auth.passwordMin"));
      return;
    }
    if (signupPassword !== signupConfirm) {
      toast.error(t(locale, "auth.passwordMismatch"));
      return;
    }
    setSignupLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        const { setUser } = useZaitunStore.getState();
        setUser(data);
        setShowAuthDialog(false);
        toast.success(t(locale, "auth.signupSuccess"));
        const { setView } = useZaitunStore.getState();
        setView("trees");
      } else {
        toast.error(data.error || t(locale, "auth.emailExists"));
      }
    } catch {
      toast.error("Server error");
    }
    setSignupLoading(false);
  };

  return (
    <Dialog open={showAuthDialog} onOpenChange={(o) => { if (!o) { setShowAuthDialog(false); resetForms(); } }}>
      <DialogContent className="sm:max-w-md">
        {isLogin ? (
          <>
            <DialogHeader className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <LogIn className="w-7 h-7 text-emerald-600" />
              </div>
              <DialogTitle className="text-emerald-950 text-xl">
                {t(locale, "auth.loginTitle")}
              </DialogTitle>
              <p className="text-sm text-emerald-700/60 mt-1">
                {t(locale, "auth.loginSubtitle")}
              </p>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{t(locale, "auth.email")}</Label>
                <Input
                  type="email"
                  placeholder={t(locale, "auth.emailPlaceholder")}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label>{t(locale, "auth.password")}</Label>
                <Input
                  type="password"
                  placeholder={t(locale, "auth.passwordPlaceholder")}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleLogin}
                disabled={loginLoading || !loginEmail.trim() || !loginPassword}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t(locale, "auth.login")}
              </Button>
              <p className="text-center text-sm text-emerald-600/60">
                {t(locale, "auth.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-emerald-700 font-medium hover:underline"
                >
                  {t(locale, "auth.signup")}
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-7 h-7 text-emerald-600" />
              </div>
              <DialogTitle className="text-emerald-950 text-xl">
                {t(locale, "auth.signupTitle")}
              </DialogTitle>
              <p className="text-sm text-emerald-700/60 mt-1">
                {t(locale, "auth.signupSubtitle")}
              </p>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{t(locale, "auth.name")}</Label>
                <Input
                  placeholder={t(locale, "auth.namePlaceholder")}
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label>{t(locale, "auth.email")}</Label>
                <Input
                  type="email"
                  placeholder={t(locale, "auth.emailPlaceholder")}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label>{t(locale, "auth.password")}</Label>
                <Input
                  type="password"
                  placeholder={t(locale, "auth.passwordPlaceholder")}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label>{t(locale, "auth.confirmPassword")}</Label>
                <Input
                  type="password"
                  placeholder={t(locale, "auth.confirmPasswordPlaceholder")}
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleSignup}
                disabled={signupLoading || !signupName.trim() || !signupEmail.trim() || !signupPassword || !signupConfirm}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {signupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t(locale, "auth.signup")}
              </Button>
              <p className="text-center text-sm text-emerald-600/60">
                {t(locale, "auth.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-emerald-700 font-medium hover:underline"
                >
                  {t(locale, "auth.login")}
                </button>
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function UserMenu() {
  const { user, locale, setUser, showAuthDialog, setShowAuthDialog, setAuthMode, setView } = useZaitunStore();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", { method: "POST" });
    } catch {
      // ignore
    }
    document.cookie = "zaitun_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
    window.location.href = "/";
  };

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-bold text-white">
            {user.name[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-emerald-900 max-w-[120px] truncate">{user.name}</span>
        </div>
      ) : null}
      {user?.role === "admin" && (
        <Button variant="ghost" size="sm" onClick={() => setView("admin")} className="text-sm text-amber-700 hover:text-amber-900 hover:bg-amber-50 gap-1">
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t(locale, "admin.panel")}</span>
        </Button>
      )}
      {user ? (
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-sm text-emerald-600 hover:text-red-600">
          {t(locale, "auth.logout")}
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setAuthMode("login"); setShowAuthDialog(true); }}
            className="text-sm text-emerald-700"
          >
            {t(locale, "auth.login")}
          </Button>
          <Button
            id="zaitun-signup-btn"
            size="sm"
            onClick={() => { setAuthMode("signup"); setShowAuthDialog(true); }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
          >
            {t(locale, "auth.signup")}
          </Button>
        </>
      )}
    </div>
  );
}