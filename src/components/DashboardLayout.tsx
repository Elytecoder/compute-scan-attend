import { NavLink, Outlet } from "react-router-dom";
import { Home, QrCode, Calendar, BarChart3, Users, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/computing-society-logo.jpg";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Scan Attendance", url: "/dashboard/scanner", icon: QrCode },
  { title: "Events", url: "/dashboard/events", icon: Calendar },
  { title: "Members", url: "/dashboard/members", icon: Users },
  { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
];

const AppSidebar = () => {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="bg-[hsl(var(--maroon))] border-r-0">
      <SidebarContent className="bg-[hsl(var(--maroon))]">
        <div className="flex items-center gap-2 p-4 border-b border-white/20">
          <img src={logo} alt="Computing Society" className="h-8 w-8 object-contain" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white">Computing Society</span>
              <span className="text-xs text-white/80">Attendance System</span>
            </div>
          )}
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/90">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={({ isActive }) =>
                        isActive 
                          ? "bg-white/20 text-white font-medium hover:bg-white/25" 
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-white/20">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 bg-card">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
