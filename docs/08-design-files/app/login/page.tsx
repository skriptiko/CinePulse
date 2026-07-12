"use client";

import React from "react"

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Play,
  ArrowRight,
  Chrome,
  Apple,
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen flex">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/login-bg.jpg"
          alt="Cinematic background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      {/* Left Side - Login Form */}
      <div className="relative z-10 flex flex-col justify-center w-full lg:w-1/2 px-6 sm:px-12 lg:px-20 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Play className="w-5 h-5 text-accent-foreground fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              CinePulse
            </span>
          </Link>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 text-balance">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-lg">
              Sign in to continue your cinematic journey
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 bg-secondary/50 border-border focus:border-accent focus:ring-accent/20 rounded-lg text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 pr-12 bg-secondary/50 border-border focus:border-accent focus:ring-accent/20 rounded-lg text-foreground placeholder:text-muted-foreground"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="remember"
                className="border-muted-foreground data-[state=checked]:bg-accent data-[state=checked]:border-accent"
              />
              <Label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Keep me signed in for 30 days
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg transition-all duration-200 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-12 bg-secondary/50 border-border hover:bg-secondary hover:border-muted-foreground/30 rounded-lg transition-all duration-200"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Google
            </Button>
            <Button
              variant="outline"
              className="h-12 bg-secondary/50 border-border hover:bg-secondary hover:border-muted-foreground/30 rounded-lg transition-all duration-200"
            >
              <Apple className="w-5 h-5 mr-2" />
              Apple
            </Button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-muted-foreground">
            New to CinePulse?{" "}
            <Link
              href="/signup"
              className="text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Feature Showcase */}
      <div className="hidden lg:flex relative z-10 w-1/2 items-center justify-center p-12">
        <div className="glass rounded-2xl p-8 max-w-lg">
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center">
              <Play className="w-7 h-7 text-accent fill-current" />
            </div>
            <h2 className="text-2xl font-bold text-foreground text-balance">
              Unlimited movies, shows, and more
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Stream thousands of titles in stunning 4K HDR. Watch on any device,
              anytime, anywhere. Your personal cinema awaits.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {["4K Ultra HD", "Dolby Atmos", "No Ads", "Offline Mode"].map(
                (feature) => (
                  <span
                    key={feature}
                    className="px-3 py-1.5 text-sm bg-secondary/80 text-foreground rounded-full border border-border"
                  >
                    {feature}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
