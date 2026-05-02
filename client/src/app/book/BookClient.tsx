"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BookingFlow from "@/components/BookingFlow";
import { Button } from "@/components/ui/button";

export default function BookClient() {
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get("scheduleId") || "";

  if (!scheduleId) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Complete Your Booking</h1>
        <p className="text-muted-foreground mb-6">
          Choose a train from the search results to begin booking.
        </p>
        <Link href="/">
          <Button variant="outline">Back to Search</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Complete Your Booking</h1>
      <BookingFlow scheduleId={scheduleId} />
    </div>
  );
}
