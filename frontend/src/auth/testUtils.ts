import { resetApiClientAuth } from "../api/client";
import { resetSessionState } from "./session";

export function resetAuthForTests(): void {
  resetSessionState();
  resetApiClientAuth();
}
