import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const { userId } = await auth();
  
  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <main className="flex flex-col items-center justify-center gap-8 text-center px-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-6xl font-bold tracking-tight text-zinc-50">
            FlashyCardy
          </h1>
          <p className="text-xl text-zinc-400">
            Your personal flashcard platform
          </p>
        </div>
        
        <div className="flex gap-4">
          <SignInButton mode="modal">
            <Button size="lg" variant="default">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="lg" variant="outline">
              Sign Up
            </Button>
          </SignUpButton>
        </div>
      </main>
    </div>
  );
}
