import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-provider";
import {
  LayoutDashboard,
  Target,
  Users,
  Settings,
  LogOut,
  Rocket,
  Moon,
  Sun,
  CreditCard,
} from "lucide-react";

const menuItems = [
  {
    title: "لوحة التحكم",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "الحملات",
    url: "/campaigns",
    icon: Target,
  },
  {
    title: "الحسابات",
    url: "/accounts",
    icon: Users,
  },
  {
    title: "الاشتراك",
    url: "/subscription",
    icon: CreditCard,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { merchant, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <Sidebar side="right">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg">CampaignPro</h2>
              <p className="text-xs text-muted-foreground">منصة الحملات التسويقية</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive}>
                      <Link href={item.url} data-testid={`link-${item.url.replace("/", "")}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>حالة الاشتراك</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <div className="bg-sidebar-accent/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">الباقة</span>
                <Badge variant={merchant?.subscriptionStatus === "active" ? "default" : "secondary"}>
                  {merchant?.subscriptionStatus === "active" ? "نشط" : "مجاني"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {merchant?.subscriptionPlan || "الباقة المجانية"}
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary">
                {merchant?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{merchant?.businessName || merchant?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{merchant?.email}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="shrink-0"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="flex-1 justify-start text-destructive hover:text-destructive"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
