"use server";

import { cookies } from "next/headers";

import { convexApi, convexMutation, convexQuery } from "@/lib/convex";
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  normalizeEmail,
  verifyPassword,
} from "@/lib/session";

const SESSION_DURATION = 60 * 60 * 24 * 7;
const SESSION_COOKIE_NAME = "session";

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params: SignUpParams) {
  const name = params.name.trim();
  const email = normalizeEmail(params.email);
  const password = params.password;

  try {
    const existingUser = await convexQuery(convexApi.users.getByEmail, { email });
    if (existingUser) {
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };
    }

    await convexMutation(convexApi.users.create, {
      name,
      email,
      passwordHash: hashPassword(password),
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error) {
    console.error("Error creating user:", error);

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const email = normalizeEmail(params.email);

  try {
    const user = await convexQuery(convexApi.users.getByEmail, { email });

    if (!user || !verifyPassword(params.password, user.passwordHash)) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    const sessionToken = createSessionToken();
    const tokenHash = hashSessionToken(sessionToken);
    const expiresAt = Date.now() + SESSION_DURATION * 1000;

    await convexMutation(convexApi.sessions.create, {
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await setSessionCookie(sessionToken);

    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error) {
    console.error("Failed to sign in:", error);

    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    try {
      await convexMutation(convexApi.sessions.deleteByTokenHash, {
        tokenHash: hashSessionToken(sessionToken),
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  try {
    const session = await convexQuery(convexApi.sessions.getByTokenHash, {
      tokenHash: hashSessionToken(sessionToken),
    });

    if (!session || session.expiresAt <= Date.now()) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    const user = await convexQuery(convexApi.users.getById, {
      id: session.userId,
    });

    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
