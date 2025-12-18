import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Heart, 
  MessageCircle, 
  Plus,
  ArrowUpLeft,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import type { Campaign, SocialAccount } from "@shared/schema";

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: typeof TrendingUp;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-3xl font-bold" data-testid={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}>{value}</span>
          {trend && (
            <Badge variant={trend.positive ? "default" : "secondary"} className="text-xs">
              <ArrowUpLeft className={`w-3 h-3 ml-1 ${trend.positive ? "" : "rotate-90"}`} />
              {trend.value}%
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const likesProgress = campaign.targetLikes ? (campaign.currentLikes! / campaign.targetLikes) * 100 : 0;
  const commentsProgress = campaign.targetComments ? (campaign.currentComments! / campaign.targetComments) * 100 : 0;
  
  const statusConfig = {
    pending: { label: "قيد الانتظار", variant: "secondary" as const, icon: Clock },
    active: { label: "نشط", variant: "default" as const, icon: TrendingUp },
    completed: { label: "مكتمل", variant: "outline" as const, icon: CheckCircle2 },
    paused: { label: "متوقف", variant: "secondary" as const, icon: AlertCircle },
  };
  
  const status = statusConfig[campaign.status || "pending"];
  const StatusIcon = status.icon;

  return (
    <Card data-testid={`card-campaign-${campaign.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-base font-semibold truncate" title={campaign.postUrl}>
              {campaign.postUrl.length > 50 ? campaign.postUrl.substring(0, 50) + "..." : campaign.postUrl}
            </CardTitle>
            <CardDescription className="text-xs">
              {new Date(campaign.createdAt!).toLocaleDateString("ar-EG", { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </CardDescription>
          </div>
          <Badge variant={status.variant} className="shrink-0">
            <StatusIcon className="w-3 h-3 ml-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {campaign.targetLikes! > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Heart className="w-4 h-4" />
                لايكات
              </span>
              <span className="font-medium" data-testid={`text-likes-${campaign.id}`}>
                {campaign.currentLikes} / {campaign.targetLikes}
              </span>
            </div>
            <Progress value={likesProgress} className="h-2" />
          </div>
        )}
        {campaign.targetComments! > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                تعليقات
              </span>
              <span className="font-medium" data-testid={`text-comments-${campaign.id}`}>
                {campaign.currentComments} / {campaign.targetComments}
              </span>
            </div>
            <Progress value={commentsProgress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="w-10 h-10 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { merchant } = useAuth();

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<SocialAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const isLoading = campaignsLoading || accountsLoading;

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const completedCampaigns = campaigns.filter((c) => c.status === "completed");
  const totalLikes = campaigns.reduce((sum, c) => sum + (c.currentLikes || 0), 0);
  const totalComments = campaigns.reduce((sum, c) => sum + (c.currentComments || 0), 0);
  const activeAccounts = accounts.filter((a) => a.status === "active");

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold" data-testid="text-welcome">
          مرحباً، {merchant?.businessName || merchant?.username}
        </h1>
        <p className="text-muted-foreground mt-1">
          إليك نظرة عامة على حملاتك التسويقية
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="الحملات النشطة"
          value={activeCampaigns.length}
          description={`من إجمالي ${campaigns.length} حملة`}
          icon={Target}
        />
        <StatCard
          title="إجمالي اللايكات"
          value={totalLikes.toLocaleString("ar-EG")}
          description="على جميع الحملات"
          icon={Heart}
        />
        <StatCard
          title="إجمالي التعليقات"
          value={totalComments.toLocaleString("ar-EG")}
          description="على جميع الحملات"
          icon={MessageCircle}
        />
        <StatCard
          title="الحسابات النشطة"
          value={activeAccounts.length}
          description={`من إجمالي ${accounts.length} حساب`}
          icon={Users}
        />
      </div>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h2 className="text-xl font-semibold">الحملات الأخيرة</h2>
        <Link href="/campaigns">
          <Button variant="outline" size="sm" data-testid="button-view-all-campaigns">
            عرض الكل
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">لا توجد حملات بعد</h3>
            <p className="text-muted-foreground mb-6">ابدأ بإنشاء حملتك الأولى لزيادة التفاعل</p>
            <Link href="/campaigns">
              <Button data-testid="button-create-first-campaign">
                <Plus className="w-4 h-4 ml-2" />
                إنشاء حملة جديدة
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.slice(0, 6).map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">حالة الاشتراك</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <Badge variant={merchant?.subscriptionStatus === "active" ? "default" : "secondary"}>
                  {merchant?.subscriptionStatus === "active" ? "نشط" : "غير نشط"}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {merchant?.subscriptionPlan || "الباقة المجانية"}
                </p>
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">{campaigns.length} / {merchant?.campaignsLimit || 5}</p>
                <p className="text-xs text-muted-foreground">حملات متاحة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الإجراءات السريعة</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            <Link href="/campaigns">
              <Button data-testid="button-quick-create-campaign">
                <Plus className="w-4 h-4 ml-2" />
                حملة جديدة
              </Button>
            </Link>
            <Link href="/accounts">
              <Button variant="outline" data-testid="button-quick-add-account">
                <Users className="w-4 h-4 ml-2" />
                إضافة حساب
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
