import { redirect } from 'next/navigation';

export default function DashboardBlueprintPage({ params }: { params: { id: string } }) {
  redirect(`/tasks/${params.id}`);
}
