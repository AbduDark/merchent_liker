import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Users,
  Eye,
  EyeOff,
  Shield,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import type { SocialAccount } from "@shared/schema";

const accountSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type AccountFormData = z.infer<typeof accountSchema>;

function AccountRow({ account, onDelete }: { 
  account: SocialAccount; 
  onDelete: (id: string) => void;
}) {
  const statusConfig = {
    active: { label: "نشط", variant: "default" as const, icon: CheckCircle2 },
    inactive: { label: "غير نشط", variant: "secondary" as const, icon: XCircle },
    error: { label: "خطأ", variant: "destructive" as const, icon: AlertCircle },
  };
  
  const status = statusConfig[account.status || "active"];
  const StatusIcon = status.icon;

  return (
    <TableRow data-testid={`row-account-${account.id}`}>
      <TableCell className="font-medium">{account.username}</TableCell>
      <TableCell>
        <Badge variant={status.variant} className="gap-1">
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {account.lastUsed 
          ? new Date(account.lastUsed).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          : "لم يُستخدم بعد"
        }
      </TableCell>
      <TableCell>
        <Button 
          variant="outline" 
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(account.id)}
          data-testid={`button-delete-account-${account.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function AccountCard({ account, onDelete }: { 
  account: SocialAccount; 
  onDelete: (id: string) => void;
}) {
  const statusConfig = {
    active: { label: "نشط", variant: "default" as const, icon: CheckCircle2 },
    inactive: { label: "غير نشط", variant: "secondary" as const, icon: XCircle },
    error: { label: "خطأ", variant: "destructive" as const, icon: AlertCircle },
  };
  
  const status = statusConfig[account.status || "active"];
  const StatusIcon = status.icon;

  return (
    <Card data-testid={`card-account-${account.id}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-semibold">{account.username}</p>
            <p className="text-xs text-muted-foreground">
              {account.lastUsed 
                ? `آخر استخدام: ${new Date(account.lastUsed).toLocaleDateString("ar-EG")}`
                : "لم يُستخدم بعد"
              }
            </p>
          </div>
          <Badge variant={status.variant} className="gap-1 shrink-0">
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
        </div>
        <div className="mt-4 pt-4 border-t flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            كلمة المرور مشفرة
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(account.id)}
          >
            <Trash2 className="w-4 h-4 ml-1" />
            حذف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المستخدم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر استخدام</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      <div className="grid gap-4 md:hidden">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const { data: accounts = [], isLoading } = useQuery<SocialAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      const response = await apiRequest("POST", "/api/accounts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "تمت الإضافة", description: "تم إضافة الحساب بنجاح" });
      setIsDialogOpen(false);
      form.reset();
      setShowPassword(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إضافة الحساب، حاول مرة أخرى", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "تم الحذف", description: "تم حذف الحساب بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل حذف الحساب", variant: "destructive" });
    },
  });

  const activeCount = accounts.filter(a => a.status === "active").length;
  const errorCount = accounts.filter(a => a.status === "error").length;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">إدارة الحسابات</h1>
          <p className="text-muted-foreground mt-1">أضف وإدّر حسابات السوشيال ميديا</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-account">
              <Plus className="w-4 h-4 ml-2" />
              إضافة حساب
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة حساب جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات الحساب الذي تريد استخدامه في الحملات
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستخدم</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="username" 
                          dir="ltr"
                          data-testid="input-account-username" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="********" 
                            dir="ltr"
                            data-testid="input-account-password" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute left-1 top-1/2 -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="bg-muted/50 rounded-md p-3 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    كلمة المرور يتم تشفيرها بشكل آمن ولا يمكن لأي شخص رؤيتها
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit-account"
                  >
                    {createMutation.isPending ? "جاري الإضافة..." : "إضافة الحساب"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setShowPassword(false);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الحسابات</p>
                <p className="text-3xl font-bold" data-testid="text-total-accounts">{accounts.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">حسابات نشطة</p>
                <p className="text-3xl font-bold text-green-600" data-testid="text-active-accounts">{activeCount}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">حسابات بها مشاكل</p>
                <p className="text-3xl font-bold text-destructive" data-testid="text-error-accounts">{errorCount}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <AccountsSkeleton />
      ) : accounts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">لا توجد حسابات بعد</h3>
            <p className="text-muted-foreground mb-6">أضف حسابات السوشيال ميديا لتستخدمها في حملاتك</p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-account">
              <Plus className="w-4 h-4 ml-2" />
              إضافة حساب
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم المستخدم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر استخدام</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <AccountRow 
                      key={account.id} 
                      account={account} 
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
          <div className="grid gap-4 md:hidden">
            {accounts.map((account) => (
              <AccountCard 
                key={account.id} 
                account={account} 
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
