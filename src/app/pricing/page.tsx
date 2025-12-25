import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground">
            Unlock the full potential of FlashyCardy with Pro features
          </p>
        </div>
        
        <PricingTable />
      </div>
    </div>
  );
}

