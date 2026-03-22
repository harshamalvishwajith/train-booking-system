"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchNotification } from "@/lib/api/notifications";
import { cancelBooking } from "@/lib/api/bookings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Ticket, Mail, Calendar, MapPin, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ManageClient({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotification();
  }, [bookingId]);

  const loadNotification = async () => {
    try {
      const data = await fetchNotification(bookingId);
      // Data might be an array of notifications (created, cancelled) or a single object.
      // We take the creating notification if it's an array, or just use the object.
      const notif = Array.isArray(data) ? data[0] : data;
      setNotification(notif);
    } catch (err: any) {
      console.error(err);
      setError("We couldn't find a booking with this reference ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelBooking(bookingId);
      toast.success("Booking cancelled successfully!");
      // Reload to reflect changes if necessary
      router.push('/manage'); // redirect back to lookup or show cancelled state
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel booking. It may have already been cancelled.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Retrieving your booking details...</p>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <Card className="max-w-md mx-auto mt-12 border-destructive/20 shadow-none">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2 opacity-80" />
          <CardTitle>Booking Not Found</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/manage" className="w-full">
            <Button variant="outline" className="w-full">Try Another ID</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  const isCancelled = notification.type === 'BOOKING_CANCELLED' || (notification.message && notification.message.toLowerCase().includes('canc'));
  const contactEmail = notification.email || 'N/A';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/manage" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Search
      </Link>
      
      <Card className="overflow-hidden">
        <div className={`h-2 w-full ${isCancelled ? 'bg-destructive' : 'bg-green-500'}`} />
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl mb-1 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Booking Details
            </CardTitle>
            <CardDescription className="font-mono">{bookingId}</CardDescription>
          </div>
          <Badge variant={isCancelled ? "destructive" : "default"} className="text-sm px-3 py-1">
            {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/40 rounded-xl p-5 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-background p-2 rounded-md shadow-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contact Details</p>
                <p className="font-medium text-foreground">{contactEmail}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-background p-2 rounded-md shadow-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Notification Status</p>
                <p className="font-medium text-foreground">{notification.status || 'SENT'}</p>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground px-1">
             <p>This reservation includes all passengers and seat class upgrades selected during checkout. To change these details, please cancel and book again.</p>
          </div>
        </CardContent>
        
        {!isCancelled && (
          <CardFooter className="bg-muted/10 border-t p-6 flex justify-between items-center sm:flex-row flex-col gap-4">
            <p className="text-sm text-muted-foreground sm:max-w-xs text-center sm:text-left">
              Need to change your plans? You can cancel your ticket securely.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 bg-destructive text-destructive-foreground shadow sm hover:bg-destructive/90 h-9 px-4 py-2 w-full sm:w-auto">Cancel Booking</AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently cancel your booking <b>{bookingId}</b> and release your seats to other passengers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Yes, Cancel Booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
