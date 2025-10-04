import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalMembers: number;
  totalEvents: number;
  todayAttendance: number;
  activeEvents: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    totalEvents: 0,
    todayAttendance: 0,
    activeEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [membersRes, eventsRes, attendanceRes] = await Promise.all([
          supabase.from("members").select("id", { count: "exact", head: true }),
          supabase.from("events").select("id", { count: "exact", head: true }),
          supabase
            .from("attendance")
            .select("id", { count: "exact", head: true })
            .gte("time_in", new Date().toISOString().split("T")[0]),
        ]);

        const today = new Date().toISOString().split("T")[0];
        const { data: activeEventsData } = await supabase
          .from("events")
          .select("id")
          .eq("event_date", today);

        setStats({
          totalMembers: membersRes.count || 0,
          totalEvents: eventsRes.count || 0,
          todayAttendance: attendanceRes.count || 0,
          activeEvents: activeEventsData?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      description: "Registered members",
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      description: "All time events",
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance,
      icon: CheckCircle,
      description: "Check-ins today",
    },
    {
      title: "Active Events",
      value: stats.activeEvents,
      icon: TrendingUp,
      description: "Events happening today",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Computing Society Attendance System
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with these common tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Scan membership cards to track attendance
          </p>
          <p className="text-sm text-muted-foreground">
            • Create and manage events
          </p>
          <p className="text-sm text-muted-foreground">
            • View attendance reports by program and block
          </p>
          <p className="text-sm text-muted-foreground">
            • Manage member database
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
