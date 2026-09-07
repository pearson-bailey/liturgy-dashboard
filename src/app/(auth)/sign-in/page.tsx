import { AuthForm } from "../_components/AuthForm";
import { authConfigured } from "@/services/auth-service";
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  return (
    <AuthForm
      mode="sign-in"
      configured={authConfigured()}
      invalidLink={query.error === "invalid-link"}
    />
  );
}
