import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { 
  Check, 
  Crown,
  Zap,
  Rocket,
  Star,
  Users,
  Target,
  Shield
} from "lucide-react";

const plans = [
  {
    name: "مجاني",
    nameEn: "Free",
    price: 0,
    period: "شهرياً",
    description: "للتجربة والبدء",
    features: [
      "5 حملات شهرياً",
      "10 حسابات",
      "دعم بريدي",
      "تقارير أساسية",
    ],
    icon: Zap,
    popular: false,
  },
  {
    name: "احترافي",
    nameEn: "Pro",
    price: 49,
    period: "شهرياً",
    description: "للتجار المحترفين",
    features: [
      "50 حملة شهرياً",
      "100 حساب",
      "دعم أولوية 24/7",
      "تقارير متقدمة",
      "أتمتة ذكية",
      "تعليقات متنوعة",
    ],
    icon: Rocket,
    popular: true,
  },
  {
    name: "مؤسسي",
    nameEn: "Enterprise",
    price: 149,
    period: "شهرياً",
    description: "للشركات الكبيرة",
    features: [
      "حملات غير محدودة",
      "حسابات غير محدودة",
      "مدير حساب مخصص",
      "API مخصص",
      "تقارير مخصصة",
      "تدريب الفريق",
      "SLA مضمون",
    ],
    icon: Crown,
    popular: false,
  },
];

function PlanCard({ plan, isCurrentPlan }: { plan: typeof plans[0]; isCurrentPlan: boolean }) {
  const Icon = plan.icon;
  
  return (
    <Card className={`relative ${plan.popular ? "border-primary" : ""}`} data-testid={`card-plan-${plan.nameEn.toLowerCase()}`}>
      {plan.popular && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-primary">
            <Star className="w-3 h-3 ml-1" />
            الأكثر شعبية
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pb-4">
        <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${plan.popular ? "bg-primary/10" : "bg-muted"}`}>
          <Icon className={`w-7 h-7 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="pt-4">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className="text-muted-foreground mr-1">/{plan.period}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? "outline" : plan.popular ? "default" : "outline"}
          disabled={isCurrentPlan}
          data-testid={`button-select-${plan.nameEn.toLowerCase()}`}
        >
          {isCurrentPlan ? "الباقة الحالية" : "اختيار الباقة"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SubscriptionPage() {
  const { merchant } = useAuth();
  
  const currentPlan = merchant?.subscriptionPlan || "Free";
  const campaignsUsed = 2;
  const campaignsLimit = merchant?.campaignsLimit || 5;
  const accountsUsed = 3;
  const accountsLimit = merchant?.accountsLimit || 10;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold">الاشتراك والباقات</h1>
        <p className="text-muted-foreground mt-1">إدّر اشتراكك واختر الباقة المناسبة لك</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              استهلاك الحملات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="text-muted-foreground">الحملات المستخدمة</span>
              <span className="font-medium" data-testid="text-campaigns-usage">{campaignsUsed} / {campaignsLimit}</span>
            </div>
            <Progress value={(campaignsUsed / campaignsLimit) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              يمكنك إنشاء {campaignsLimit - campaignsUsed} حملات إضافية هذا الشهر
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              استهلاك الحسابات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="text-muted-foreground">الحسابات المضافة</span>
              <span className="font-medium" data-testid="text-accounts-usage">{accountsUsed} / {accountsLimit}</span>
            </div>
            <Progress value={(accountsUsed / accountsLimit) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              يمكنك إضافة {accountsLimit - accountsUsed} حسابات إضافية
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">اختر الباقة المناسبة</h2>
        <p className="text-muted-foreground text-sm">جميع الباقات تشمل تشفير آمن وحماية البيانات</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {plans.map((plan) => (
          <PlanCard 
            key={plan.nameEn} 
            plan={plan} 
            isCurrentPlan={currentPlan === plan.nameEn}
          />
        ))}
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <h3 className="font-semibold mb-1">ضمان استرداد الأموال</h3>
              <p className="text-sm text-muted-foreground">
                نقدم ضمان استرداد كامل خلال 14 يوم إذا لم تكن راضياً عن الخدمة. لا أسئلة!
              </p>
            </div>
            <Button variant="outline" className="shrink-0">
              تواصل معنا
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
