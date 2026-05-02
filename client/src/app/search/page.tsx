"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { fetchTrains, Train } from "@/lib/api/trains";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Train as TrainIcon, CreditCard } from "lucide-react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const dateStr = searchParams.get("date") || "";

  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayDate = useMemo(() => {
    try {
      return dateStr ? format(new Date(dateStr), "MMMM do, yyyy") : "";
    } catch (e) {
      return dateStr;
    }
  }, [dateStr]);

  useEffect(() => {
    let isActive = true;
    const loadTrains = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchTrains(origin, destination, dateStr);
        const data = Array.isArray(response) ? response : (response?.data || response?.schedules || response?.trains || []);
        if (isActive) setTrains(data || []);
      } catch (err) {
        console.error("Failed to load trains:", err);
        if (isActive) setError("Could not connect to the Train Management Service. Please try again later.");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadTrains();
    return () => {
      isActive = false;
    };
  }, [origin, destination, dateStr]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground -ml-3">
              ← Back to Search
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Available Trains</h1>
        <p className="text-muted-foreground text-lg">
          {origin && destination ? (
            <>Showing schedules from <b className="text-foreground">{origin}</b> to <b className="text-foreground">{destination}</b> on <b className="text-foreground">{displayDate}</b></>
          ) : (
             "All available train schedules"
          )}
        </p>
      </div>

      {loading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-muted/50"></Card>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center p-12 text-center text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">
          <h3 className="text-xl font-bold mb-2">Error Loading Schedules</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && trains.length === 0 && (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-muted/30 rounded-xl border border-dashed">
          <TrainIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No trains found</h3>
          <p className="text-muted-foreground">We could not find any trains matching your search criteria. Try different dates or stations.</p>
          <Link href="/">
            <Button variant="outline" className="mt-6">Change Search</Button>
          </Link>
        </div>
      )}

      {!loading && !error && trains.length > 0 && (
        <div className="grid gap-6">
          {trains.map((train) => (
            <Card key={train.scheduleId || train.id} className="overflow-hidden hover:shadow-md transition-shadow group">
              <div className="flex flex-col md:flex-row">
                <div className="bg-primary/5 p-6 md:w-1/4 flex flex-col justify-center items-center border-r border-border/40">
                  <div className="bg-primary/10 p-3 rounded-full mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <TrainIcon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg text-center">{train.name}</h3>
                  <Badge variant="secondary" className="mt-2 uppercase text-xs">{train.id}</Badge>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex flex-col md:flex-row justify-between mb-6 gap-6">
                    <div className="flex-1 space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/> Origin</div>
                      <div className="font-semibold text-lg">{origin}</div>
                      <div className="text-sm font-medium flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <Clock className="h-3.5 w-3.5"/>
                        Departure: {train.departureTime || "TBA"}
                      </div>
                    </div>

                    <div className="hidden md:flex flex-col items-center justify-center px-4 w-32">
                      <div className="w-full h-px bg-border relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-muted-foreground text-xs font-medium">To</div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1 md:text-right">
                      <div className="text-sm text-muted-foreground flex items-center md:justify-end gap-1.5"><MapPin className="h-3.5 w-3.5"/> Destination</div>
                      <div className="font-semibold text-lg">{destination}</div>
                      <div className="text-sm font-medium flex items-center md:justify-end gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <Clock className="h-3.5 w-3.5"/>
                        Arrival: {train.arrivalTime || "TBA"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border/40 gap-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground w-full sm:w-auto">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4" />
                        Starting from <span className="font-bold text-foreground ml-1">Rs. {train.price || "1000"}</span>
                      </div>
                    </div>
                    <Link href={`/book?scheduleId=${encodeURIComponent(train.scheduleId || train.id)}`} className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto">Select Seats</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
