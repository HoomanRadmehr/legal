import { apiClient } from "../api/client";
import { buildCsrfHeaders } from "./csrf";

export type AuthUser = {
  display_name: string;
  id: string;
  preferred_language: string;
};

export type AuthMembership = {
  organization_id: string;
  organization_name?: string;
  role: string;
};

export type AuthSession = {
  access: string;
  membership: AuthMembership;
  user: AuthUser;
};

export type LoginInput = {
  password: string;
  username: string;
};

export type WebSocketTicket = {
  expires_at: string;
  ticket: string;
  websocket_url: string;
};

export async function ensureCsrfCookie(): Promise<void> {
  await apiClient.request<void>("/auth/csrf/", {
    method: "GET",
    replayOnUnauthorized: false,
  });
}

export async function login(input: LoginInput): Promise<AuthSession> {
  await ensureCsrfCookie();

  return apiClient.request<AuthSession>("/auth/login/", {
    body: input,
    headers: buildCsrfHeaders(),
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function refreshSession(): Promise<AuthSession> {
  await ensureCsrfCookie();

  return apiClient.request<AuthSession>("/auth/refresh/", {
    headers: buildCsrfHeaders(),
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function logoutSession(): Promise<void> {
  await ensureCsrfCookie();

  await apiClient.request<void>("/auth/logout/", {
    headers: buildCsrfHeaders(),
    method: "POST",
    replayOnUnauthorized: false,
  });
}

export async function requestWebSocketTicket(): Promise<WebSocketTicket> {
  return apiClient.request<WebSocketTicket>("/auth/ws-ticket/", {
    method: "POST",
    replayOnUnauthorized: false,
  });
}
