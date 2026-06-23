"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Bell,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  FileCheck2,
  Flag,
  Home as HomeIcon,
  LogOut,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
  UserRound,
  WalletCards,
  type LucideIcon
} from "lucide-react";
import {
  deleteLocalAccount,
  registerLocalAccount,
  updateLocalAccountPassword,
  updateLocalAccountProfile,
  verifyLocalLogin,
  type LocalAccount,
  type LocalUserRole
} from "@/lib/client-auth";
import { notifications, taskCards } from "@/lib/mock-data";
import { Stat } from "@/components/Stat";
import { TaskCard } from "@/components/TaskCard";

type NavItem = "Dashboard" | "Tasks" | "Messages" | "Payments" | "Alerts" | "Account" | "Profile";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: LocalUserRole;
  isStudent: boolean;
  dateOfBirth?: string;
  documents: { identity: string; eligibility: string };
  verification: VerificationState;
  ratingAverage: number;
  ratingCount: number;
};

type TaskItem = (typeof taskCards)[number] & {
  id: string;
  ownerEmail: string;
  description?: string;
};

type ChatMessage = {
  id: string;
  from: string;
  body: string;
  mine: boolean;
  createdAt: string;
};

type Conversation = {
  id: string;
  taskId: string;
  taskTitle: string;
  participantEmail: string;
  participantName: string;
  blocked: boolean;
  reported: boolean;
  rating?: number;
  review?: string;
  updatedAt: string;
  messages: ChatMessage[];
};

type PaymentStatus = "awaiting_deposit" | "held" | "ready_release" | "released";

type PaymentRecord = {
  id: string;
  taskId: string;
  taskTitle: string;
  participantEmail: string;
  participantName: string;
  amount: number;
  status: PaymentStatus;
};

type VerificationState = {
  identity: boolean;
  eligibility: boolean;
};

type WorkspaceSnapshot = {
  tasks: TaskItem[];
  alerts: string[];
  payments: PaymentRecord[];
  conversations: Conversation[];
  documents: { identity: string; eligibility: string };
  verification: VerificationState;
};

const seededOwners = [
  { name: "Mina", email: "mina@verifiedhandy.local" },
  { name: "Oskar", email: "oskar@verifiedhandy.local" },
  { name: "Lea", email: "lea@verifiedhandy.local" }
];

const starterTasks: TaskItem[] = taskCards.map((task, index) => ({
  ...task,
  id: `task-${index + 1}`,
  ownerEmail: seededOwners[index]?.email ?? "poster@verifiedhandy.local"
}));

const mainNav: Array<{ id: Exclude<NavItem, "Profile">; label: string; icon: LucideIcon }> = [
  { id: "Dashboard", label: "Home", icon: HomeIcon },
  { id: "Tasks", label: "Tasks", icon: BriefcaseBusiness },
  { id: "Messages", label: "Messages", icon: MessageSquareText },
  { id: "Payments", label: "Payments", icon: CreditCard },
  { id: "Alerts", label: "Alerts", icon: Bell },
  { id: "Account", label: "Account", icon: UserRound }
];

const workspaceKey = (email: string) => `verified-handy.workspace.v3.${email}`;

function accountToProfile(account: LocalAccount): UserProfile {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone,
    role: account.role,
    isStudent: account.isStudent,
    dateOfBirth: account.dateOfBirth ?? "",
    documents: account.documents ?? { identity: "", eligibility: "" },
    verification: account.verification ?? { identity: false, eligibility: false },
    ratingAverage: account.ratingAverage,
    ratingCount: account.ratingCount
  };
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VH"
  );
}

function conversationIdFor(task: TaskItem, userEmail: string) {
  return `${task.id}:${task.ownerEmail}:${userEmail}`;
}

function paymentLabel(status: PaymentStatus) {
  switch (status) {
    case "awaiting_deposit":
      return "Awaiting deposit";
    case "held":
      return "In escrow";
    case "ready_release":
      return "Ready to release";
    case "released":
      return "Paid";
  }
}

function paymentAction(status: PaymentStatus) {
  switch (status) {
    case "awaiting_deposit":
      return "Fund escrow";
    case "held":
      return "Mark complete";
    case "ready_release":
      return "Release payment";
    case "released":
      return "Paid";
  }
}

function nextPaymentStatus(status: PaymentStatus): PaymentStatus {
  switch (status) {
    case "awaiting_deposit":
      return "held";
    case "held":
      return "ready_release";
    case "ready_release":
      return "released";
    case "released":
      return "released";
  }
}

function taskStatusForPayment(status: PaymentStatus) {
  switch (status) {
    case "awaiting_deposit":
      return "Offer sent";
    case "held":
      return "In escrow";
    case "ready_release":
      return "Completed";
    case "released":
      return "Paid";
  }
}

function loadWorkspace(email: string): WorkspaceSnapshot | null {
  try {
    const raw = window.localStorage.getItem(workspaceKey(email));
    return raw ? (JSON.parse(raw) as WorkspaceSnapshot) : null;
  } catch {
    return null;
  }
}

function saveWorkspace(email: string, snapshot: WorkspaceSnapshot) {
  window.localStorage.setItem(workspaceKey(email), JSON.stringify(snapshot));
}

function PageHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

