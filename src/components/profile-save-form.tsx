"use client";

import { createContext, ReactNode, useActionState, useContext } from "react";

export type ProfileSaveState = {
  message?: string;
  status: "idle" | "success" | "error";
};

type ProfileSaveAction = (state: ProfileSaveState, formData: FormData) => Promise<ProfileSaveState>;
type ProfileSaveContextValue = {
  isPending: boolean;
  state: ProfileSaveState;
};

const initialState: ProfileSaveState = { status: "idle" };
const ProfileSaveContext = createContext<ProfileSaveContextValue>({
  isPending: false,
  state: initialState
});

export function ProfileSaveForm({
  action,
  children,
  className,
  initialState = { status: "idle" }
}: {
  action: ProfileSaveAction;
  children: ReactNode;
  className?: string;
  initialState?: ProfileSaveState;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <ProfileSaveContext.Provider value={{ isPending, state }}>
      <form action={formAction} className={className}>
        {children}
      </form>
    </ProfileSaveContext.Provider>
  );
}

export function useProfileSaveStatus() {
  return useContext(ProfileSaveContext);
}

export function ProfileSaveMessage() {
  const { state } = useProfileSaveStatus();

  if (state.status !== "error" || !state.message) {
    return null;
  }

  return <p className="max-w-sm text-right text-sm font-medium text-red-600">{state.message}</p>;
}
