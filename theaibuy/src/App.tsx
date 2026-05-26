import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Coins, 
  TrendingUp, 
  Copy, 
  Twitter, 
  Linkedin, 
  Check, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Lock, 
  Building, 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Mail,
  RefreshCw,
  Eye,
  CheckCircle,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PRICING_DATA } from "./pricing";

// Define TypeScript structures matching our server definitions
const animTransitionFast = { type: "spring", stiffness: 600, damping: 28 };
const animTransitionSubtle = { duration: 0.18, ease: "easeOut" };
const animTransitionEnter = { duration: 0.35, ease: [0.16, 1, 0.3, 1] };

interface SubscriptionInput {
  id?: string;
  toolId: string;
  planId: string;
  seats: number;
}

interface ToolRecommendation {
  toolId: string;
  toolName: string;
  currentPlanName: string;
  currentSpend: number;
  recommendedPlanName: string;
  recommendedSpend: number;
  action: "keep" | "downgrade" | "remove" | "switch";
  monthlySavings: number;
  reason: string;
}

interface AuditResult {
  currentMonthlySpend: number;
  recommendedMonthlySpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  recommendations: ToolRecommendation[];
  overlappingToolsDetected: string[];
  summary?: string;
}

// Custom reusable high-fidelity SVG brand logo representing the exact "theaibuy" logo mark
export function BrandLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 120 120" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 3 Radiating Rays above the Sparkle */}
      <path 
        d="M 45,5 L 45,1" 
        stroke="#FFDE00" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M 33,11 Q 29,7 29,7" 
        stroke="#FFDE00" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M 57,11 Q 61,7 61,7" 
        stroke="#FFDE00" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />

      {/* 4-Pointed Sparkle (Star) */}
      <path 
        d="M 45,9 Q 45,21 57,21 Q 45,21 45,33 Q 45,21 33,21 Q 45,21 45,9 Z" 
        fill="#FFDE00" 
      />

      {/* Zigzag Chart Trending Up with Arrowhead */}
      <path 
        d="M 15,85 L 45,55 L 65,75 L 105,35" 
        stroke="#FFDE00" 
        strokeWidth="9" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Arrowhead pointed up-right */}
      <path 
        d="M 80,35 L 105,35 L 105,60" 
        stroke="#FFDE00" 
        strokeWidth="9" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

