"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchSeats } from "@/lib/api/seats";
import { createBooking, BookingPayload, PassengerPayload } from "@/lib/api/bookings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function BookingFlow({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [seatData, setSeatData] = useState<any>(null);

  // Form State
  const [seatClass, setSeatClass] = useState<BookingPayload["seatClass"] | "">("");
  const [passengers, setPassengers] = useState("1");
  const [passengerDetails, setPassengerDetails] = useState<PassengerPayload[]>([
    { name: "", email: "", phone: "" }
  ]);
  const [contactEmail, setContactEmail] = useState("");
  const [origin, setOrigin] = useState("Colombo Fort");
  const [destination, setDestination] = useState("Kandy");
  const [journeyDate, setJourneyDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingResponse, setBookingResponse] = useState<any>(null);

  const seatClassOptions = [
    { label: "First Class", value: "FIRST", description: "Premium seating with excellent views and legroom." },
    { label: "Second Class", value: "SECOND", description: "Comfortable seating with great value for families." },
    { label: "Third Class", value: "THIRD", description: "Affordable travel with essential comfort." },
  ] as const;

  const seatClassLabel = seatClassOptions.find(option => option.value === seatClass)?.label || "";

  useEffect(() => {
    loadSeats();
  }, [scheduleId]);

  const loadSeats = async () => {
    try {
      const data = await fetchSeats(scheduleId);
      setSeatData(data);
    } catch (error) {
      console.error("Failed to load seats", error);
      toast.error("Failed to load seat availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updatePassengerCount = (value: string) => {
    const count = Math.max(1, Number.parseInt(value, 10) || 1);
    setPassengers(String(count));
    setPassengerDetails(prev => {
      const next = [...prev];
      while (next.length < count) {
        next.push({ name: "", email: "", phone: "" });
      }
      return next.slice(0, count);
    });
  };

  const updatePassengerField = (index: number, field: keyof PassengerPayload, value: string) => {
    setPassengerDetails(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatClass || !contactEmail) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!seatData?.trainId) {
      toast.error("Train information is missing. Please refresh and try again.");
      return;
    }

    const hasMissingPassenger = passengerDetails.some(passenger => (
      !passenger.name.trim() || !passenger.email.trim() || !passenger.phone.trim()
    ));
    if (hasMissingPassenger) {
      toast.error("Please fill in all passenger details.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: BookingPayload = {
        scheduleId,
        trainId: seatData.trainId,
        seatClass,
        passengers: passengerDetails,
        contactEmail,
        journeyDate,
        origin,
        destination
      };

      const response = await createBooking(payload);
      setBookingResponse(response);
      setStep(3);
      toast.success("Booking successful! Check your email for confirmation.");
    } catch (error: any) {
      toast.error(error.message || "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking real-time seat availability...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stepper Indicator */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 w-full h-1 -translate-y-1/2 bg-muted -z-10 rounded-full">
          <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${(step - 1) * 50}%` }} />
        </div>

        {[1, 2, 3].map((num) => (
          <div key={num} className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background font-semibold transition-colors ${step >= num ? 'border-primary text-primary' : 'border-muted text-muted-foreground'} ${step > num ? 'bg-primary text-primary-foreground' : ''}`}>
            {step > num ? <CheckCircle2 className="h-6 w-6" /> : num}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Seat Selection</CardTitle>
            <CardDescription>Choose your preferred travel class.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {seatClassOptions.map((tier) => (
                <div
                  key={tier.value}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${seatClass === tier.value ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:border-border/80'}`}
                  onClick={() => setSeatClass(tier.value)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{tier.label}</h3>
                    <div className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-500/10 dark:text-green-400">Available</div>
                  </div>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border/50">
              <Label htmlFor="passengers">Number of Passengers</Label>
              <Select value={passengers} onValueChange={(val) => updatePassengerCount(val || "1")}>
                <SelectTrigger id="passengers" className="w-[180px] mt-2">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>Back</Button>
            <Button disabled={!seatClass} onClick={() => setStep(2)}>Continue to Details</Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <form onSubmit={handleBooking}>
          <Card>
            <CardHeader>
              <CardTitle>Passenger Details</CardTitle>
              <CardDescription>Enter the contact information for this booking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  value={contactEmail}
                  onChange={(e) => {
                    const nextEmail = e.target.value;
                    setContactEmail(nextEmail);
                    setPassengerDetails(prev => {
                      if (!prev[0] || prev[0].email.trim()) return prev;
                      const next = [...prev];
                      next[0] = { ...next[0], email: nextEmail };
                      return next;
                    });
                  }}
                />
              </div>

              <div className="space-y-4">
                {passengerDetails.map((passenger, index) => (
                  <div key={index} className="rounded-lg border border-border/60 p-4 space-y-3">
                    <div className="text-sm font-semibold">Passenger {index + 1}</div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`passenger-name-${index}`}>Full Name</Label>
                        <Input
                          id={`passenger-name-${index}`}
                          placeholder="Amal Perera"
                          value={passenger.name}
                          onChange={(e) => updatePassengerField(index, "name", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`passenger-email-${index}`}>Email</Label>
                        <Input
                          id={`passenger-email-${index}`}
                          type="email"
                          placeholder="amal@example.com"
                          value={passenger.email}
                          onChange={(e) => updatePassengerField(index, "email", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`passenger-phone-${index}`}>Phone</Label>
                      <Input
                        id={`passenger-phone-${index}`}
                        placeholder="+94771234567"
                        value={passenger.phone}
                        onChange={(e) => updatePassengerField(index, "phone", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* These fields would normally be pre-filled from context, but we ask just in case */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin Station</Label>
                  <Input id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination Station</Label>
                  <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Journey Date</Label>
                <Input id="date" type="date" value={journeyDate} onChange={(e) => setJourneyDate(e.target.value)} required />
              </div>

              <div className="bg-muted p-4 rounded-lg mt-6">
                <h4 className="font-semibold mb-2">Booking Summary</h4>
                <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Class</span> <span>{seatClassLabel || seatClass}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Passengers</span> <span>{passengers}</span></div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setStep(1)} disabled={submitting}>Back</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Booking
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {step === 3 && (
        <Card className="text-center py-8">
          <CardHeader>
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4 w-20 h-20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <CardDescription className="text-lg">Your tickets have been reserved successfully.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-sm mx-auto">
            <div className="bg-muted/50 p-4 rounded-xl text-left">
              <div className="text-sm text-muted-foreground mb-1">Booking Reference</div>
              <div className="font-mono text-xl font-bold bg-background p-2 rounded border inline-block w-full text-center tracking-widest">
                {bookingResponse?._id || bookingResponse?.bookingId || "BKG-SUCCESS"}
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              We've sent a confirmation email to <strong>{contactEmail}</strong>. You will need this reference to manage or cancel your booking.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center flex-col sm:flex-row gap-4 mt-4">
            <Button variant="outline" onClick={() => router.push('/')}>Return to Home</Button>
            <Button onClick={() => router.push(`/manage?bookingId=${encodeURIComponent(bookingResponse?._id || bookingResponse?.bookingId || "")}`)}>Manage Booking</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
