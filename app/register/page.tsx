import Link from "next/link"
import { RegisterForm } from "@/components/register-form"
import { BookOpen } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <BookOpen className="h-8 w-8" />
            <span className="text-2xl font-bold">EduPortal</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create an account</h1>
          <p className="text-muted-foreground">Join thousands of students and teachers</p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
