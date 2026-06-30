import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, Loader2, Shield } from "lucide-react";
import { authApi } from "@/lib/auth";
import { useAdminAuth } from "@/lib/AuthContext";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { refetch } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("يرجى ملء جميع الحقول"); return; }
    setIsLoading(true);
    setError("");
    try {
      await authApi.admin.login({ email: email.trim(), password });
      await refetch();
      navigate("/admin");
    } catch (err: any) {
      setError(err?.error ?? "حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "linear-gradient(135deg, #0b1220, #111827)" }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: "36px 32px", boxShadow: "0 20px 40px rgba(0,0,0,0.25)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Shield className="h-7 w-7" style={{ color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>لوحة المسؤول</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>دخول إدارة المنصة</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" inputMode="email" placeholder="admin@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required disabled={isLoading} autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative mt-1">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required disabled={isLoading} autoComplete="current-password" dir="ltr" />
              <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" style={{ width: "100%", height: 48, fontWeight: 700, borderRadius: 12 }} disabled={isLoading}>
            {isLoading ? <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جارٍ الدخول...</> : "تسجيل الدخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
