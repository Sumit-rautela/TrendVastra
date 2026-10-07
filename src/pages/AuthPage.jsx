import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Field({ label, type = "text", value, onChange, autoComplete }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
      />
    </label>
  );
}

export default function AuthPage({ initialMode }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const isRegistering = mode === "register";
  const change = (key) => (value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const switchMode = () => {
    setMode(isRegistering ? "login" : "register");
    setError("");
  };
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authenticate(mode, form);
      navigate("/");
    } catch (err) {
      setError(
        err.message.includes("Failed to fetch")
          ? "Backend is not connected yet — the UI is ready for /api/auth."
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`auth-page ${isRegistering ? "registering" : ""}`}>
      <div className="auth-shell">
        <div className="auth-shape" aria-hidden="true" />
        <div className="auth-shape auth-shape-secondary" aria-hidden="true" />
        <section className="auth-form" aria-labelledby="auth-title">
          <div className="auth-form-content" key={mode}>
            <a className="auth-brand" href="/">
              Trend<span>Vastra</span>
            </a>
            <p className="auth-kicker">
              {isRegistering ? "JOIN THE EDIT" : "MEMBER ACCESS"}
            </p>
            <h1 id="auth-title">
              {isRegistering ? "Make it yours." : "Welcome back."}
            </h1>
            <p className="auth-intro">
              {isRegistering
                ? "Create your account and receive a more personal way to discover fashion."
                : "Sign in to continue building a wardrobe that feels like you."}
            </p>
            <form onSubmit={submit} noValidate>
              {isRegistering && (
                <Field
                  label="Full name"
                  value={form.name}
                  onChange={change("name")}
                  autoComplete="name"
                />
              )}
              <Field
                label="Email address"
                type="email"
                value={form.email}
                onChange={change("email")}
                autoComplete="email"
              />
              <Field
                label="Password"
                type="password"
                value={form.password}
                onChange={change("password")}
                autoComplete={
                  isRegistering ? "new-password" : "current-password"
                }
              />
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="auth-submit" disabled={loading}>
                {loading
                  ? "Please wait…"
                  : isRegistering
                    ? "Create account"
                    : "Sign in"}{" "}
                <span aria-hidden="true">↗</span>
              </button>
            </form>
            <p className="auth-switch">
              {isRegistering ? "Already a member?" : "New to TrendVastra?"}{" "}
              <button type="button" onClick={switchMode}>
                {isRegistering ? "Sign in" : "Create an account"}
              </button>
            </p>
          </div>
        </section>
        <section className="auth-aside" aria-label="TrendVastra features">
          <div className="auth-aside-copy">
            <p className="auth-kicker">STYLE, INTELLIGENTLY</p>
            <h2>
              {isRegistering
                ? "A wardrobe with a point of view."
                : "Discover fashion that gets you."}
            </h2>
            <p>
              Search by image, receive considered recommendations, and make
              every look feel distinctly yours.
            </p>
          </div>
          <div
            className="auth-editorial-image"
            role="img"
            aria-label="Editorial fashion styling"
          />
          <div className="auth-tags">
            <span>Visual Search</span>
            <span>AI Styling</span>
            <span>Curated picks</span>
          </div>
          <p className="auth-edition">
            The personal edit
            <br />
            <b>01 — 26</b>
          </p>
        </section>
      </div>
    </main>
  );
}
