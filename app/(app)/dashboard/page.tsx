import { getDashboardData } from "@/db/queries";
import { Dashboard } from "@/components/dashboard/dashboard";

export default async function DashboardPage() {
  const { months, withdrawals } = await getDashboardData();

  return <Dashboard months={months} withdrawals={withdrawals} />;
}
