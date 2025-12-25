import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateDeckForm } from "./create-deck-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewDeckPage() {
  const { userId } = await auth();

  if (!userId) {
    // User is not authenticated - redirect to homepage
    redirect("/");
  }

  return (
    <div className="container mx-auto py-8 px-8 max-w-2xl">
      {/* Header with back button */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div>
          <h1 className="text-4xl font-bold tracking-tight">Create New Deck</h1>
          <p className="text-muted-foreground mt-2">
            Create a new flashcard deck to organize your learning materials
          </p>
        </div>
      </div>

      {/* Create Deck Form */}
      <CreateDeckForm />
    </div>
  );
}

