import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Heart, 
  MessageCircle, 
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Pause,
  Play,
  Trash2,
  Link as LinkIcon,
  Filter
} from "lucide-react";
import type { Campaign, SocialAccount } from "@shared/schema";

const campaignSchema = z.object({
  postUrl: z.string().url("الرجاء إدخال رابط صحيح"),
  targetLikes: z.coerce.number().min(0, "يجب أن يكون رقم صحيح"),
  targetComments: z.coerce.number().min(0, "يجب أن يكون رقم صحيح"),
  commentText: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

function CampaignCard({ campaign, onDelete, onToggle }: { 
  campaign: Campaign; 
  onDelete: (id: string) => void;
  onToggle: (id: string, status: string) => void;
}) {
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
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <CardTitle className="text-base font-semibold truncate" title={campaign.postUrl}>
                {campaign.postUrl.length > 40 ? campaign.postUrl.substring(0, 40) + "..." : campaign.postUrl}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {new Date(campaign.createdAt!).toLocaleDateString("ar-EG", { 
                year: "numeric", 
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
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
              <span className="font-medium">
                {campaign.currentLikes?.toLocaleString("ar-EG")} / {campaign.targetLikes?.toLocaleString("ar-EG")}
              </span>
            </div>
            <Progress value={Math.min(likesProgress, 100)} className="h-2" />
          </div>
        )}
        {campaign.targetComments! > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                تعليقات
              </span>
              <span className="font-medium">
                {campaign.currentComments?.toLocaleString("ar-EG")} / {campaign.targetComments?.toLocaleString("ar-EG")}
              </span>
            </div>
            <Progress value={Math.min(commentsProgress, 100)} className="h-2" />
          </div>
        )}
        
        {campaign.commentText && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">نص التعليق:</p>
            <p className="text-sm bg-muted/50 rounded-md p-2 line-clamp-2">{campaign.commentText}</p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 flex-wrap">
          {campaign.status === "active" ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onToggle(campaign.id, "paused")}
              data-testid={`button-pause-${campaign.id}`}
            >
              <Pause className="w-4 h-4 ml-1" />
              إيقاف
            </Button>
          ) : campaign.status !== "completed" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onToggle(campaign.id, "active")}
              data-testid={`button-start-${campaign.id}`}
            >
              <Play className="w-4 h-4 ml-1" />
              تشغيل
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(campaign.id)}
            data-testid={`button-delete-${campaign.id}`}
          >
            <Trash2 className="w-4 h-4 ml-1" />
            حذف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CampaignsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: accounts = [] } = useQuery<SocialAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      postUrl: "",
      targetLikes: 0,
      targetComments: 0,
      commentText: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const response = await apiRequest("POST", "/api/campaigns", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "تم إنشاء الحملة", description: "تم إنشاء الحملة بنجاح وستبدأ قريباً" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إنشاء الحملة، حاول مرة أخرى", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "تم الحذف", description: "تم حذف الحملة بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل حذف الحملة", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/campaigns/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "تم التحديث", description: "تم تحديث حالة الحملة" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل تحديث الحملة", variant: "destructive" });
    },
  });

  const filteredCampaigns = statusFilter === "all" 
    ? campaigns 
    : campaigns.filter(c => c.status === statusFilter);

  const activeAccounts = accounts.filter(a => a.status === "active");

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">الحملات التسويقية</h1>
          <p className="text-muted-foreground mt-1">إدارة وتتبع جميع حملاتك</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-campaign">
              <Plus className="w-4 h-4 ml-2" />
              حملة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إنشاء حملة جديدة</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الحملة لبدء زيادة التفاعل على منشورك
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="postUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط المنشور</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://..." 
                          dir="ltr"
                          data-testid="input-post-url" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>الصق رابط المنشور الذي تريد زيادة التفاعل عليه</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetLikes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عدد اللايكات</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="100"
                            data-testid="input-target-likes" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetComments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عدد التعليقات</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="50"
                            data-testid="input-target-comments" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="commentText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نص التعليق (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="اكتب التعليق الذي سيتم نشره..."
                          className="resize-none"
                          data-testid="input-comment-text" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>إذا تركته فارغاً سيتم استخدام تعليقات عشوائية</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {activeAccounts.length === 0 && (
                  <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                    <AlertCircle className="w-4 h-4 inline ml-2" />
                    لا توجد حسابات نشطة. أضف حسابات أولاً لتتمكن من تشغيل الحملات.
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || activeAccounts.length === 0}
                    data-testid="button-submit-campaign"
                  >
                    {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحملة"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">تصفية:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحملات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="paused">متوقف</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="mr-auto">
          {filteredCampaigns.length} حملة
        </Badge>
      </div>

      {isLoading ? (
        <CampaignsSkeleton />
      ) : filteredCampaigns.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {statusFilter === "all" ? "لا توجد حملات بعد" : "لا توجد حملات بهذه الحالة"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {statusFilter === "all" 
                ? "ابدأ بإنشاء حملتك الأولى لزيادة التفاعل على منشوراتك" 
                : "جرب تغيير الفلتر لعرض حملات أخرى"}
            </p>
            {statusFilter === "all" && (
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-campaign">
                <Plus className="w-4 h-4 ml-2" />
                إنشاء حملة جديدة
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign} 
              onDelete={(id) => deleteMutation.mutate(id)}
              onToggle={(id, status) => toggleMutation.mutate({ id, status })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
