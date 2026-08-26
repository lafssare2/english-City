import React, { useState } from "react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "../lib/firebase";
import { AuthUser } from "../types";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  LogOut,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Cloud,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        onAuthSuccess({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || email.split("@")[0],
          photoURL: cred.user.photoURL,
          isAnonymous: false,
        });
        onClose();
      } else if (mode === "register") {
        if (password.length < 6) {
          setError("Password should be at least 6 characters.");
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim() });
        }
        onAuthSuccess({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: displayName.trim() || email.split("@")[0],
          photoURL: cred.user.photoURL,
          isAnonymous: false,
        });
        onClose();
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMessage("Password reset email sent. Please check your inbox.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = "Authentication failed. Please check your details.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists. Try signing in.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      setError(msg);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      onAuthSuccess({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || "Explorer",
        photoURL: cred.user.photoURL,
        isAnonymous: false,
      });
      onClose();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Google sign-in could not be completed. Please try with email/password.");
      }
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onAuthSuccess({
        uid: "guest",
        email: null,
        displayName: "Guest Traveler",
        photoURL: null,
        isAnonymous: true,
      });
      onClose();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl">
              🏙️
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {currentUser && !currentUser.isAnonymous
                  ? "Your Account"
                  : mode === "login"
                  ? "Sign In to English City"
                  : mode === "register"
                  ? "Create Your Account"
                  : "Reset Password"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentUser && !currentUser.isAnonymous
                  ? "Synced with Cloud Firestore"
                  : "Save your CEFR progress, words & memories across devices"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentUser && !currentUser.isAnonymous ? (
            /* Signed In User View */
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {currentUser.displayName || "Explorer"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Cloud Firestore Active</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Long-term NPC relationship memories synced</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>SuperMemo SM-2 spaced repetition active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Cross-device career & quest progression</span>
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  onClick={handleSignOut}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-medium transition flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition"
                >
                  Back to City
                </button>
              </div>
            </div>
          ) : (
            /* Auth Forms */
            <div className="space-y-4">
              {/* Google Sign In */}
              {mode !== "forgot" && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-2.5 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-center space-x-3 transition shadow-xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="flex items-center my-4">
                    <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
                    <span className="px-3 text-xs text-slate-400 font-medium">OR EMAIL</span>
                    <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
                  </div>
                </>
              )}

              {/* Status alerts */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-3">
                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Learner Display Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Alex"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {mode !== "forgot" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center space-x-2 mt-2"
                >
                  {loading ? (
                    <span className="animate-spin text-lg">⏳</span>
                  ) : (
                    <>
                      <span>
                        {mode === "login"
                          ? "Sign In"
                          : mode === "register"
                          ? "Create Account"
                          : "Send Reset Link"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Navigation toggle between Login / Register */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                {mode === "login" ? (
                  <p>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setError(null);
                      }}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : mode === "register" ? (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                      }}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p>
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                      }}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                    >
                      Back to Sign In
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
