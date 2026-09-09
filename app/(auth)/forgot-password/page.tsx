import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          Password reset is handled by your administrator in Phase 1.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Contact an admin to reset your password. Self-service reset (email
          link) ships with the Communication phase.
        </p>
        <Link href="/login" className="text-primary hover:underline">
          ← Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
