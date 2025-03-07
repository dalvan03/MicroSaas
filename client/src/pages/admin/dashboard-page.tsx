import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/sidebar";
import { useState } from "react";
import { format, subDays, subMonths, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, Transaction } from "@shared/schema";
import { Users, Scissors, DollarSign, Calendar } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("week");
  const isMobile = useMobile();
  
  // Calculate date ranges
  const today = new Date();
  const startDate = dateRange === 'week' 
    ? startOfWeek(today, { weekStartsOn: 1 }) 
    : dateRange === 'month' 
      ? subDays(today, 30) 
      : subMonths(today, 12);
  
  // Fetch appointments
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  
  // Fetch transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });
  
  // Calculate metrics
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(a => a.status === "completed").length;
  const completionRate = totalAppointments ? (completedAppointments / totalAppointments * 100).toFixed(0) : "0";
  
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netProfit = totalIncome - totalExpenses;
  
  // Prepare chart data
  // Daily appointments data
  const daysInRange = eachDayOfInterval({ start: startDate, end: today });
  const appointmentsByDay = daysInRange.map(day => {
    const count = appointments.filter(a => {
      const appDate = new Date(a.date);
      return format(appDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    }).length;
    
    return {
      day: format(day, 'dd/MM'),
      appointments: count
    };
  });
  
  // Service distribution data
  const serviceMap = new Map<number, { name: string; count: number }>();
  appointments.forEach(appointment => {
    const serviceId = appointment.serviceId;
    if (serviceMap.has(serviceId)) {
      const service = serviceMap.get(serviceId)!;
      serviceMap.set(serviceId, { ...service, count: service.count + 1 });
    } else {
      // Since we don't have service details in this query, use a placeholder
      serviceMap.set(serviceId, { name: `Serviço ${serviceId}`, count: 1 });
    }
  });
  
  const serviceData = Array.from(serviceMap.values());
  
  // Financial data for the selected period
  const financialData = daysInRange.map(day => {
    const dayTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return format(txDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
    
    const income = dayTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = dayTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      day: format(day, 'dd/MM'),
      income,
      expenses
    };
  });
  
  // Status distribution
  const statusData = [
    { name: "Agendado", value: appointments.filter(a => a.status === "scheduled").length },
    { name: "Concluído", value: appointments.filter(a => a.status === "completed").length },
    { name: "Cancelado", value: appointments.filter(a => a.status === "cancelled").length },
    { name: "Não Compareceu", value: appointments.filter(a => a.status === "no-show").length },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  return (
    <Sidebar>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <Tabs
            defaultValue="week"
            value={dateRange}
            onValueChange={(value) => setDateRange(value as "week" | "month" | "year")}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="year">Ano</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Agendamentos
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAppointments}</div>
              <p className="text-xs text-muted-foreground">
                {completedAppointments} concluídos ({completionRate}%)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Despesas
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lucro Líquido
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {netProfit.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Agendamentos</CardTitle>
              <CardDescription>
                Número de agendamentos por dia no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      interval={isMobile ? 1 : 0}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="appointments" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Financial Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
              <CardDescription>
                Receitas e despesas por dia no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      interval={isMobile ? 1 : 0}
                    />
                    <YAxis 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="income" fill="#4CAF50" name="Receita" />
                    <Bar dataKey="expenses" fill="#F44336" name="Despesa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Service Distribution */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Serviços</CardTitle>
              <CardDescription>
                Distribuição de agendamentos por serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={serviceData}
                    layout={isMobile ? "vertical" : "horizontal"}
                    margin={{
                      top: 5,
                      right: 30,
                      left: isMobile ? 80 : 30,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    {isMobile ? (
                      <>
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 10 }}
                          width={70}
                        />
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 10 }}
                        />
                      </>
                    ) : (
                      <>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          allowDecimals={false}
                          tick={{ fontSize: 12 }}
                        />
                      </>
                    )}
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Status Distribution */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Distribuição de agendamentos por status
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-[300px] w-full max-w-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => 
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Sidebar>
  );
}
