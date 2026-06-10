"use client";
import React, { useState } from "react";
import { api } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login(email, password);
      alert("Login successful!");
      window.location.href = "/";
    } catch (error) {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-xl p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded bg-blue-600 flex items-center justify-center font-bold text-2xl text-white mx-auto mb-4">
            I
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your ImageShare account</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">Password</label>
            </div>
            <div className="relative w-full flex items-center">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-lg pl-4 pr-10 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
            {loading ? "Please wait..." : "Sign In"}
          </button>
        </form>
        
        <p className="text-center text-sm text-slate-500 border-t border-slate-100 pt-4 mt-1">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

