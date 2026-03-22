"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export default function SearchForm() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState<Date>();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (origin.trim()) params.append('origin', origin.trim());
    if (destination.trim()) params.append('destination', destination.trim());
    if (date) params.append('date', format(date, "yyyy-MM-dd"));
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-background relative mx-auto w-full max-w-4xl rounded-2xl border p-4 shadow-xl sm:p-6 md:p-8 mt-8 glassmorphism">
      <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
        
        {/* Origin */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none pb-1 block">
            From
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="E.g. Colombo" 
              value={origin} 
              onChange={(e) => setOrigin(e.target.value)}
              className="pl-9 bg-background h-10"
            />
          </div>
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none pb-1 block">
            To
          </label>
          <div className="relative">
            <Navigation className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="E.g. Kandy" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)}
              className="pl-9 bg-background h-10"
            />
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Date
          </label>
          <Popover>
            <PopoverTrigger className={cn(
                  "w-full justify-start text-left font-normal border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 inline-flex items-center shadow-sm rounded-md text-sm",
                  !date && "text-muted-foreground"
                )}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Empty space or additional options on md, button at end */}
        <Button 
          type="submit" 
          size="lg" 
          className="w-full text-md h-10 font-bold tracking-wide"
        >
          Search Trains
        </Button>
      </form>
    </div>
  );
}
