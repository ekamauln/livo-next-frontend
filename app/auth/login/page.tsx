import { LoginForm } from "@/components/forms/login-form";
export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center p-10">
      <div className="w-full max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
}
