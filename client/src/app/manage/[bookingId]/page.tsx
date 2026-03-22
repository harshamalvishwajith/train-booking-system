import ManageClient from "./ManageClient";

export default function ManagePage({ params }: { params: { bookingId: string } }) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <ManageClient bookingId={params.bookingId} />
    </div>
  );
}
