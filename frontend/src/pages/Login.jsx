import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const roleHome = { donor: "/donor", ngo: "/ngo", volunteer: "/ngo", recipient: "/recipient", admin: "/admin" };

export default function Login() {
  const { login, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("password"); // "password" | "otp"
  const [step, setStep] = useState("enter"); // for otp: "enter" -> "verify"
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const afterLogin = (user) => navigate(roleHome[user.role] || "/");

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const user = await login(emailOrPhone, password);
      afterLogin(user);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally { setBusy(false); }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await requestOtp(emailOrPhone);
      setStep("verify");
    } catch (err) {
      setError(err.response?.data?.message || "Could not send OTP");
    } finally { setBusy(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const user = await verifyOtp(emailOrPhone, otp);
      afterLogin(user);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-sm mx-auto px-5 py-16">
      <h1 className="text-2xl font-semibold text-banyan dark:text-mango mb-1">Welcome back</h1>
      <p className="text-ink-light dark:text-husk/70 mb-8">Log in to FoodBridge</p>

      <div className="flex gap-2 mb-6 text-sm">
        <button
          onClick={() => { setMode("password"); setError(""); }}
          className={`px-3 py-1.5 rounded-full ${mode === "password" ? "bg-banyan text-husk" : "border border-banyan/20"}`}
        >Password</button>
        <button
          onClick={() => { setMode("otp"); setStep("enter"); setError(""); }}
          className={`px-3 py-1.5 rounded-full ${mode === "otp" ? "bg-banyan text-husk" : "border border-banyan/20"}`}
        >OTP</button>
      </div>

      {error && <p className="text-clay text-sm mb-4">{error}</p>}

      {mode === "password" && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <input
            required placeholder="Email or phone" value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5"
          />
          <input
            required type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5"
          />
          <button disabled={busy} className="w-full py-2.5 rounded-full bg-banyan text-husk font-medium hover:bg-banyan-dark transition">
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
      )}

      {mode === "otp" && step === "enter" && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <input
            required placeholder="Email or phone" value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5"
          />
          <button disabled={busy} className="w-full py-2.5 rounded-full bg-banyan text-husk font-medium hover:bg-banyan-dark transition">
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      )}

      {mode === "otp" && step === "verify" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-sm text-ink-light dark:text-husk/70">Code sent to {emailOrPhone}</p>
          <input
            required placeholder="6-digit code" value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border border-banyan/20 dark:border-husk/20 bg-transparent rounded-lg px-4 py-2.5 tracking-widest"
          />
          <button disabled={busy} className="w-full py-2.5 rounded-full bg-banyan text-husk font-medium hover:bg-banyan-dark transition">
            {busy ? "Verifying…" : "Verify & log in"}
          </button>
        </form>
      )}

      <p className="mt-8 text-sm text-ink-light dark:text-husk/70">
        New here? <Link to="/register" className="text-mango-dark dark:text-mango font-medium">Create an account</Link>
      </p>
    </div>
  );
}
