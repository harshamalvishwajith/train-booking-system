import BookingFlow from "@/components/BookingFlow";

export default function BookPage({ params }: { params: { scheduleId: string } }) {
  // Pass the scheduleId to the client component
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Complete Your Booking</h1>

      <BookingFlow scheduleId={params.scheduleId} />
    </div>
  );
}
