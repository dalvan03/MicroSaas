import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Professional, Service, Appointment, Transaction } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, subDays, subMonths, startOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DollarSign, Calendar as CalendarIcon, TrendingUp, Scissors, Award, ArrowUpRight, CalendarRange, Eye, EyeOff } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

export default function ProfessionalPerformancePage() {
  const [periodType, setPeriodType] = useState<"today" | "week" | "month" | "year" | "custom">("month");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [hideValues, setHideValues] = useState(false);
  const isMobile = useMobile();
  
  // Calculate date ranges
  const today = new Date();
  let startDate: Date;
  
  if (periodType === "custom" && customDateRange?.from) {
    startDate = customDateRange.from;
  } else {
    switch (periodType) {
      case "today":
        startDate = today;
        break;
      case "week":
        startDate = subDays(today, 7);
        break;
      case "month":
        startDate = startOfMonth(today);
        break;
      case "year":
        startDate = subMonths(today, 12);
        break;
      default:
        startDate = startOfMonth(today);
    }
  }
  
  // Fetch professionals
  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ["/api/professionals"],
  });
  
  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });
  
  // Fetch appointments
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  
  // Fetch transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", periodType, customDateRange],
  });
  
  // Filter data by date range
  const filterByDateRange = <T extends { date: string | Date }>(items: T[]): T[] => {
    return items.filter(item => {
      const itemDate = new Date(item.date);
      if (periodType === "custom" && customDateRange?.from) {
        const endDate = customDateRange.to || today;
        return itemDate >= customDateRange.from && itemDate <= endDate;
      } else {
        return itemDate >= startDate && itemDate <= today;
      }
    });
  };
  
  const filteredAppointments = filterByDateRange(appointments);
  
  // Calculate professional performance metrics
  const professionalMetrics = professionals.map(professional => {
    // Get appointments for this professional
    const profAppointments = filteredAppointments.filter(
      app => app.professionalId === professional.id
    );
    
    // Calculate total services performed
    const totalServices = profAppointments.length;
    
    // Calculate completed services
    const completedServices = profAppointments.filter(
      app => app.status === "completed"
    ).length;
    
    // Calculate revenue
    const revenue = profAppointments
      .filter(app => app.status === "completed")
      .reduce((sum, app) => {
        const service = services.find(s => s.id === app.serviceId);
        return sum + (service?.price || 0);
      }, 0);
    
    // Calculate commission (assuming 30% commission rate for demonstration)
    const commissionRate = 0.3; // This would ideally come from the professional's settings
    const commission = revenue * commissionRate;
    
    return {
      professional,
      totalServices,
      completedServices,
      revenue,
      commission,
      completionRate: totalServices > 0 ? (completedServices / totalServices) * 100 : 0
    };
  }).sort((a, b) => b.revenue - a.revenue); // Sort by revenue
  
  // Generate comparison data for the selected professional
  const generateComparisonData = (professional: Professional) => {
    // Previous period for comparison
    let previousStartDate: Date;
    
    if (periodType === "custom" && customDateRange?.from && customDateRange?.to) {
      // For custom date range, calculate an equivalent previous period
      const rangeDuration = customDateRange.to.getTime() - customDateRange.from.getTime();
      previousStartDate = new Date(customDateRange.from.getTime() - rangeDuration);
    } else {
      switch (periodType) {
        case "today":
          previousStartDate = subDays(startDate, 1);
          break;
        case "week":
          previousStartDate = subDays(startDate, 7);
          break;
        case "month":
          previousStartDate = subMonths(startDate, 1);
          break;
        case "year":
          previousStartDate = subMonths(startDate, 12);
          break;
        default:
          previousStartDate = subMonths(startDate, 1);
      }
    }
    
    // Filter appointments for previous period
    const previousPeriodAppointments = appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate >= previousStartDate && appDate < startDate && app.professionalId === professional.id;
    });
    
    // Calculate previous period metrics
    const previousTotalServices = previousPeriodAppointments.length;
    const previousCompletedServices = previousPeriodAppointments.filter(
      app => app.status === "completed"
    ).length;
    const previousRevenue = previousPeriodAppointments
      .filter(app => app.status === "completed")
      .reduce((sum, app) => {
        const service = services.find(s => s.id === app.serviceId);
        return sum + (service?.price || 0);
      }, 0);
    const previousCommission = previousRevenue * 0.3;
    
    // Current period metrics for this professional
    const currentMetrics = professionalMetrics.find(m => m.professional.id === professional.id);
    
    // Calculate percentage changes
    const revenueChange = previousRevenue > 0 
      ? ((currentMetrics?.revenue || 0) - previousRevenue) / previousRevenue * 100 
      : 100;
    const servicesChange = previousTotalServices > 0 
      ? ((currentMetrics?.totalServices || 0) - previousTotalServices) / previousTotalServices * 100 
      : 100;
    const commissionChange = previousCommission > 0 
      ? ((currentMetrics?.commission || 0) - previousCommission) / previousCommission * 100 
      : 100;
    
    // Generate daily data for charts
    const endDate = periodType === "custom" && customDateRange?.to ? customDateRange.to : today;
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyData = daysInRange.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayAppointments = filteredAppointments.filter(
        app => format(new Date(app.date), "yyyy-MM-dd") === dayStr && app.professionalId === professional.id
      );
      
      const dayRevenue = dayAppointments
        .filter(app => app.status === "completed")
        .reduce((sum, app) => {
          const service = services.find(s => s.id === app.serviceId);
          return sum + (service?.price || 0);
        }, 0);
      
      return {
        date: format(day, "dd/MM"),
        services: dayAppointments.length,
        revenue: dayRevenue,
        commission: dayRevenue * 0.3
      };
    });
    
    return {
      previousPeriod: {
        totalServices: previousTotalServices,
        completedServices: previousCompletedServices,
        revenue: previousRevenue,
        commission: previousCommission
      },
      currentPeriod: {
        totalServices: currentMetrics?.totalServices || 0,
        completedServices: currentMetrics?.completedServices || 0,
        revenue: currentMetrics?.revenue || 0,
        commission: currentMetrics?.commission || 0
      },
      changes: {
        revenue: revenueChange,
        services: servicesChange,
        commission: commissionChange
      },
      dailyData
    };
  };
  
  // Handle opening professional details
  const handleOpenDetails = (professional: Professional) => {
    setSelectedProfessional(professional);
    setDetailsOpen(true);
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <Sidebar>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Desempenho Profissionais</h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setHideValues(!hideValues)}
              title={hideValues ? "Mostrar valores" : "Ocultar valores"}
            >
              {hideValues ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">{hideValues ? "Mostrar valores" : "Ocultar valores"}</span>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Tabs
              defaultValue="month"
              value={periodType}
              onValueChange={(value) => {
                setPeriodType(value as "today" | "week" | "month" | "year" | "custom");
                if (value === "custom") {
                  // If switching to custom, ensure we have a default date range
                  if (!customDateRange?.from) {
                    setCustomDateRange({
                      from: subMonths(new Date(), 1),
                      to: new Date()
                    });
                  }
                }
              }}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mês</TabsTrigger>
                <TabsTrigger value="year">Ano</TabsTrigger>
                <TabsTrigger value="custom">Personalizado</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {periodType === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full sm:w-auto justify-start text-left font-normal"
                  >
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {customDateRange?.from ? (
                      customDateRange.to ? (
                        <>
                          {format(customDateRange.from, "dd/MM/yyyy")} - {format(customDateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(customDateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Selecione um período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={customDateRange?.from}
                    selected={customDateRange}
                    onSelect={setCustomDateRange}
                    numberOfMonths={isMobile ? 1 : 2}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        
        {/* Professional Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {professionalMetrics.map(({ professional, totalServices, completedServices, revenue, commission }) => (
            <Card key={professional.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenDetails(professional)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      {professional.profilePicture ? (
                        <AvatarImage src={professional.profilePicture} alt={professional.name} />
                      ) : (
                        <AvatarFallback className="bg-purple-100 text-purple-700">
                          {getInitials(professional.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{professional.name}</CardTitle>
                      <CardDescription className="text-xs">{professional.email}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={professional.active ? "default" : "outline"} className={professional.active ? "bg-green-600" : ""}>
                    {professional.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Receita</div>
                    <div className="text-xl font-bold text-green-600">
                      {hideValues ? "R$ ******" : `R$ ${revenue.toFixed(2)}`}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Comissão</div>
                    <div className="text-xl font-bold text-red-600">
                      {hideValues ? "R$ ******" : `R$ ${commission.toFixed(2)}`}
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="text-sm text-muted-foreground">Serviços realizados</div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">{completedServices} de {totalServices}</div>
                    <div className="text-sm text-muted-foreground">
                      {totalServices > 0 ? `${Math.round((completedServices / totalServices) * 100)}%` : "0%"}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 py-2">
                <div className="text-sm text-muted-foreground flex items-center w-full justify-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Clique para ver detalhes
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {/* Professional Details Dialog */}
        {selectedProfessional && (
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {selectedProfessional.profilePicture ? (
                      <AvatarImage src={selectedProfessional.profilePicture} alt={selectedProfessional.name} />
                    ) : (
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {getInitials(selectedProfessional.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  Desempenho de {selectedProfessional.name}
                </DialogTitle>
                <DialogDescription>
                  {periodType === "custom" && customDateRange?.from && customDateRange?.to ? (
                    <>Análise de {format(customDateRange.from, "dd/MM/yyyy")} até {format(customDateRange.to, "dd/MM/yyyy")}</>
                  ) : (
                    <>Análise detalhada de desempenho no período selecionado</>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              {/* Generate comparison data */}
              {(() => {
                const comparisonData = generateComparisonData(selectedProfessional);
                return (
                  <div className="space-y-6 py-4">
                    {/* Period Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Receita</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {hideValues ? "R$ ******" : `R$ ${comparisonData.currentPeriod.revenue.toFixed(2)}`}
                          </div>
                          <div className="flex items-center mt-1">
                            <Badge className={cn(
                              "mr-1",
                              comparisonData.changes.revenue >= 0 ? "bg-green-600" : "bg-red-600"
                            )}>
                              {comparisonData.changes.revenue >= 0 ? "+" : ""}
                              {Math.round(comparisonData.changes.revenue)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              vs. período anterior ({hideValues ? "R$ ******" : `R$ ${comparisonData.previousPeriod.revenue.toFixed(2)}`})
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Comissão</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">
                            {hideValues ? "R$ ******" : `R$ ${comparisonData.currentPeriod.commission.toFixed(2)}`}
                          </div>
                          <div className="flex items-center mt-1">
                            <Badge className={cn(
                              "mr-1",
                              comparisonData.changes.commission >= 0 ? "bg-green-600" : "bg-red-600"
                            )}>
                              {comparisonData.changes.commission >= 0 ? "+" : ""}
                              {Math.round(comparisonData.changes.commission)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              vs. período anterior ({hideValues ? "R$ ******" : `R$ ${comparisonData.previousPeriod.commission.toFixed(2)}`})
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Serviços</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {comparisonData.currentPeriod.totalServices}
                          </div>
                          <div className="flex items-center mt-1">
                            <Badge className={cn(
                              "mr-1",
                              comparisonData.changes.services >= 0 ? "bg-green-600" : "bg-red-600"
                            )}>
                              {comparisonData.changes.services >= 0 ? "+" : ""}
                              {Math.round(comparisonData.changes.services)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              vs. período anterior ({comparisonData.previousPeriod.totalServices})
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Revenue Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Receita e Comissão</CardTitle>
                        <CardDescription>
                          Evolução da receita e comissão no período
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={comparisonData.dailyData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: isMobile ? 10 : 12 }}
                                interval={isMobile ? 1 : 0}
                              />
                              <YAxis 
                                tick={{ fontSize: isMobile ? 10 : 12 }}
                              />
                              <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="revenue" 
                                name="Receita" 
                                stroke="#4CAF50" 
                                strokeWidth={2} 
                                dot={{ r: 4 }} 
                              />
                              <Line 
                                type="monotone" 
                                dataKey="commission" 
                                name="Comissão" 
                                stroke="#F44336" 
                                strokeWidth={2} 
                                dot={{ r: 4 }} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Services Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Serviços Realizados</CardTitle>
                        <CardDescription>
                          Quantidade de serviços realizados no período
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData.dailyData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: isMobile ? 10 : 12 }}
                                interval={isMobile ? 1 : 0}
                              />
                              <YAxis 
                                allowDecimals={false}
                                tick={{ fontSize: isMobile ? 10 : 12 }}
                              />
                              <Tooltip />
                              <Bar dataKey="services" name="Serviços" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Sidebar>
  );
}