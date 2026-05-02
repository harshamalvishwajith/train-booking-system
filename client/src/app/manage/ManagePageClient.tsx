"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import ManageClient from "./ManageClient";

export default function ManagePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryBookingId = searchParams.get("bookingId") || "";
  const [bookingId, setBookingId] = useState("");

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingId.trim()) {
      router.push(`/manage?bookingId=${encodeURIComponent(bookingId.trim())}`);
    }
  };

  if (queryBookingId) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <ManageClient bookingId={queryBookingId} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-2">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Manage Your Booking</CardTitle>
          <CardDescription>
            Enter your booking reference number to view details or cancel your ticket.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLookup}>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="bookingId">Booking Reference ID</Label>
              <Input 
                id="bookingId" 
                placeholder="e.g. 66e81f72a..." 
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="h-12 font-mono"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12 text-md" disabled={!bookingId.trim()}>
              Find Booking
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
