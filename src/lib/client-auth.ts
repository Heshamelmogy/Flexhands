export type LocalUserRole = "Client" | "Doer" | "Both";

export type LocalAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: LocalUserRole;
  isStudent: boolean;
  dateOfBirth?: string;
  documents?: {
    identity: string;
    eligibility: string;
  };
  verification?: {
    identity: boolean;
    eligibility: boolean;
  };
  passwordSalt: string;
  passwordHash: string;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
};

type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: LocalUserRole;
  isStudent: boolean;
};

const ACCOUNTS_KEY = "verified-handy.accounts.v1";
const HASH_ITERATIONS = 120000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as LocalAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function randomToken(length = 24) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function hashPassword(password: string, salt: string) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: HASH_ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  return toBase64(bits);
}

export async function registerLocalAccount(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  const accounts = readAccounts();

  if (accounts.some((account) => account.email === email)) {
    return { ok: false as const, error: "An account already exists for this email." };
  }

  const passwordSalt = randomToken();
  const account: LocalAccount = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    role: input.role,
    isStudent: input.isStudent,
    documents: { identity: "", eligibility: "" },
    verification: { identity: false, eligibility: false },
    passwordSalt,
    passwordHash: await hashPassword(input.password, passwordSalt),
    ratingAverage: 0,
    ratingCount: 0,
    createdAt: new Date().toISOString()
  };

  writeAccounts([...accounts, account]);
  return { ok: true as const, account };
}

export async function verifyLocalLogin(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const account = readAccounts().find((item) => item.email === email);

  if (!account) {
    return { ok: false as const, error: "No account exists for this email." };
  }

  const candidateHash = await hashPassword(password, account.passwordSalt);
  if (candidateHash !== account.passwordHash) {
    return { ok: false as const, error: "Incorrect password." };
  }

  return { ok: true as const, account };
}

export function updateLocalAccountProfile(emailInput: string, patch: Partial<Pick<LocalAccount, "name" | "phone" | "role" | "isStudent" | "dateOfBirth" | "documents" | "verification" | "ratingAverage" | "ratingCount">>) {
  const email = normalizeEmail(emailInput);
  const accounts = readAccounts();
  const account = accounts.find((item) => item.email === email);

  if (!account) {
    return { ok: false as const, error: "No account exists for this email." };
  }

  const updatedAccount = { ...account, ...patch };
  writeAccounts(accounts.map((item) => (item.email === email ? updatedAccount : item)));
  return { ok: true as const, account: updatedAccount };
}

export async function updateLocalAccountPassword(emailInput: string, currentPassword: string, nextPassword: string) {
  const email = normalizeEmail(emailInput);
  const accounts = readAccounts();
  const account = accounts.find((item) => item.email === email);

  if (!account) {
    return { ok: false as const, error: "No account exists for this email." };
  }

  const currentHash = await hashPassword(currentPassword, account.passwordSalt);
  if (currentHash !== account.passwordHash) {
    return { ok: false as const, error: "Current password is incorrect." };
  }

  if (nextPassword.length < 8) {
    return { ok: false as const, error: "New password must be at least 8 characters." };
  }

  const passwordSalt = randomToken();
  const updatedAccount = {
    ...account,
    passwordSalt,
    passwordHash: await hashPassword(nextPassword, passwordSalt)
  };

  writeAccounts(accounts.map((item) => (item.email === email ? updatedAccount : item)));
  return { ok: true as const };
}

export function deleteLocalAccount(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const accounts = readAccounts();
  const nextAccounts = accounts.filter((account) => account.email !== email);

  if (nextAccounts.length === accounts.length) {
    return { ok: false as const, error: "No account exists for this email." };
  }

  writeAccounts(nextAccounts);
  return { ok: true as const };
}
