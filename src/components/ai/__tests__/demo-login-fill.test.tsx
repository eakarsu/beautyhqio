/** @jest-environment jsdom */
import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";
import { signIn } from "next-auth/react";

jest.mock("next-auth/react", () => ({ signIn: jest.fn() }));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }));

test("configured demo button fills credentials and waits for explicit Sign In", async () => {
  const fetchMock = jest.fn().mockImplementation(async (url: string) => ({ ok: true, json: async () => url.includes("status=1") ? { enabled: true, accounts: [{ key: "owner", email: "sample@example.test", role: "OWNER" }] } : { enabled: true, accounts: [{ key: "owner", email: "sample@example.test", password: "fixture-only", role: "OWNER" }] } }));
  global.fetch = fetchMock as typeof fetch;
  render(<LoginPage />);
  const button = await screen.findByRole("button", { name: "Fill demo credentials" });
  fireEvent.click(button);
  await waitFor(() => expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("sample@example.test"));
  expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("fixture-only");
  expect(signIn).not.toHaveBeenCalled();
});
