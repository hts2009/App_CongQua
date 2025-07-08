import { LoginForm } from "@/components/auth/login-form";
import { AuthProvider } from "@/hooks/use-auth"; // Ensure AuthProvider wraps this

export default function LoginPage() {
  return (
    <AuthProvider> {/* Important: AuthProvider should ideally be in a higher layout if other auth pages exist */}
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-accent/30 p-4">
        <LoginForm />
      </main>
    </AuthProvider>
  );
}