export default function App() {
  // Navigation / Routing State
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  
  // Currency toggling state: 'USD' | 'INR'
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const USD_INR_RATE = 83.5;

  const formatCost = (usdAmount: number) => {
    if (currency === "INR") {
      const inrAmount = usdAmount * USD_INR_RATE;
      return `₹${Math.round(inrAmount).toLocaleString("en-IN")}`;
    }
    return `$${Math.round(usdAmount).toLocaleString()}`;
  };
  
  // Local storage keys
  const STATE_KEY = "theaibuy_form_state_v1";
  const RESULTS_KEY = "theaibuy_active_results_v1";

  // Form Parameters (Landing State)
  const [teamSize, setTeamSize] = useState<number>(3);
  const [useCase, setUseCase] = useState<"coding" | "writing" | "data" | "research" | "mixed">("mixed");
  const [tools, setTools] = useState<SubscriptionInput[]>([
    { id: "row-default-1", toolId: "cursor", planId: "pro", seats: 3 },
    { id: "row-default-2", toolId: "claude", planId: "pro", seats: 3 }
  ]);

  // Loading, submissions, and notification states
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  // Lead Collection State
  const [emailInput, setEmailInput] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [honeypot, setHoneypot] = useState<string>("");
  const [isCapturingLead, setIsCapturingLead] = useState<boolean>(false);
  const [leadCollected, setLeadCollected] = useState<boolean>(false);

  // Status effects
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [publicAudit, setPublicAudit] = useState<{
    publicSlug: string;
    input: any;
    result: any;
    totalMonthlySavings: number;
    totalAnnualSavings: number;
    createdAt?: string;
  } | null>(null);
  const [isLoadingPublicAudit, setIsLoadingPublicAudit] = useState<boolean>(false);

  // Load state on initialization
  useEffect(() => {
    // 1. Check if we are viewing a public share URL: `/audit/[slug]`
    const publicMatch = currentPath.match(/^\/audit\/([a-zA-Z0-9-]+)/);
    if (publicMatch) {
      const slug = publicMatch[1];
      loadPublicAudit(slug);
    } else {
      // Load standard form state from localStorage if available
      try {
        const savedForm = localStorage.getItem(STATE_KEY);
        if (savedForm) {
          const parsed = JSON.parse(savedForm);
          if (parsed.teamSize) setTeamSize(parsed.teamSize);
          if (parsed.useCase) setUseCase(parsed.useCase);
          if (parsed.tools && Array.isArray(parsed.tools)) {
            const withIds = parsed.tools.map((t: any, index: number) => ({
              ...t,
              id: t.id || `row-loaded-${index}-${Date.now()}`
            }));
            setTools(withIds);
          }
        }
      } catch (e) {
        console.warn("Could not load form state:", e);
      }

      // Load active results cache if previously simulated on /audit-result
      try {
        const savedResult = localStorage.getItem(RESULTS_KEY);
        if (savedResult) {
          const parsed = JSON.parse(savedResult);
          if (parsed.result && parsed.slug) {
            setAuditResult(parsed.result);
            setCurrentSlug(parsed.slug);
          }
        }
      } catch (e) {
        console.warn("Could not load results state:", e);
      }
    }

    // Capture standard history pushes/pops
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [currentPath]);

  // Persist form parameter modifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({ teamSize, useCase, tools })
      );
    } catch (e) {
      console.warn("Could not save form state:", e);
    }
  }, [teamSize, useCase, tools]);

  // Function to switch paths smoothly
  const navigateTo = (path: string) => {
    window.history.pushState(null, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Retrieve shared public parameters from server
  const loadPublicAudit = async (slug: string) => {
    setIsLoadingPublicAudit(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/audit/${slug}`);
      if (!response.ok) {
        throw new Error("Unable to locate specified audit report. It may have expired.");
      }
      const data = await response.json();
      setPublicAudit(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Network request failed querying this audit reference.");
    } finally {
      setIsLoadingPublicAudit(false);
    }
  };

  // Manage Subscription Rows Actions
  const handleAddToolRow = () => {
    // Pick the first available tool that isn't fully duplicated if possible, or copy default with unique stable row id
    setTools([
      ...tools,
      {
        id: `row-new-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        toolId: "copilot",
        planId: "individual",
        seats: 1
      }
    ]);
  };

  const handleUpdateToolRow = (index: number, field: keyof SubscriptionInput, value: any) => {
    const updated = [...tools];
    if (field === "toolId") {
      const toolData = PRICING_DATA[value];
      updated[index].toolId = value;
      // Re-initialize correct plan based on defaults
      updated[index].planId = Object.keys(toolData.plans)[0];
    } else if (field === "seats") {
      updated[index].seats = Math.max(1, Number(value));
    } else if (field === "planId") {
      updated[index].planId = value;
    }
    setTools(updated);
  };

  const handleRemoveToolRow = (index: number) => {
    if (tools.length <= 1) {
      return;
    }
    const filtered = tools.filter((_, i) => i !== index);
    setTools(filtered);
  };

  // Calculated estimated prices dynamically in real-time on screen
  const calculateEstimateMonthlySpend = (toolInput: SubscriptionInput): number => {
    const tool = PRICING_DATA[toolInput.toolId];
    if (!tool) return 0;
    const plan = tool.plans[toolInput.planId];
    if (!plan) return 0;
    
    let billingSeats = toolInput.seats;
    if (plan.minSeats && toolInput.seats < plan.minSeats) {
      billingSeats = plan.minSeats;
    }
    return plan.pricePerSeatMonth * billingSeats;
  };

  // Trigger server-level calculations from entered parameters
  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuditing(true);
    setErrorMessage(null);
    setLeadCollected(false);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamSize, useCase, tools: finalizedTools })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Execution error encountered on audit calculation.");
      }

      const rawData = await res.json();

      if (!rawData?.result || !rawData?.publicSlug) {
        throw new Error("Audit completed but the server response was missing result data.");
      }
      
      const combinedResult: AuditResult = {
        ...rawData.result,
        summary: rawData.summary
      };

      setAuditResult(combinedResult);
      setCurrentSlug(rawData.publicSlug);

      // Cache locally
      localStorage.setItem(
        RESULTS_KEY,
        JSON.stringify({ result: combinedResult, slug: rawData.publicSlug })
      );

      setIsAuditing(false);
      navigateTo("/audit-result");

    } catch (err: any) {
      setErrorMessage(err.message || "Failed retrieving AI subscription audit.");
      setIsAuditing(false);
    }
  };

  // Lead dispatch captures
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    
    setIsCapturingLead(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditSlug: currentSlug,
          email: emailInput,
          companyName,
          role,
          teamSize,
          honeypot
        })
      });

      if (!res.ok) {
        const errText = await res.json();
        throw new Error(errText.error || "Lead recording service issue.");
      }

      const data = await res.json();
      const delivery = data.emailDelivery;
      setLeadCollected(Boolean(delivery?.sent));
      if (delivery && !delivery.sent) {
        setErrorMessage(`${delivery.message} Public report link: ${delivery.reportLink}`);
      }
      // Clean captures fields
      if (delivery?.sent) {
        setEmailInput("");
        setCompanyName("");
        setRole("");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Issues occurred saving your lead criteria.");
    } finally {
      setIsCapturingLead(false);
    }
  };

  // Copy share links
  const handleCopyLink = async (customSlug?: string) => {
    const slugToCopy = customSlug || currentSlug;
    if (!slugToCopy) return;

    const fullLink = new URL(`/audit/${encodeURIComponent(slugToCopy)}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopiedLink(true);
      setErrorMessage(null);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      window.prompt("Copy this public audit link:", fullLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Ensure that every single tool row has a unique stable id for animation keys
  const finalizedTools = tools.map((t, idx) => ({
    ...t,
    id: t.id || `row-auto-${idx}-${t.toolId}-${t.planId}`
  }));

  // Calculate stats values using the finalized list
  const totalEnteredCost = finalizedTools.reduce((total, t) => total + calculateEstimateMonthlySpend(t), 0);

  return (
    <div id="theaibuy-root-viewport" className="min-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col selection:bg-[#FFDE00] selection:text-black">
      
      {/* Decorative Blur Background Auras */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FFDE00]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-yellow-500/[0.03] rounded-full blur-[140px] pointer-events-none"></div>

      {/* TOP HEADER */}
      <header id="header-nav" className="border-b border-zinc-800/60 sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-20 flex justify-between items-center">
          {/* Logo Brand Title */}
          <div 
            id="brand-logo-button"
            className="flex items-center gap-1.5 sm:gap-3 cursor-pointer group"
            onClick={() => navigateTo("/")}
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }} 
              className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1c1c1e]/60 border border-zinc-800 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 outline-none group-hover:border-[#FFDE00]/30 shadow-lg shadow-black/40"
            >
              <BrandLogo className="w-5.5 h-5.5 sm:w-7.5 sm:h-7.5 text-[#FFDE00]" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl font-black tracking-tight select-none leading-none text-white">
                the<span className="text-[#FFDE00]">ai</span>buy
              </span>
              <span className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase mt-1 hidden sm:inline font-mono font-sans">
                Buy smarter AI tools • Save more
              </span>
            </div>
          </div>

          {/* Quick Stats or Navigation items */}
          <div className="flex items-center gap-2 sm:gap-6">
            <button 
              id="header-nav-home"
              onClick={() => navigateTo("/")} 
              className={`text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors ${currentPath === "/" ? "text-[#FFDE00]" : "text-zinc-400 hover:text-white"}`}
            >
              <span className="inline sm:hidden">Audit</span>
              <span className="hidden sm:inline">Audit Engine</span>
            </button>
            
            {auditResult && (
              <button 
                id="header-nav-results"
                onClick={() => navigateTo("/audit-result")} 
                className={`text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors ${currentPath === "/audit-result" ? "text-[#FFDE00]" : "text-zinc-400 hover:text-white"}`}
              >
                <span className="inline sm:hidden">Result</span>
                <span className="hidden sm:inline">Latest Audit</span>
              </button>
            )}

            <motion.button
              id="header-nav-start"
              whileHover={{ scale: 1.03 }}
              onClick={() => {
                navigateTo("/");
                const formEl = document.getElementById("subscription-audit-form-container");
                if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-2 py-1.5 sm:px-4 sm:py-2.5 bg-[#FFDE00] hover:bg-[#ffe524] text-black rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-black shadow-md hover:shadow-[#FFDE00]/20 transition-all uppercase tracking-wider cursor-pointer font-sans"
            >
              <span className="inline sm:hidden">Start</span>
              <span className="hidden sm:inline font-black">Start Free Audit</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ERROR MESSAGE NOTIFICATION BAR */}
      {errorMessage && (
        <div id="error-toast-indicator" className="bg-red-500/15 border-b border-red-500/30 text-red-200 text-center py-3 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-4 text-white hover:underline uppercase font-bold text-[10px] tracking-wider">Dismiss</button>
        </div>
      )}

      {/* CORE PAGES VIEWS ROUTER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 md:py-8 relative z-10">

        {/* ========================================================= */}
        {/* VIEW 1: LANDING & INPUT PAGE (Route: /)                   */}
        {/* ========================================================= */}
        {currentPath === "/" && (
          <motion.div 
            id="view-landing-homepage" 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={animTransitionSubtle}
            className="space-y-6 sm:space-y-10 md:space-y-16"
          >
            {/* HER0 & TRUST TITLE */}
            <div className="text-center max-w-3xl mx-auto space-y-3 pt-0">
              <div id="badge-beta-offer" className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#FFDE00]/10 border border-[#FFDE00]/25 rounded-full text-xs font-bold text-[#FFDE00] uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-[#FFDE00] rounded-full animate-ping"></span>
                <span>AI Spend Audit Tool • 100% Free</span>
              </div>

              {/* Giant Brand Logo Icon representing the logo image representation with rotate animations */}
              <div className="flex justify-center pt-2 select-none">
                <motion.div 
                  initial={{ rotate: -5, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                  transition={animTransitionFast}
                  className="relative cursor-pointer"
                >
                  <div className="absolute inset-0 bg-[#FFDE00]/15 rounded-full blur-3xl transform scale-75"></div>
                  <BrandLogo className="w-24 h-24 text-[#FFDE00] relative z-10 filter drop-shadow-[0_0_20px_rgba(255,222,0,0.25)]" />
                </motion.div>
              </div>
              
              <h1 id="landing-hero-headline" className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-white">
                Stop Overpaying for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFDE00] via-yellow-300 to-amber-400">AI Subscriptions</span>
              </h1>
              
              <p id="landing-hero-tagline" className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                <span className="font-semibold text-white">the<span className="text-[#FFDE00]">ai</span>buy</span> helps you list your subscription footprint, uncover overlapping product categories, and drop unnecessary custom licenses instantly. <strong className="text-white font-semibold">Audit your AI tools under 60 seconds with zero-login requirements.</strong>
              </p>

              {/* Trust badges */}
              <div id="trust-text-bullets" className="pt-2 flex flex-wrap justify-center items-center gap-y-2 gap-x-6 text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#FFDE00]" /> No Login Required</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#FFDE00]" /> Compliant Local Storage Persistence</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#FFDE00]" /> Standard Rule-Based Optimization</span>
              </div>

              <div>
                <motion.button
                  id="landing-cta-scroller"
                  whileHover={{ scale: 1.03 }}
                  onClick={() => {
                    const formEl = document.getElementById("subscription-audit-form-container");
                    if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-4 px-6 py-3.5 sm:px-8 sm:py-4 bg-[#FFDE00] hover:bg-[#ffe524] text-black font-black rounded-2xl shadow-xl shadow-yellow-500/10 hover:shadow-yellow-500/20 transition-all flex items-center justify-center gap-2.5 mx-auto cursor-pointer text-xs sm:text-sm"
                >
                  <span>Audit My AI Spend Now</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                </motion.button>
              </div>
            </div>

            {/* PROBLEM CARDS GRID */}
            <div id="problem-cards-section" className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Problem 1 */}
              <motion.div 
                id="problem-card-1" 
                whileHover={{ scale: 1.04, y: -6, borderColor: "rgba(239, 68, 68, 0.3)", boxShadow: "0 10px 30px -10px rgba(239, 68, 68, 0.08)" }}
                transition={animTransitionFast}
                className="bg-[#121214] border border-zinc-800/70 p-7 rounded-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl"></div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-black">
                    01
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Overlapping Tools</h3>
                    <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                      Teams regularly pay for GitHub Copilot, Cursor, and Windsurf concurrently. These feature-matched models create redundant charges under different accounts.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-red-400/80 font-semibold mt-4 flex items-center gap-1">
                  <span>Potential average waste:</span> <span className="font-bold underline text-white">$40 / user / month</span>
                </p>
              </motion.div>

              {/* Problem 2 */}
              <motion.div 
                id="problem-card-2" 
                whileHover={{ scale: 1.04, y: -6, borderColor: "rgba(255, 222, 0, 0.3)", boxShadow: "0 10px 30px -10px rgba(255, 222, 0, 0.08)" }}
                transition={animTransitionFast}
                className="bg-[#121214] border border-zinc-800/70 p-7 rounded-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl"></div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FFDE00]/10 border border-[#FFDE00]/25 flex items-center justify-center text-[#FFDE00] font-black">
                    02
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Inflated Organization Plans</h3>
                    <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                      SaaS vendors push heavy "Business" or "Enterprise" contracts on small-sized projects, binding teams into high-minimum billing counts (e.g. Claude / ChatGPT Teams minimum of 5/2 users).
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#FFDE00]/80 font-semibold mt-4 flex items-center gap-1">
                  <span>Potential average waste:</span> <span className="font-bold underline text-white">$150+ / month</span>
                </p>
              </motion.div>

              {/* Problem 3 */}
              <motion.div 
                id="problem-card-3" 
                whileHover={{ scale: 1.04, y: -6, borderColor: "rgba(245, 158, 11, 0.3)", boxShadow: "0 10px 30px -10px rgba(245, 158, 11, 0.08)" }}
                transition={animTransitionFast}
                className="bg-[#121214] border border-zinc-800/70 p-7 rounded-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl"></div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black">
                    03
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Hidden Developer API Credit</h3>
                    <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                      API access allows customized local clients to pay directly per token, bringing huge markdown opportunities over rigid monthly retainers when subscription utilization fluctuates.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-amber-400/80 font-semibold mt-4 flex items-center gap-1">
                  <span>Potential average savings:</span> <span className="font-bold underline text-white">Up to 70% decrease</span>
                </p>
              </motion.div>
            </div>

            {/* FORM CONTAINER */}
            <div id="subscription-audit-form-container" className="max-w-3xl mx-auto bg-[#121214] border border-zinc-800/80 rounded-[24px] sm:rounded-3xl overflow-hidden shadow-2xl relative">
              
              {/* Form Title */}
              <div className="px-4 py-4 sm:px-6 sm:py-6 bg-zinc-900/60 border-b border-zinc-850 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <BrandLogo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                    <span>Audit My AI Spend</span>
                  </h2>
                </div>
                <div className="flex items-center gap-3 self-center">
                  {/* Currency Switcher Toggle */}
                  <div className="flex items-center bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setCurrency("USD")}
                      className={`px-3 py-1 text-[10px] sm:text-xs font-black rounded-md transition-all cursor-pointer ${currency === "USD" ? "bg-[#FFDE00] text-black" : "text-zinc-400 hover:text-white"}`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency("INR")}
                      className={`px-3 py-1 text-[10px] sm:text-xs font-black rounded-md transition-all cursor-pointer ${currency === "INR" ? "bg-[#FFDE00] text-black" : "text-zinc-400 hover:text-white"}`}
                    >
                      INR (₹)
                    </button>
                  </div>
                  <span className="px-2.5 py-1 bg-[#FFDE00]/10 text-[#FFDE00] rounded-md border border-[#FFDE00]/25 text-[10px] sm:text-xs font-black">Live</span>
                </div>
              </div>

              {/* Form Payload */}
              <form onSubmit={handleSubmitAudit} className="p-4 sm:p-8 space-y-5 sm:space-y-8">
                
                {/* Team Size & Use Case Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Team Size */}
                  <div className="space-y-2">
                    <label id="label-team-size" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Team Size (Total Users)
                    </label>
                    <div className="relative">
                      <motion.input 
                        whileHover={{ scale: 1.005 }}
                        whileFocus={{ scale: 1.01 }}
                        transition={animTransitionFast}
                        type="number"
                        min="1"
                        max="1000"
                        value={teamSize}
                        onChange={(e) => setTeamSize(Math.max(1, Number(e.target.value)))}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                          }
                        }}
                        className="w-full bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-900/40 focus:border-[#FFDE00] focus:ring-1 focus:ring-[#FFDE00] focus:bg-zinc-950/80 rounded-xl px-4 py-3 text-white font-bold outline-none transition-all pl-10 duration-300"
                      />
                      <Users className="w-4 h-4 text-zinc-500 absolute left-3.5 top-4" />
                    </div>
                  </div>

                  {/* Use Case */}
                  <div className="space-y-2">
                    <label id="label-use-case" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Primary Use Case Profile
                    </label>
                    <div className="relative">
                      <motion.select
                        whileHover={{ scale: 1.005 }}
                        whileFocus={{ scale: 1.01 }}
                        transition={animTransitionFast}
                        value={useCase}
                        onChange={(e) => setUseCase(e.target.value as any)}
                        className="w-full appearance-none bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/45 focus:border-[#FFDE00] focus:ring-1 focus:ring-[#FFDE00] focus:bg-zinc-950/80 rounded-xl pl-4 pr-10 py-3 text-white font-semibold outline-none transition-all cursor-pointer duration-300"
                      >
                        <option value="coding" className="bg-zinc-950 text-white">Coding (Software Development focus)</option>
                        <option value="writing" className="bg-zinc-950 text-white">Writing (Marketing, Docs, & Content)</option>
                        <option value="data" className="bg-zinc-950 text-white">Data Science & Extractions</option>
                        <option value="research" className="bg-zinc-950 text-white">Academic, Analysis, & Research</option>
                        <option value="mixed" className="bg-zinc-950 text-white">Mixed/General-Purpose use</option>
                      </motion.select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscription Multi-List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label id="label-subscriptions" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Active AI SaaS Subscriptions
                    </label>
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full font-bold uppercase">
                      {tools.length} Tools Added
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <AnimatePresence initial={false}>
                      {finalizedTools.map((toolInput, idx) => {
                        const toolDef = PRICING_DATA[toolInput.toolId];
                        const availablePlans = toolDef ? Object.keys(toolDef.plans) : [];
                        const calculatedMonthlyCost = calculateEstimateMonthlySpend(toolInput);

                        return (
                          <motion.div 
                            key={toolInput.id} 
                            initial={{ opacity: 0, scale: 0.96, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -15, transition: { duration: 0.15 } }}
                            transition={animTransitionFast}
                            className="p-3 sm:p-4 bg-zinc-950/40 border border-zinc-850 hover:border-zinc-800 rounded-xl sm:rounded-2xl grid grid-cols-12 gap-3 sm:gap-4 transition-all relative group overflow-hidden items-end"
                          >
                            {/* Tool Choice */}
                            <div className="col-span-12 md:col-span-4 space-y-1">
                              <span className="text-[9px] text-zinc-500 uppercase font-black select-none tracking-wider font-mono">Tool Name</span>
                              <div className="relative">
                                <motion.select
                                  whileHover={{ scale: 1.005 }}
                                  whileFocus={{ scale: 1.01 }}
                                  transition={animTransitionFast}
                                  value={toolInput.toolId}
                                  onChange={(e) => handleUpdateToolRow(idx, "toolId", e.target.value)}
                                  className="w-full appearance-none bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-900/40 focus:border-[#FFDE00] focus:ring-1 focus:ring-[#FFDE00] rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-white font-extrabold outline-none transition-all duration-300 cursor-pointer"
                                >
                                  {Object.values(PRICING_DATA).map((p) => (
                                    <option key={p.id} value={p.id} className="bg-zinc-950 text-white">{p.name}</option>
                                  ))}
                                </motion.select>
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>

                            {/* Plan Choice for Tool */}
                            <div className="col-span-12 md:col-span-4 space-y-1">
                              <span className="text-[9px] text-zinc-500 uppercase font-black select-none tracking-wider font-mono">Plan Tier</span>
                              <div className="relative">
                                <motion.select
                                  whileHover={{ scale: 1.005 }}
                                  whileFocus={{ scale: 1.01 }}
                                  transition={animTransitionFast}
                                  value={toolInput.planId}
                                  onChange={(e) => handleUpdateToolRow(idx, "planId", e.target.value)}
                                  className="w-full appearance-none bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-900/40 focus:border-[#FFDE00] focus:ring-1 focus:ring-[#FFDE00] rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-white font-semibold outline-none transition-all capitalize duration-300 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                                >
                                  {availablePlans.map((planId) => {
                                    const usdPrice = PRICING_DATA[toolInput.toolId]?.plans[planId]?.pricePerSeatMonth || 0;
                                    const formattedRate = currency === "INR" 
                                      ? `₹${Math.round(usdPrice * USD_INR_RATE)}` 
                                      : `$${usdPrice}`;
                                    return (
                                      <option key={planId} value={planId} className="bg-zinc-950 text-white normal-case">
                                        {PRICING_DATA[toolInput.toolId]?.plans[planId]?.name} ({formattedRate}/mo counts)
                                      </option>
                                    );
                                  })}
                                </motion.select>
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>

                            {/* Counts Field */}
                            <div className="col-span-4 md:col-span-2 space-y-1">
                              <span className="text-[9px] text-zinc-500 uppercase font-black select-none tracking-wider font-mono">Counts</span>
                              <motion.input
                                whileHover={{ scale: 1.005 }}
                                whileFocus={{ scale: 1.01 }}
                                transition={animTransitionFast}
                                type="number"
                                min="1"
                                value={toolInput.seats}
                                onChange={(e) => handleUpdateToolRow(idx, "seats", e.target.value)}
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                onKeyDown={(e) => {
                                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                                    e.preventDefault();
                                  }
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-900/40 focus:border-[#FFDE00] focus:ring-1 focus:ring-[#FFDE00] rounded-xl px-3.5 py-2.5 text-xs text-white font-extrabold text-center outline-none transition-all duration-300"
                              />
                            </div>

                            {/* Live Spend Visualization Indicator Area */}
                            <div className="col-span-5 md:col-span-1 text-center md:text-right flex flex-row md:flex-col justify-between items-center md:items-stretch lg:items-end shrink-0 h-11.5">
                              <span className="text-[9px] text-zinc-500 uppercase font-black select-none tracking-wider block font-mono">Est. Cost</span>
                              <span className="text-sm font-bold text-[#FFDE00] font-mono leading-none pb-1 md:pb-2">
                                {formatCost(calculatedMonthlyCost)}
                              </span>
                            </div>

                            {/* Remove Tool Trigger */}
                            <div className="col-span-3 md:col-span-1 flex justify-end">
                              <button
                                type="button"
                                disabled={tools.length <= 1}
                                onClick={() => handleRemoveToolRow(idx)}
                                className="p-2.5 text-zinc-500 hover:text-red-400 bg-zinc-900/50 hover:bg-red-500/5 rounded-xl border border-zinc-800 hover:border-red-500/20 disabled:hover:text-zinc-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer h-10 w-10 flex items-center justify-center shrink-0"
                                title="Delete subscription row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Add Sub button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    transition={animTransitionFast}
                    onClick={handleAddToolRow}
                    className="w-full py-3.5 border border-dashed border-zinc-800 hover:border-[#FFDE00]/40 rounded-xl text-zinc-400 hover:text-[#FFDE00] bg-zinc-950/20 hover:bg-[#FFDE00]/5 transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Subscription Row</span>
                  </motion.button>
                </div>

                {/* Estimated aggregate bar */}
                <div className="bg-zinc-950/60 p-4.5 rounded-2xl border border-zinc-850/60 flex justify-between items-center">
                  <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Inputted Active Spend:</div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-[#FFDE00]">{formatCost(totalEnteredCost)}</span>
                    <span className="text-xs text-zinc-500 block">/ month across stack</span>
                  </div>
                </div>

                {/* Submits element and loader triggers */}
                <div className="bg-zinc-950/20 border-t border-zinc-850/80 pt-6 flex flex-col items-center">
                  <motion.button
                    type="submit"
                    whileHover={!isAuditing ? { scale: 1.01 } : {}}
                    transition={animTransitionFast}
                    disabled={isAuditing}
                    className="w-full py-4 bg-[#FFDE00] hover:bg-[#ffe524] disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black rounded-2xl text-base sm:text-lg shadow-xl shadow-yellow-500/5 transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    {isAuditing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Analyzing your AI spend...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate AI-Analyzed Spend Audit</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                  <p className="text-[10px] text-zinc-500 mt-4 text-center">
                    By submitting, your criteria will be logged securely. Sharing links do not expose personal profiles are generated immediately.
                  </p>
                </div>
              </form>
            </div>

            {/* FLOATING TRUST ELEMENT ROW */}
            <div id="footer-trust-elements" className="pt-4 flex flex-wrap justify-center items-center gap-12 border-t border-zinc-800/40">
              <div className="flex items-center gap-2 md:opacity-50 hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 bg-[#FFDE00]/10 border border-[#FFDE00]/25 rounded-full flex items-center justify-center text-[10px] text-[#FFDE00] font-black">A</div>
                <span className="text-xs font-bold text-zinc-400">Instant AI Spend Analysis</span>
              </div>
              <div className="flex items-center gap-2 md:opacity-50 hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-[10px] text-emerald-400 font-black">S</div>
                <span className="text-xs font-bold text-zinc-400">Compliant Client Storage</span>
              </div>
              <div className="flex items-center gap-2 md:opacity-50 hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 bg-[#FFDE00]/10 border border-[#FFDE00]/25 rounded-full flex items-center justify-center text-[10px] text-[#FFDE00] font-black">M</div>
                <span className="text-xs font-bold text-zinc-400">Automated Audit Dispatch</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: AUDIT RESULT PAGE (Route: /audit-result)          */}
        {/* ========================================================= */}
        {currentPath === "/audit-result" && (
          <motion.div 
            id="view-audit-results" 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={animTransitionEnter}
            className="space-y-6 sm:space-y-8 md:space-y-12"
          >
            {auditResult ? (
              <>
                {/* Visual Header Summary */}
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 bg-[#FFDE00]/10 border border-[#FFDE00]/20 px-3.5 py-1.5 text-[#FFDE00] text-xs font-extrabold rounded-full uppercase tracking-wider">
                    <BrandLogo className="w-4.5 h-4.5 shrink-0" />
                    <span>Audit analysis finalized</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white">Your Optimization Report</h1>
                  <p className="text-zinc-400 text-sm max-w-xl mx-auto">
                    We compared your stack config against 48 custom business subscription combinations. Here is exactly where you save.
                  </p>
                </div>

                {/* 1. SAVINGS HERO HEADER BIG CARD */}
                <div id="main-savings-highlight-hero" className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#121214] border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                  {/* Neon radial backdrop shine */}
                  <div className="absolute top-0 left-0 w-44 h-44 bg-[#FFDE00]/5 rounded-full blur-3xl pointer-events-none"></div>

                  {/* Left part - Large savings details */}
                  <div className="md:col-span-2 space-y-4">
                    <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest block">Projected Cost Savings</span>
                    <div className="space-y-1">
                      <h2 className="text-5xl sm:text-7xl font-sans font-black text-[#FFDE00] select-all">
                        {formatCost(auditResult.totalMonthlySavings)}
                        <span className="text-xs text-zinc-400 font-normal tracking-normal uppercase ml-2 inline-block">/ month</span>
                      </h2>
                      <p className="text-zinc-300 font-bold text-base">
                        Potential Annual Windfalls: <span className="text-white decoration-lime-500 underline font-mono text-lg">{formatCost(auditResult.totalAnnualSavings)} / year</span>
                      </p>
                    </div>
                  </div>

                  {/* Middle part - Current spend comparison graph */}
                  <div className="bg-zinc-950/60 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between space-y-4 relative">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-black block">Current monthly spend</span>
                      <span className="text-2xl font-black font-mono text-white">{formatCost(auditResult.currentMonthlySpend)}</span>
                    </div>

                    {/* Simple pure CSS comparison bar chart */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>Optimized reduction ratio:</span>
                        <span className="font-bold text-white font-mono">
                          {auditResult.currentMonthlySpend > 0 
                            ? Math.round((auditResult.totalMonthlySavings / auditResult.currentMonthlySpend) * 100) 
                            : 0}% saved
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-yellow-500 transition-all duration-1000" 
                          style={{ width: `${auditResult.currentMonthlySpend > 0 ? (auditResult.recommendedMonthlySpend / auditResult.currentMonthlySpend) * 100 : 100}%` }}
                        ></div>
                        <div 
                          className="h-full bg-[#FFDE00] transition-all duration-1000 animate-pulse" 
                          style={{ width: `${auditResult.currentMonthlySpend > 0 ? (auditResult.totalMonthlySavings / auditResult.currentMonthlySpend) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Right part - Optimized Target spend */}
                  <div className="bg-zinc-950/60 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between relative">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-black block text-emerald-400">Target recommended spend</span>
                      <span className="text-2xl font-black font-mono text-emerald-400">{formatCost(auditResult.recommendedMonthlySpend)}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 leading-relaxed pt-2 border-t border-zinc-850">
                      All calculated recommendations guarantee your team gets equivalent premium models for your primary write, research, and coding use cases.
                    </div>
                  </div>
                </div>

                {/* 2. HIGH AND LOW HOOKS DYNAMIC CARD */}
                {auditResult.totalMonthlySavings > 500 && (
                  <div id="high-savings-expert-cta" className="bg-[#FFDE00] border-2 border-black p-6 sm:p-8 rounded-3xl text-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-xl shadow-yellow-500/10">
                    <div className="space-y-2 text-center sm:text-left">
                      <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center justify-center sm:justify-start gap-2 text-black">
                        <Coins className="animate-bounce" />
                        <span>Big savings detected.</span>
                      </h4>
                      <p className="text-xs sm:text-sm font-bold text-zinc-900/80 max-w-xl">
                        At over $500 monthly SaaS leakage, you qualify for our Premium Enterprise Review. Get a custom hand-crafted migration mapping matching optimized server integrations.
                      </p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      onClick={() => {
                        const targetLead = document.getElementById("lead-capture-email-form");
                        if (targetLead) targetLead.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-6 py-3.5 bg-black hover:bg-zinc-900 border border-black/10 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg transition-all w-full sm:w-auto shrink-0 text-center cursor-pointer"
                    >
                      Get Expert Recommendations
                    </motion.button>
                  </div>
                )}

                {auditResult.totalMonthlySavings < 100 && (
                  <div id="low-savings-optimized-hook" className="bg-zinc-900/60 border border-zinc-800 p-6 sm:p-8 rounded-3xl text-zinc-300 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="space-y-2 text-center sm:text-left">
                      <h4 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                        <CheckCircle className="text-emerald-400 shrink-0" />
                        <span>You’re spending well.</span>
                      </h4>
                      <p className="text-xs text-zinc-400 max-w-xl">
                        Zero major overlaps detected. Your subscriptions adhere closely to lean usage paradigms. We will alert you whenever new discount thresholds apply to your stack configurations.
                      </p>
                    </div>
                    <div className="text-xs bg-[#FFDE00]/10 text-[#FFDE00] border border-[#FFDE00]/25 px-4 py-2 rounded-xl font-extrabold uppercase">
                      Highly Optimized
                    </div>
                  </div>
                )}

                {/* 3. AI PERSONALISED SUMMARY */}
                <div id="ai-summary-highlight-container" className="bg-gradient-to-r from-zinc-900 to-[#121214] border border-zinc-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden space-y-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FFDE00] shrink-0" />
                    <span className="text-xs font-black uppercase tracking-widest text-[#FFDE00]">Personalized AI Analyst Audit Summary</span>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed max-w-4xl select-all">
                    {auditResult.summary || "Generating your personalized summary recommendations..."}
                  </p>
                  <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-850">
                    Calculations processed instantly using fine-tuned financial directives.
                  </div>
                </div>

                {/* 4. PER-TOOL RECOMMENDATIONS */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Coins className="text-zinc-400" />
                    <span>Breakdown Recommendations per tool</span>
                  </h3>

                  <div className="grid grid-cols-1 gap-4.5">
                    {auditResult.recommendations.map((rec, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.97, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 700, 
                          damping: 28, 
                          delay: Math.min(0.2, i * 0.04) 
                        }}
                        className={`p-5 rounded-2xl border ${
                          rec.monthlySavings > 0 
                            ? "bg-[#181812] border-yellow-500/20 hover:border-yellow-500/30" 
                            : "bg-[#121214]/60 border-zinc-800/80"
                        } flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all`}
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold text-white">{rec.toolName}</span>
                            
                            {rec.monthlySavings > 0 ? (
                              <span className="px-2 py-0.5 bg-red-400/10 text-red-400 text-[9px] font-black uppercase rounded border border-red-450/20">
                                {rec.action} recommended
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase rounded border border-zinc-700/40">
                                optimized
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                            {rec.reason}
                          </p>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 text-sm shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                          {/* Timings / details text */}
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Spend change</span>
                            <span className="font-semibold text-zinc-400 line-through mr-1.5 inline-block">{formatCost(rec.currentSpend)}/mo</span>
                            <span className="font-extrabold text-[#FFDE00] font-mono">{formatCost(rec.recommendedSpend)}/mo</span>
                          </div>

                          <div className="text-left sm:text-right px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <span className="text-[10px] text-zinc-500 uppercase font-black block">Monthly savings</span>
                            <span className="text-sm font-black font-mono text-white">{formatCost(rec.monthlySavings)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 5. LEAD EMAIL CAPTURE FORM */}
                <div id="lead-capture-email-form" className="max-w-2xl mx-auto bg-[#121214] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-[#FFDE00]/5 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="text-center space-y-2">
                    <div className="mx-auto w-10 h-10 bg-[#FFDE00]/10 border border-[#FFDE00]/30 rounded-xl flex items-center justify-center text-[#FFDE00]">
                      <Mail className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Email My Spend Audit Report</h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Receive a secure public PDF-compatible share dashboard link and automated reminders when tool changes apply to your business stack.
                    </p>
                  </div>

                  {leadCollected ? (
                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                      <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-white">Report Emailed Successfully!</h4>
                      <p className="text-xs text-zinc-300">
                        Check your inbox. Standard reports dispatch within 30 seconds via Resend log triggers.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitLead} className="space-y-4">
                      {/* Honeypot field (hidden offscreen to catch boots) */}
                      <div style={{ display: "none" }}>
                        <input 
                          type="text" 
                          name="website" 
                          value={honeypot} 
                          onChange={(e) => setHoneypot(e.target.value)} 
                          placeholder="Leave this empty" 
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Email Capture */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Business Email *</label>
                          <input 
                            required
                            type="email"
                            placeholder="your.name@company.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-[#FFDE00] focus:ring-1 focus:ring-[#FFDE00] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                          />
                        </div>

                        {/* Optional inputs */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Company Name (Optional)</label>
                          <input 
                            type="text"
                            placeholder="Acme Inc."
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-[#FFDE00] focus:ring-1 focus:ring-[#FFDE00] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">My Corporate Role (Optional)</label>
                          <input 
                            type="text"
                            placeholder="Engineering Lead"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-[#FFDE00] focus:ring-1 focus:ring-[#FFDE00] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all"
                          />
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={isCapturingLead}
                        whileHover={!isCapturingLead ? { scale: 1.02 } : {}}
                        className="w-full py-3.5 bg-[#FFDE00] hover:bg-[#ffe524] disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black rounded-2xl text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isCapturingLead ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Dispatching request...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 shrink-0" />
                            <span>Email My Audit Report</span>
                          </>
                        )}
                      </motion.button>
                    </form>
                  )}
                </div>

                {/* 6. SHARE AUDIT CHANNELS SECTION */}
                <div className="border-t border-zinc-800/40 pt-8 max-w-xl mx-auto space-y-4">
                  <h4 className="text-xs font-bold text-center text-zinc-400 uppercase tracking-widest">Share this optimization scorecard</h4>
                  
                  <div className="flex flex-wrap justify-center gap-3">
                    {/* Copy Share Link */}
                    <button
                      onClick={() => handleCopyLink()}
                      className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-[#FFDE00]/40 rounded-2xl text-zinc-200 hover:text-[#FFDE00] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 h-4 text-[#FFDE00]" />
                          <span>Copied link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Public Link</span>
                        </>
                      )}
                    </button>

                    {/* Share on X */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        `theaibuy audited our AI stack subscriptions and found $${auditResult.totalMonthlySavings}/month in overlapping software waste! Create your own 60-second free audit:`
                      )}&url=${encodeURIComponent(`${window.location.origin}/audit/${currentSlug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-[#FFDE00]/40 rounded-2xl text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Share on X</span>
                    </a>

                    {/* Share on LinkedIn */}
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                        `${window.location.origin}/audit/${currentSlug}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-[#FFDE00]/40 rounded-2xl text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </a>
                  </div>
                </div>

                {/* Back button */}
                <div className="text-center pt-4">
                  <button
                    onClick={() => navigateTo("/")}
                    className="text-xs text-zinc-500 hover:text-[#FFDE00] transition-colors flex items-center gap-1.5 mx-auto underline font-semibold"
                  >
                    <span>&larr; Back to landing page to recalculate stack</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-[#121214] border border-zinc-800 rounded-2xl max-w-xl mx-auto space-y-4">
                <p className="text-sm text-zinc-300">No active audit completed in current session scope yet.</p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  onClick={() => navigateTo("/")}
                  className="px-6 py-3 bg-[#FFDE00] hover:bg-[#ffe524] text-black font-black uppercase tracking-wider rounded-2xl text-xs cursor-pointer shadow-md"
                >
                  Create New AI Waste Audit
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: PUBLIC SHAREABLE PAGE (Route: /audit/[slug])      */}
        {/* ========================================================= */}
        {currentPath.startsWith("/audit/") && (
          <div id="view-public-shared-scorecard" className="space-y-6 sm:space-y-8 md:space-y-12 animate-fade-in">
            {isLoadingPublicAudit ? (
              <div className="text-center py-20 space-y-4">
                <RefreshCw className="w-10 h-10 text-[#FFDE00] animate-spin mx-auto" />
                <p className="text-sm text-zinc-400">Downloading company spend portfolio report...</p>
              </div>
            ) : publicAudit ? (
              <>
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-1.5 bg-[#FFDE00]/10 border border-[#FFDE00]/25 px-3.5 py-1 text-[#FFDE00] text-[10px] font-black rounded-full uppercase tracking-wider">
                    <span>Public shareable score view</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                    This AI Stack Could Save <span className="text-[#FFDE00]">{formatCost(publicAudit.totalMonthlySavings)}/month</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 max-w-xl mx-auto">
                    Verified mathematical rule calculations of overlapping multi-user subscription assets. Personalized summaries are listed below. All private viewer emails are redacted.
                  </p>
                </div>

                {/* Savings highlight metrics cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-[#121214] border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-[#FFDE00]/5 rounded-full blur-2xl"></div>

                  {/* Monthly savings widget */}
                  <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850/60 text-center sm:text-left">
                    <span className="text-[10px] text-zinc-500 uppercase font-black block">Monthly savings</span>
                    <span className="text-3xl font-black font-mono text-[#FFDE00]">{formatCost(publicAudit.totalMonthlySavings)}</span>
                  </div>

                  {/* Annual savings widget */}
                  <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850/60 text-center sm:text-left">
                    <span className="text-[10px] text-zinc-500 uppercase font-black block">Annual savings</span>
                    <span className="text-3xl font-black font-mono text-white">{formatCost(publicAudit.totalAnnualSavings)}</span>
                  </div>

                  {/* Team use scale metadata */}
                  <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850/60 text-center sm:text-left sm:col-span-2 md:col-span-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-black block">Primary category case</span>
                    <span className="text-base font-extrabold text-zinc-300 capitalize">
                      {publicAudit.input?.useCase || "Mixed workflows"} (Team size: {publicAudit.input?.teamSize || "Custom"})
                    </span>
                  </div>
                </div>

                {/* Personalized summary box */}
                {publicAudit.result?.summary && (
                  <div className="bg-gradient-to-r from-zinc-900 to-[#121214] border border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-[#FFDE00] w-4.5 h-4.5 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wider text-[#FFDE00]">AI Analyst Key Verdict</span>
                    </div>
                    <p className="text-zinc-300 text-sm leading-relaxed max-w-4xl select-all">
                      {publicAudit.result.summary}
                    </p>
                  </div>
                )}

                {/* Multi-tool listings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider text-[10px] text-zinc-400">Detailed Action Items Per Tool</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {publicAudit.result?.recommendations?.map((rec: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={`p-5 rounded-2xl border ${
                          rec.monthlySavings > 0 ? "bg-[#181812] border-yellow-500/20" : "bg-[#121214]/60 border-zinc-850"
                        } flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}
                      >
                        <div className="space-y-1.5 flex-1 col-span-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold text-white">{rec.toolName}</span>
                            {rec.monthlySavings > 0 && (
                              <span className="px-2 py-0.5 bg-red-400/10 text-red-400 text-[9px] font-black uppercase rounded">
                                {rec.action}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                            {rec.reason}
                          </p>
                        </div>

                        <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-zinc-800">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-zinc-500 uppercase font-black block">Spend value</span>
                            <span className="text-xs text-zinc-400 line-through mr-1.5 inline-block">{formatCost(rec.currentSpend)}/mo</span>
                            <span className="font-extrabold text-[#FFDE00] font-mono">{formatCost(rec.recommendedSpend)}/mo</span>
                          </div>

                          <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-left sm:text-right">
                            <span className="text-[10px] text-zinc-500 uppercase font-black block">Savings</span>
                            <span className="text-sm font-black font-mono text-white">{formatCost(rec.monthlySavings)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Create Own Audit CTA */}
                <div className="bg-[#121214] border border-zinc-800 p-6 sm:p-8 rounded-3xl text-center space-y-6 max-w-xl mx-auto relative overflow-hidden">
                  <div className="flex justify-center">
                    <BrandLogo className="w-12 h-12" />
                  </div>
                  <h3 className="text-lg font-bold text-white">How much budget is leaking across your company AI subscriptions?</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    theaibuy calculations check overlap coding tools, small-team enterprise seat inflation parameters, and variable API mappings instantly for free with zero custom database requirements.
                  </p>
                  <div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      onClick={() => navigateTo("/")}
                      className="px-8 py-3.5 bg-[#FFDE00] hover:bg-[#ffe524] text-black font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all w-full sm:w-auto cursor-pointer text-xs sm:text-sm"
                    >
                      Create Your Own AI Spend Audit
                    </motion.button>
                  </div>
                </div>

                {/* Safe share copy links */}
                <div className="text-center space-y-4 pt-4">
                  <span className="text-[10px] text-zinc-500 uppercase block font-black">Copy report link to share</span>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => handleCopyLink(publicAudit.publicSlug)}
                      className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:text-[#FFDE00] hover:border-[#FFDE00]/40 transition-all flex items-center gap-2"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 o-4 text-[#FFDE00]" />
                          <span>Copied link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy public URL</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => navigateTo("/")}
                      className="px-4 py-2.5 bg-zinc-900 border border-zinc-850 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-all"
                    >
                      &larr; Audit Another Stack
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-[#121214] border border-zinc-800 rounded-3xl max-w-md mx-auto space-y-6">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Audit report not found</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    This public report token identifier is invalid, deleted, or was never cached in the backend server.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  onClick={() => navigateTo("/")}
                  className="px-6 py-3 bg-[#FFDE00] hover:bg-[#ffe524] text-black font-black uppercase tracking-wider rounded-2xl text-xs cursor-pointer shadow-md"
                >
                  Create New AI Spend Audit
                </motion.button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER METRIC STATUS BOTTOM BAR */}
      <footer id="footer-bottom-bar" className="bg-[#09090b]/40 px-4 sm:px-10 py-6 flex flex-col sm:flex-row justify-between items-center text-[10px] border-t border-zinc-800/40 mt-8 sm:mt-12 md:mt-16 gap-4 text-center sm:text-left transition-colors">
        <div className="space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-bold">
            <span className="text-white select-none font-black">the<span className="text-[#FFDE00]">ai</span>buy</span>
            <span className="text-zinc-500 font-normal">© 2026 • Save more.</span>
          </div>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">
            Optimized AI Spend & Subscription Audit Tool
          </p>
        </div>
      </footer>
    </div>
  );
}
