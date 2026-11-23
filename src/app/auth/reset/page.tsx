import type { Metadata } from "next";
import { ResetPasswordView } from "@/components/views/reset-password-view";

export const metadata: Metadata = {
  title: "Parola yenile",
  description: "PatiRehber hesabının parolasını yenile.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
