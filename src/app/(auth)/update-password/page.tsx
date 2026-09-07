import { redirect } from "next/navigation";
import { currentUser, authConfigured } from "@/services/auth-service";
import { AuthForm } from "../_components/AuthForm";
export default async function UpdatePasswordPage() {
  if (!authConfigured() || !(await currentUser()))
    redirect("/sign-in?error=invalid-link");
  return <AuthForm mode="update-password" />;
}