function Section({
  title,
  action,
  children
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      {title || action ? (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          {title ? <h2 className="font-bold text-ink">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

function EmptyState({
  title,
  actionLabel,
  onAction
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {actionLabel && onAction ? (
          <button onClick={onAction} className="focus-ring mt-3 rounded-md bg-trust px-4 py-2 text-sm font-bold text-white">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    good: "bg-mint text-lagoon",
    warn: "bg-amber/30 text-ink"
  };
  return <span className={`rounded-md px-2 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "Both" as LocalUserRole,
    isStudent: false
  });
  const [activeNav, setActiveNav] = useState<NavItem>("Dashboard");
  const [previousNav, setPreviousNav] = useState<NavItem>("Tasks");
  const [workspaceLoadedFor, setWorkspaceLoadedFor] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>(starterTasks);
  const [alerts, setAlerts] = useState(notifications);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documents, setDocuments] = useState({ identity: "", eligibility: "" });
  const [verification, setVerification] = useState<VerificationState>({
    identity: false,
    eligibility: false
  });
  const [radius, setRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProfileEmail, setSelectedProfileEmail] = useState("");
  const [activeConversationId, setActiveConversationId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [ratingDraft, setRatingDraft] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [offerTask, setOfferTask] = useState<TaskItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    role: "Both" as LocalUserRole,
    isStudent: false,
    currentPassword: "",
    newPassword: "",
    deleteConfirm: ""
  });
  const [accountNotice, setAccountNotice] = useState("");
  const [reportDraft, setReportDraft] = useState("");

  const verificationComplete = verification.identity && verification.eligibility;
  const eligibilityLabel = profile?.isStudent ? "University enrollment" : "Work permit";
  const categories = useMemo(() => ["All", ...Array.from(new Set(tasks.map((task) => task.category)))], [tasks]);
  const visibleTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      const inRadius = Number.parseFloat(task.distance) <= radius;
      const inCategory = categoryFilter === "All" || task.category === categoryFilter;
      const matches =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.location.toLowerCase().includes(query) ||
        task.requester.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query);
      return inRadius && inCategory && matches;
    });
  }, [tasks, radius, searchQuery, categoryFilter]);
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0];
  const postedByMe = profile ? tasks.filter((task) => task.ownerEmail === profile.email).length : 0;
  const heldTotal = payments
    .filter((payment) => payment.status === "held" || payment.status === "ready_release")
    .reduce((total, payment) => total + payment.amount, 0);
  const selectedTask = selectedProfileEmail ? tasks.find((task) => task.ownerEmail === selectedProfileEmail) : undefined;
  const selectedConversation = selectedProfileEmail
    ? conversations.find((conversation) => conversation.participantEmail === selectedProfileEmail)
    : undefined;
  const selectedName =
    selectedProfileEmail === profile?.email
      ? profile.name
      : selectedTask?.requester ?? selectedConversation?.participantName ?? "User";
  const selectedTasks = selectedProfileEmail ? tasks.filter((task) => task.ownerEmail === selectedProfileEmail) : [];
  const selectedConversations = selectedProfileEmail
    ? conversations.filter((conversation) => conversation.participantEmail === selectedProfileEmail)
    : [];
  const selectedReviews = selectedConversations.filter((conversation) => conversation.rating);
  const selectedRating =
    selectedProfileEmail === profile?.email
      ? profile.ratingAverage
      : selectedReviews.length
        ? selectedReviews.reduce((total, conversation) => total + (conversation.rating ?? 0), 0) / selectedReviews.length
        : Number(selectedTask?.rating) || 0;

  useEffect(() => {
    if (!profile || workspaceLoadedFor !== profile.email) return;
    saveWorkspace(profile.email, { tasks, alerts, payments, conversations, documents, verification });
  }, [profile, workspaceLoadedFor, tasks, alerts, payments, conversations, documents, verification]);

  function hydrateWorkspace(user: UserProfile) {
    const saved = loadWorkspace(user.email);
    setTasks(saved?.tasks?.length ? saved.tasks : starterTasks);
    setAlerts(saved?.alerts ?? notifications);
    setPayments(saved?.payments ?? []);
    setConversations(saved?.conversations ?? []);
    setDocuments(user.documents.identity || user.documents.eligibility ? user.documents : saved?.documents ?? { identity: "", eligibility: "" });
    setVerification(user.verification.identity || user.verification.eligibility ? user.verification : saved?.verification ?? { identity: false, eligibility: false });
    setActiveConversationId(saved?.conversations?.[0]?.id ?? "");
    setWorkspaceLoadedFor(user.email);
  }

  function navigate(item: NavItem) {
    if (activeNav !== "Profile") setPreviousNav(activeNav);
    setActiveNav(item);
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthPending(true);
    setAuthNotice("");
    try {
      if (authForm.password.length < 8) {
        setAuthNotice("Password must be at least 8 characters.");
        return;
      }
      const result =
        authMode === "signup"
          ? await registerLocalAccount({
              name: authForm.name,
              email: authForm.email,
              phone: authForm.phone,
              password: authForm.password,
              role: authForm.role,
              isStudent: authForm.isStudent
            })
          : await verifyLocalLogin(authForm.email, authForm.password);
      if (!result.ok) {
        setAuthNotice(result.error);
        return;
      }
      const user = accountToProfile(result.account);
      hydrateWorkspace(user);
      setProfile(user);
      setProfileDraft({
        name: user.name,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth ?? "",
        role: user.role,
        isStudent: user.isStudent,
        currentPassword: "",
        newPassword: "",
        deleteConfirm: ""
      });
      setActiveNav("Dashboard");
    } finally {
      setAuthPending(false);
    }
  }

  function logout() {
    setProfile(null);
    setWorkspaceLoadedFor("");
    setAuthForm((form) => ({ ...form, password: "" }));
    setActiveNav("Dashboard");
  }

  function openUserProfile(email: string, from: NavItem = activeNav) {
    if (email === profile?.email) {
      navigate("Account");
      return;
    }
    setSelectedProfileEmail(email);
    setPreviousNav(from);
    setActiveNav("Profile");
  }

  function openAccountSettings() {
    if (!profile) return;
    setProfileDraft({
      name: profile.name,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth ?? "",
      role: profile.role,
      isStudent: profile.isStudent,
      currentPassword: "",
      newPassword: "",
      deleteConfirm: ""
    });
    setAccountNotice("");
    setIsEditOpen(true);
  }

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const data = new FormData(event.currentTarget);
    const budget = String(data.get("budget") || "60").replace(/[^\d]/g, "") || "60";
    const task: TaskItem = {
      id: crypto.randomUUID(),
      title: String(data.get("title") || "").trim(),
      description: String(data.get("description") || "").trim(),
      category: String(data.get("category") || "Repairs"),
      location: String(data.get("location") || "").trim(),
      distance: "1.0 km",
      price: `EUR ${budget}`,
      status: "Open",
      urgency: String(data.get("urgency") || "Flexible"),
      requester: profile.name,
      rating: profile.ratingCount ? profile.ratingAverage.toFixed(1) : "New",
      ownerEmail: profile.email
    };
    setTasks((items) => [task, ...items]);
    setAlerts((items) => [`Task posted: ${task.title}`, ...items]);
    setIsPostOpen(false);
    setActiveNav("Tasks");
  }

  function ensureConversation(task: TaskItem, firstMessage: ChatMessage) {
    if (!profile) return;
    const id = conversationIdFor(task, profile.email);
    setConversations((items) => {
      const existing = items.find((conversation) => conversation.id === id);
      if (existing) {
        return items.map((conversation) =>
          conversation.id === id
            ? { ...conversation, messages: [...conversation.messages, firstMessage], updatedAt: firstMessage.createdAt }
            : conversation
        );
      }
      return [
        {
          id,
          taskId: task.id,
          taskTitle: task.title,
          participantEmail: task.ownerEmail,
          participantName: task.requester,
          blocked: false,
          reported: false,
          updatedAt: firstMessage.createdAt,
          messages: [
            {
              id: crypto.randomUUID(),
              from: task.requester,
              body: `Thanks for your interest in "${task.title}".`,
              mine: false,
              createdAt: firstMessage.createdAt
            },
            firstMessage
          ]
        },
        ...items
      ];
    });
    setActiveConversationId(id);
  }

  function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !offerTask || !verificationComplete) return;
    const data = new FormData(event.currentTarget);
    const amount = Number(String(data.get("amount") || "0").replace(/[^\d]/g, ""));
    const note = String(data.get("note") || "").trim();
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      from: profile.name,
      body: `Offer: EUR ${amount}. ${note}`,
      mine: true,
      createdAt: new Date().toISOString()
    };
    ensureConversation(offerTask, message);
    setTasks((items) => items.map((task) => (task.id === offerTask.id ? { ...task, status: "Offer sent" } : task)));
    setPayments((items) => {
      const existing = items.find((payment) => payment.taskId === offerTask.id);
      if (existing) return items.map((payment) => (payment.taskId === offerTask.id ? { ...payment, amount } : payment));
      return [
        {
          id: crypto.randomUUID(),
          taskId: offerTask.id,
          taskTitle: offerTask.title,
          participantEmail: offerTask.ownerEmail,
          participantName: offerTask.requester,
          amount,
          status: "awaiting_deposit"
        },
        ...items
      ];
    });
    setAlerts((items) => [`Offer sent to ${offerTask.requester}`, ...items]);
    setOfferTask(null);
    setActiveNav("Messages");
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !activeConversation || !chatInput.trim() || activeConversation.blocked) return;
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      from: profile.name,
      body: chatInput.trim(),
      mine: true,
      createdAt: new Date().toISOString()
    };
    setConversations((items) =>
      items.map((conversation) =>
        conversation.id === activeConversation.id
          ? { ...conversation, messages: [...conversation.messages, message], updatedAt: message.createdAt }
          : conversation
      )
    );
    setChatInput("");
  }

  function updateConversation(id: string, patch: Partial<Conversation>) {
    setConversations((items) => items.map((conversation) => (conversation.id === id ? { ...conversation, ...patch } : conversation)));
  }

  function deleteConversation(id: string) {
    const remaining = conversations.filter((conversation) => conversation.id !== id);
    setConversations(remaining);
    setActiveConversationId(remaining[0]?.id ?? "");
  }

  function submitRating(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeConversation) return;
    updateConversation(activeConversation.id, { rating: ratingDraft, review: ratingComment.trim() });
    setRatingComment("");
  }

  function advancePayment(payment: PaymentRecord) {
    const status = nextPaymentStatus(payment.status);
    setPayments((items) => items.map((item) => (item.id === payment.id ? { ...item, status } : item)));
    setTasks((items) => items.map((task) => (task.id === payment.taskId ? { ...task, status: taskStatusForPayment(status) } : task)));
    setAlerts((items) => [`${payment.taskTitle}: ${paymentLabel(status)}`, ...items]);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setAccountNotice("");
    const profilePatch = {
      name: profileDraft.name.trim(),
      phone: profileDraft.phone.trim(),
      dateOfBirth: profileDraft.dateOfBirth,
      role: profileDraft.role,
      isStudent: profileDraft.isStudent
    };
    const updated = { ...profile, ...profilePatch };
    setProfile(updated);
    updateLocalAccountProfile(profile.email, profilePatch);
    setTasks((items) => items.map((task) => (task.ownerEmail === profile.email ? { ...task, requester: updated.name } : task)));

    if (profileDraft.currentPassword || profileDraft.newPassword) {
      const result = await updateLocalAccountPassword(profile.email, profileDraft.currentPassword, profileDraft.newPassword);
      if (!result.ok) {
        setAccountNotice(result.error);
        return;
      }
    }

    setProfileDraft((draft) => ({ ...draft, currentPassword: "", newPassword: "" }));
    setAccountNotice("Profile saved.");
    setIsEditOpen(false);
  }

  function deleteMyAccount() {
    if (!profile || profileDraft.deleteConfirm !== "DELETE") return;
    deleteLocalAccount(profile.email);
    window.localStorage.removeItem(workspaceKey(profile.email));
    setProfile(null);
    setWorkspaceLoadedFor("");
    setSelectedProfileEmail("");
    setProfileDraft({
      name: "",
      phone: "",
      dateOfBirth: "",
      role: "Both",
      isStudent: false,
      currentPassword: "",
      newPassword: "",
      deleteConfirm: ""
    });
    setAuthForm((form) => ({ ...form, password: "" }));
    setActiveNav("Dashboard");
    setIsEditOpen(false);
  }

  function submitProfileReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportDraft.trim()) return;
    setAlerts((items) => [`Report submitted: ${reportDraft.trim()}`, ...items]);
    setReportDraft("");
    setAccountNotice("Thanks. Your report was saved in notifications for this prototype.");
  }

  function saveDocumentVerification(type: keyof VerificationState, fileName: string) {
    if (!profile) return;
    const nextDocuments = { ...documents, [type]: fileName };
    const nextVerification = { ...verification, [type]: true };
    setDocuments(nextDocuments);
    setVerification(nextVerification);
    setProfile((user) => (user ? { ...user, documents: nextDocuments, verification: nextVerification } : user));
    updateLocalAccountProfile(profile.email, { documents: nextDocuments, verification: nextVerification });
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-paper">
        <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_420px]">
          <section>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-trust text-white">
                <ShieldCheck size={25} />
              </span>
              <div>
                <p className="text-2xl font-bold text-ink">Verified Handy</p>
                <p className="text-sm text-slate-500">Trusted help nearby</p>
              </div>
            </div>
            <h1 className="mt-10 max-w-xl text-4xl font-bold leading-tight text-ink sm:text-5xl">Get everyday tasks done safely.</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
              Find trusted local help or earn money completing nearby tasks.
            </p>
            <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
              {["Verified users", "Secure payments", "Local tasks"].map((item, index) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-mint text-sm font-bold text-lagoon">{index + 1}</span>
                  <p className="mt-3 text-sm font-semibold text-ink">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              {(["signup", "login"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={authMode === mode}
                  onClick={() => {
                    setAuthMode(mode);
                    setAuthNotice("");
                  }}
                  className={`focus-ring rounded-md px-3 py-2 text-sm font-bold ${
                    authMode === mode ? "bg-white text-ink shadow-sm" : "text-slate-500"
                  }`}
                >
                  {mode === "signup" ? "Create account" : "Sign in"}
                </button>
              ))}
            </div>
            <form onSubmit={handleAuthSubmit} className="mt-5 grid gap-3">
              {authMode === "signup" ? (
                <>
                  <input required value={authForm.name} onChange={(event) => setAuthForm((form) => ({ ...form, name: event.target.value }))} className="focus-ring rounded-md border border-slate-200 px-3 py-3" placeholder="Full name" />
                  <input required value={authForm.phone} onChange={(event) => setAuthForm((form) => ({ ...form, phone: event.target.value }))} className="focus-ring rounded-md border border-slate-200 px-3 py-3" placeholder="Phone number" />
                </>
              ) : null}
              <input required type="email" value={authForm.email} onChange={(event) => setAuthForm((form) => ({ ...form, email: event.target.value }))} className="focus-ring rounded-md border border-slate-200 px-3 py-3" placeholder="Email" />
              <div className="flex rounded-md border border-slate-200">
                <input required type={showPassword ? "text" : "password"} value={authForm.password} onChange={(event) => setAuthForm((form) => ({ ...form, password: event.target.value }))} className="min-w-0 flex-1 rounded-md px-3 py-3 outline-none" placeholder="Password" />
                <button type="button" onClick={() => setShowPassword((shown) => !shown)} className="focus-ring grid w-12 place-items-center" aria-label="Toggle password">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {authMode === "signup" ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Client", "Doer", "Both"] as const).map((role) => (
                      <button key={role} type="button" onClick={() => setAuthForm((form) => ({ ...form, role }))} className={`focus-ring rounded-md border px-3 py-2 text-sm font-semibold ${authForm.role === role ? "border-trust bg-trust text-white" : "border-slate-200 text-slate-600"}`}>
                        {role}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
                    <input type="checkbox" checked={authForm.isStudent} onChange={(event) => setAuthForm((form) => ({ ...form, isStudent: event.target.checked }))} className="accent-lagoon" />
                    I am a student
                  </label>
                </>
              ) : null}
              <button type="submit" disabled={authPending} className="focus-ring rounded-md bg-trust px-4 py-3 font-bold text-white transition hover:bg-lagoon disabled:bg-slate-300">
                {authPending ? "Please wait..." : authMode === "signup" ? "Create account" : "Sign in"}
              </button>
              {authNotice ? <p className="rounded-md bg-mint px-3 py-2 text-sm font-semibold text-lagoon">{authNotice}</p> : null}
            </form>
          </section>
        </div>
      </main>
    );
  }

  const pageTitles: Record<NavItem, string> = {
    Dashboard: "Home",
    Tasks: "Find tasks",
    Messages: "Messages",
    Payments: "Payments",
    Alerts: "Notifications",
    Account: "Account",
    Profile: selectedName
  };

  return (
    <div className="min-h-screen bg-paper lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-trust px-4 py-5 text-white lg:flex">
        <button onClick={() => navigate("Dashboard")} className="flex items-center gap-3 px-2 text-left">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
            <ShieldCheck size={22} />
          </span>
          <span>
            <span className="block text-lg font-bold">Verified Handy</span>
            <span className="block text-xs text-white/60">Trusted local help</span>
          </span>
        </button>
        <nav className="mt-8 space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id || (activeNav === "Profile" && previousNav === item.id);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`focus-ring flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold ${
                  active ? "bg-white text-trust" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
                {item.id === "Alerts" && alerts.length ? <span className="ml-auto rounded-full bg-amber px-2 py-0.5 text-xs text-ink">{alerts.length}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-lg bg-white/10 p-3">
          <button onClick={() => navigate("Account")} className="flex w-full items-center gap-3 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-sm font-bold text-trust">{initials(profile.name)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{profile.name}</span>
              <span className="block truncate text-xs text-white/60">{verificationComplete ? "Verified" : "Verification pending"}</span>
            </span>
            <ChevronRight size={16} />
          </button>
          <button onClick={logout} className="focus-ring mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-trust text-white lg:hidden">
              <ShieldCheck size={21} />
            </span>
            <div>
              <p className="font-bold text-ink">{pageTitles[activeNav]}</p>
              <p className="text-xs text-slate-500">{profile.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("Alerts")} className="focus-ring relative grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white" aria-label="Notifications">
              <Bell size={18} />
              {alerts.length ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-clay" /> : null}
            </button>
            <button onClick={() => setIsPostOpen(true)} className="focus-ring inline-flex items-center gap-2 rounded-md bg-lagoon px-3 py-2 text-sm font-bold text-white">
              <Plus size={17} /> <span className="hidden sm:inline">Post task</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:pb-8">
        {activeNav === "Dashboard" ? (
          <div className="space-y-6">
            <PageHeader title={`Welcome, ${profile.name.split(" ")[0]}`} subtitle="Here is what needs your attention." />
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat icon={BriefcaseBusiness} label="My tasks" value={String(postedByMe)} tone="trust" />
              <Stat icon={WalletCards} label="In escrow" value={`EUR ${heldTotal}`} tone="lagoon" />
              <Stat icon={MessageSquareText} label="Conversations" value={String(conversations.length)} tone="amber" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <Section title="Account setup" action={<StatusBadge tone={verificationComplete ? "good" : "warn"}>{verificationComplete ? "Complete" : "Action needed"}</StatusBadge>}>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${verification.identity ? "bg-lagoon text-white" : "bg-slate-100 text-slate-500"}`}>
                      {verification.identity ? <Check size={17} /> : <Upload size={17} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">Identity document</p>
                      <p className="truncate text-sm text-slate-500">{documents.identity || "National ID or passport"}</p>
                    </div>
                    {!verification.identity ? (
                      <label className="focus-ring cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">
                        Upload
                        <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          saveDocumentVerification("identity", file.name);
                        }} />
                      </label>
                    ) : null}
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex items-start gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${verification.eligibility ? "bg-lagoon text-white" : "bg-slate-100 text-slate-500"}`}>
                      {verification.eligibility ? <Check size={17} /> : <FileCheck2 size={17} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{eligibilityLabel}</p>
                      <p className="truncate text-sm text-slate-500">{documents.eligibility || "Required document"}</p>
                    </div>
                    {!verification.eligibility ? (
                      <label className="focus-ring cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">
                        Upload
                        <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          saveDocumentVerification("eligibility", file.name);
                        }} />
                      </label>
                    ) : null}
                  </div>
                </div>
              </Section>
              <Section title="Recent activity">
                <div className="space-y-2">
                  {alerts.slice(0, 4).map((alert) => (
                    <button key={alert} onClick={() => navigate("Alerts")} className="focus-ring flex w-full items-center gap-3 rounded-md px-2 py-3 text-left hover:bg-slate-50">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-lagoon" />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{alert}</span>
                      <ChevronRight size={15} className="text-slate-400" />
                    </button>
                  ))}
                  {!alerts.length ? <p className="py-6 text-center text-sm text-slate-500">You are all caught up.</p> : null}
                </div>
              </Section>
            </div>
          </div>
        ) : null}

        {activeNav === "Tasks" ? (
          <div className="space-y-6">
            <PageHeader title="Find tasks" subtitle={`${visibleTasks.length} tasks within ${radius} km`} action={
              <button onClick={() => setShowFilters((value) => !value)} className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold">
                <SlidersHorizontal size={16} /> Filters
              </button>
            } />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="focus-ring w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-3" placeholder="Search tasks" />
              </div>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="focus-ring rounded-md border border-slate-200 bg-white px-3 py-2">
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
            {showFilters ? (
              <Section title="Distance">
                <label className="text-sm font-semibold text-slate-700" htmlFor="radius">Within {radius} km</label>
                <input id="radius" type="range" min="5" max="15" step="5" value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="mt-3 w-full accent-lagoon" />
              </Section>
            ) : null}
            {visibleTasks.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMakeOffer={() => openUserProfile(task.ownerEmail, "Tasks")}
                    onViewProfile={() => openUserProfile(task.ownerEmail, "Tasks")}
                    actionLabel={task.ownerEmail === profile.email ? "Account" : "View profile"}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No tasks match your filters" actionLabel="Clear filters" onAction={() => {
                setSearchQuery("");
                setCategoryFilter("All");
                setRadius(15);
              }} />
            )}
          </div>
        ) : null}

        {activeNav === "Account" ? (
          <div className="space-y-6">
            <PageHeader
              title="Account"
              subtitle={profile.email}
              action={
                <button onClick={openAccountSettings} className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold">
                  <Pencil size={16} /> Edit
                </button>
              }
            />
            <Section>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="grid h-20 w-20 place-items-center rounded-lg bg-mint text-2xl font-bold text-lagoon">{initials(profile.name)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-ink">{profile.name}</h2>
                    <StatusBadge tone={verificationComplete ? "good" : "warn"}>{verificationComplete ? "Documents verified" : "Documents pending"}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{profile.role} account</p>
                  <p className="mt-1 text-sm text-slate-500">{profile.dateOfBirth ? `Born ${profile.dateOfBirth}` : "Date of birth not added"}</p>
                </div>
              </div>
            </Section>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat icon={BriefcaseBusiness} label="Posted tasks" value={String(postedByMe)} tone="trust" />
              <Stat icon={MessageSquareText} label="Conversations" value={String(conversations.length)} tone="lagoon" />
              <Stat icon={Star} label="Reviews" value={String(profile.ratingCount)} tone="amber" />
            </div>
            <Section title="Account details">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Name</p>
                  <p className="mt-1 font-semibold text-ink">{profile.name}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Phone</p>
                  <p className="mt-1 font-semibold text-ink">{profile.phone}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Date of birth</p>
                  <p className="mt-1 font-semibold text-ink">{profile.dateOfBirth || "Not added"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Role</p>
                  <p className="mt-1 font-semibold text-ink">{profile.role}</p>
                </div>
              </div>
            </Section>
            <Section title="Documents">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">Identity document</p>
                    <StatusBadge tone={verification.identity ? "good" : "warn"}>{verification.identity ? "Uploaded" : "Needed"}</StatusBadge>
                  </div>
                  <p className="mt-2 truncate text-sm text-slate-500">{documents.identity || "National ID or passport"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{eligibilityLabel}</p>
                    <StatusBadge tone={verification.eligibility ? "good" : "warn"}>{verification.eligibility ? "Uploaded" : "Needed"}</StatusBadge>
                  </div>
                  <p className="mt-2 truncate text-sm text-slate-500">{documents.eligibility || "Required document"}</p>
                </div>
              </div>
            </Section>
            <Section title="Report or request">
              <form onSubmit={submitProfileReport} className="grid gap-3">
                <textarea value={reportDraft} onChange={(event) => setReportDraft(event.target.value)} className="focus-ring min-h-24 rounded-md border border-slate-200 px-3 py-2" placeholder="Describe what is missing or broken" />
                <button className="focus-ring w-fit rounded-md bg-trust px-3 py-2 text-sm font-bold text-white">Submit report</button>
                {accountNotice ? <p className="text-sm font-semibold text-lagoon">{accountNotice}</p> : null}
              </form>
            </Section>
          </div>
        ) : null}

        {activeNav === "Profile" && selectedProfileEmail ? (
          <div className="space-y-6">
            <PageHeader
              title={selectedName}
              subtitle={selectedProfileEmail}
              action={
                <button onClick={() => navigate(previousNav)} className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold">
                  <ArrowLeft size={16} /> Back
                </button>
              }
            />
            <Section>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="grid h-20 w-20 place-items-center rounded-lg bg-mint text-2xl font-bold text-lagoon">{initials(selectedName)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-ink">{selectedName}</h2>
                    <StatusBadge tone={verificationComplete ? "good" : "warn"}>{verificationComplete ? "Documents verified" : "Documents pending"}</StatusBadge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                    <Star size={16} className="fill-amber text-amber" /> {selectedRating ? selectedRating.toFixed(1) : "No rating yet"}
                  </p>
                  {selectedProfileEmail === profile.email ? (
                    <p className="mt-1 text-sm text-slate-500">
                      {profile.dateOfBirth ? `Born ${profile.dateOfBirth}` : "Date of birth not added"}
                    </p>
                  ) : null}
                </div>
                {selectedProfileEmail === profile.email ? (
                  <button onClick={openAccountSettings} className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">
                    <Pencil size={16} /> Edit profile
                  </button>
                ) : null}
              </div>
            </Section>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat icon={BriefcaseBusiness} label="Posted tasks" value={String(selectedTasks.length)} tone="trust" />
              <Stat icon={MessageSquareText} label="Jobs together" value={String(selectedConversations.length)} tone="lagoon" />
              <Stat icon={Star} label="Reviews" value={String(selectedReviews.length)} tone="amber" />
            </div>
            <Section title="Task history">
              <div className="space-y-3">
                {selectedTasks.length ? selectedTasks.map((task) => {
                  const own = task.ownerEmail === profile.email;
                  return (
                    <article key={task.id} className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-ink">{task.title}</p>
                          <StatusBadge>{task.status}</StatusBadge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{task.category} · {task.location} · {task.urgency}</p>
                        {task.description ? <p className="mt-2 text-sm text-slate-600">{task.description}</p> : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <p className="font-bold text-trust">{task.price}</p>
                        <button disabled={own || !verificationComplete} onClick={() => setOfferTask(task)} className="focus-ring rounded-md bg-trust px-3 py-2 text-sm font-bold text-white disabled:bg-slate-300">
                          {own ? "Your task" : verificationComplete ? "Make offer" : "Verify first"}
                        </button>
                      </div>
                    </article>
                  );
                }) : <EmptyState title="No task history" />}
              </div>
            </Section>
            {selectedReviews.length ? (
              <Section title="Your reviews">
                <div className="space-y-3">
                  {selectedReviews.map((conversation) => (
                    <article key={conversation.id} className="rounded-lg bg-slate-50 p-4">
                      <p className="flex items-center gap-1 font-bold text-ink"><Star size={16} className="fill-amber text-amber" /> {conversation.rating}/5</p>
                      <p className="mt-2 text-sm text-slate-600">{conversation.review || "No written review."}</p>
                    </article>
                  ))}
                </div>
              </Section>
            ) : null}
          </div>
        ) : null}

        {activeNav === "Messages" ? (
          <div className="space-y-6">
            <PageHeader title="Messages" subtitle={`${conversations.length} conversations`} />
            {!conversations.length ? (
              <EmptyState title="No messages yet" actionLabel="Browse tasks" onAction={() => navigate("Tasks")} />
            ) : (
              <div className="grid min-h-[560px] overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid-cols-[260px_1fr]">
                <div className="border-b border-slate-200 bg-slate-50 p-2 lg:border-b-0 lg:border-r">
                  {conversations.map((conversation) => (
                    <button key={conversation.id} onClick={() => setActiveConversationId(conversation.id)} className={`focus-ring mb-1 w-full rounded-md px-3 py-3 text-left ${activeConversation?.id === conversation.id ? "bg-white shadow-sm" : "hover:bg-white/70"}`}>
                      <p className="truncate text-sm font-bold text-ink">{conversation.participantName}</p>
                      <p className="truncate text-xs text-slate-500">{conversation.taskTitle}</p>
                    </button>
                  ))}
                </div>
                {activeConversation ? (
                  <div className="flex min-h-[500px] flex-col">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                      <button onClick={() => openUserProfile(activeConversation.participantEmail, "Messages")} className="focus-ring text-left">
                        <p className="font-bold text-ink">{activeConversation.participantName}</p>
                        <p className="text-xs text-slate-500">{activeConversation.taskTitle}</p>
                      </button>
                      <details className="relative">
                        <summary className="focus-ring cursor-pointer list-none rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">Actions</summary>
                        <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-soft">
                          <button onClick={() => updateConversation(activeConversation.id, { blocked: !activeConversation.blocked })} className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50"><Ban size={15} /> {activeConversation.blocked ? "Unblock" : "Block"}</button>
                          <button onClick={() => updateConversation(activeConversation.id, { reported: true })} className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50"><Flag size={15} /> Report</button>
                          <button onClick={() => deleteConversation(activeConversation.id)} className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-clay hover:bg-slate-50"><Trash2 size={15} /> Delete</button>
                        </div>
                      </details>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                      {activeConversation.messages.map((message) => (
                        <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${message.mine ? "bg-trust text-white" : "bg-slate-100 text-ink"}`}>
                            <p>{message.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 p-3">
                      <form onSubmit={sendMessage} className="flex gap-2">
                        <input value={chatInput} disabled={activeConversation.blocked} onChange={(event) => setChatInput(event.target.value)} className="focus-ring min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 disabled:bg-slate-100" placeholder={activeConversation.blocked ? "Conversation blocked" : "Write a message"} />
                        <button disabled={activeConversation.blocked} className="focus-ring rounded-md bg-lagoon px-4 py-2 font-bold text-white disabled:bg-slate-300">Send</button>
                      </form>
                      <details className="mt-3">
                        <summary className="focus-ring cursor-pointer text-sm font-semibold text-trust">Rate this user</summary>
                        <form onSubmit={submitRating} className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} type="button" onClick={() => setRatingDraft(star)} className="focus-ring rounded-md p-1 text-amber" aria-label={`${star} stars`}>
                                <Star size={22} className={star <= ratingDraft ? "fill-amber" : ""} />
                              </button>
                            ))}
                          </div>
                          <textarea value={ratingComment} onChange={(event) => setRatingComment(event.target.value)} className="focus-ring min-h-20 rounded-md border border-slate-200 px-3 py-2" placeholder="Optional review" />
                          <button className="focus-ring w-fit rounded-md bg-trust px-3 py-2 text-sm font-bold text-white">Submit rating</button>
                        </form>
                      </details>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {activeNav === "Payments" ? (
          <div className="space-y-6">
            <PageHeader title="Payments" subtitle={`EUR ${heldTotal} currently in escrow`} />
            {!payments.length ? (
              <EmptyState title="No payments yet" actionLabel="Browse tasks" onAction={() => navigate("Tasks")} />
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <article key={payment.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-mint text-lagoon"><CreditCard size={20} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-ink">{payment.taskTitle}</p>
                          <StatusBadge tone={payment.status === "released" ? "good" : "warn"}>{paymentLabel(payment.status)}</StatusBadge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{payment.participantName}</p>
                      </div>
                      <p className="text-lg font-bold text-trust">EUR {payment.amount}</p>
                      <button disabled={payment.status === "released"} onClick={() => advancePayment(payment)} className="focus-ring rounded-md bg-trust px-3 py-2 text-sm font-bold text-white disabled:bg-slate-300">
                        {paymentAction(payment.status)}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {activeNav === "Alerts" ? (
          <div className="space-y-6">
            <PageHeader title="Notifications" subtitle={`${alerts.length} unread`} action={
              alerts.length ? <button onClick={() => setAlerts([])} className="focus-ring rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold">Mark all read</button> : null
            } />
            {!alerts.length ? (
              <EmptyState title="You are all caught up" />
            ) : (
              <Section>
                <div className="divide-y divide-slate-100">
                  {alerts.map((alert) => (
                    <button key={alert} onClick={() => setAlerts((items) => items.filter((item) => item !== alert))} className="focus-ring flex w-full items-center gap-3 px-2 py-4 text-left hover:bg-slate-50">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-clay" />
                      <span className="flex-1 text-sm font-medium text-slate-700">{alert}</span>
                      <CheckCircle2 size={17} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              </Section>
            )}
          </div>
        ) : null}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-slate-200 bg-white px-1 py-2 lg:hidden">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id || (activeNav === "Profile" && previousNav === item.id);
          return (
            <button key={item.id} onClick={() => navigate(item.id)} className={`focus-ring flex flex-col items-center gap-1 rounded-md py-2 text-[10px] font-semibold ${active ? "text-lagoon" : "text-slate-500"}`}>
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {isPostOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-ink/35 p-3 sm:place-items-center">
          <section className="w-full max-w-lg rounded-lg bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-ink">Post a task</h2>
              <button onClick={() => setIsPostOpen(false)} className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">Close</button>
            </div>
            <form onSubmit={createTask} className="mt-4 grid gap-3">
              <input required name="title" className="focus-ring rounded-md border border-slate-200 px-3 py-2" placeholder="Task title" />
              <textarea required name="description" className="focus-ring min-h-24 rounded-md border border-slate-200 px-3 py-2" placeholder="What needs to be done?" />
              <div className="grid grid-cols-2 gap-3">
                <input required name="budget" inputMode="numeric" className="focus-ring rounded-md border border-slate-200 px-3 py-2" placeholder="Budget" />
                <input required name="location" className="focus-ring rounded-md border border-slate-200 px-3 py-2" placeholder="Location" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select name="category" className="focus-ring rounded-md border border-slate-200 px-3 py-2">
                  <option>Repairs</option><option>Cleaning</option><option>Moving</option><option>Garden</option>
                </select>
                <select name="urgency" className="focus-ring rounded-md border border-slate-200 px-3 py-2">
                  <option>Today</option><option>Tomorrow</option><option>Flexible</option>
                </select>
              </div>
              <button className="focus-ring rounded-md bg-trust px-4 py-3 font-bold text-white">Post task</button>
            </form>
          </section>
        </div>
      ) : null}

      {offerTask ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-ink/35 p-3 sm:place-items-center">
          <section className="w-full max-w-md rounded-lg bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-ink">Make an offer</h2>
                <p className="text-sm text-slate-500">{offerTask.title}</p>
              </div>
              <button onClick={() => setOfferTask(null)} className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">Close</button>
            </div>
            <form onSubmit={submitOffer} className="mt-4 grid gap-3">
              <input required name="amount" inputMode="numeric" className="focus-ring rounded-md border border-slate-200 px-3 py-2" defaultValue="78" aria-label="Offer amount" />
              <textarea required name="note" className="focus-ring min-h-24 rounded-md border border-slate-200 px-3 py-2" defaultValue="I can complete this task today." aria-label="Offer note" />
              <button className="focus-ring rounded-md bg-trust px-4 py-3 font-bold text-white">Send offer</button>
            </form>
          </section>
        </div>
      ) : null}

      {isEditOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-end overflow-y-auto bg-ink/35 p-3 sm:place-items-center">
          <section className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-ink">Account settings</h2>
              <button onClick={() => setIsEditOpen(false)} className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">Close</button>
            </div>
            <form onSubmit={saveProfile} className="mt-4 grid gap-3">
              <input required value={profileDraft.name} onChange={(event) => setProfileDraft((draft) => ({ ...draft, name: event.target.value }))} className="focus-ring rounded-md border border-slate-200 px-3 py-2" placeholder="Name" />
              <input required value={profileDraft.phone} onChange={(event) => setProfileDraft((draft) => ({ ...draft, phone: event.target.value }))} className="focus-ring rounded-md border border-slate-200 px-3 py-2" placeholder="Phone" />
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Date of birth
                <input type="date" value={profileDraft.dateOfBirth} onChange={(event) => setProfileDraft((draft) => ({ ...draft, dateOfBirth: event.target.value }))} className="focus-ring rounded-md border border-slate-200 px-3 py-2 font-normal text-ink" />
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Client", "Doer", "Both"] as const).map((role) => (
                  <button key={role} type="button" onClick={() => setProfileDraft((draft) => ({ ...draft, role }))} className={`focus-ring rounded-md border px-3 py-2 text-sm font-semibold ${profileDraft.role === role ? "border-trust bg-trust text-white" : "border-slate-200"}`}>{role}</button>
                ))}
              </div>
              <label className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm font-medium">
                <input type="checkbox" checked={profileDraft.isStudent} onChange={(event) => setProfileDraft((draft) => ({ ...draft, isStudent: event.target.checked }))} className="accent-lagoon" />
                Student account
              </label>
              <div className="grid gap-3 rounded-lg border border-slate-200 p-3">
                <p className="font-bold text-ink">Change password</p>
                <input type="password" value={profileDraft.currentPassword} onChange={(event) => setProfileDraft((draft) => ({ ...draft, currentPassword: event.target.value }))} className="focus-ring rounded-md border border-slate-200 px-3 py-2" placeholder="Current password" />
                <input type="password" value={profileDraft.newPassword} onChange={(event) => setProfileDraft((draft) => ({ ...draft, newPassword: event.target.value }))} className="focus-ring rounded-md border border-slate-200 px-3 py-2" placeholder="New password" />
              </div>
              {accountNotice ? <p className="rounded-md bg-mint px-3 py-2 text-sm font-semibold text-lagoon">{accountNotice}</p> : null}
              <button className="focus-ring rounded-md bg-trust px-4 py-3 font-bold text-white">Save changes</button>
            </form>
            <div className="mt-4 grid gap-3 rounded-lg border border-clay/30 bg-clay/5 p-3">
              <div>
                <p className="font-bold text-ink">Delete account</p>
                <p className="text-sm text-slate-600">This removes your local account and saved workspace on this device.</p>
              </div>
              <input value={profileDraft.deleteConfirm} onChange={(event) => setProfileDraft((draft) => ({ ...draft, deleteConfirm: event.target.value }))} className="focus-ring rounded-md border border-slate-200 px-3 py-2" placeholder="Type DELETE to confirm" />
              <button type="button" disabled={profileDraft.deleteConfirm !== "DELETE"} onClick={deleteMyAccount} className="focus-ring w-fit rounded-md bg-clay px-3 py-2 text-sm font-bold text-white disabled:bg-slate-300">
                Delete account
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
