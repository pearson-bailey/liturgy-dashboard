import { AuthForm } from "../_components/AuthForm";
import { authConfigured } from "@/services/auth-service";
export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot-password" configured={authConfigured()} />;
}
