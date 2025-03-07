import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, subMonths, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { cn } from "@/lib/utils";
import { CalendarRange, Download, Filter, CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Appointment, Service, Professional, Transaction } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"services" | "clients" | "finance" | "schedule">("services");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const isMobile = useMobile();
  
  // Fetch service data
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });
  
  // Fetch professional data
  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ["/api/professionals"],
  });
  
  // Fetch appointments
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  
  // Fetch transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });
  
  // Filter data by date range
  const filterByDateRange = <T extends { date: string | Date }>(items: T[]): T[] => {
    if (!dateRange?.from) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item.date);
      if (dateRange.from && dateRange.to) {
        return itemDate >= dateRange.from && itemDate <= dateRange.to;
      }
      return itemDate >= dateRange.from;
    });
  };
  
  const filteredAppointments = filterByDateRange(appointments);
  const filteredTransactions = filterByDateRange(transactions);
  
  // Prepare data for services report
  const serviceReportData = services.map(service => {
    const serviceAppointments = filteredAppointments.filter(a => a.serviceId === service.id);
    const completedAppointments = serviceAppointments.filter(a => a.status === "completed");
    
    const revenue = completedAppointments.length * service.price;
    
    return {
      id: service.id,
      name: service.name,
      appointments: serviceAppointments.length,
      completed: completedAppointments.length,
      revenue: revenue,
    };
  }).sort((a, b) => b.appointments - a.appointments);
  
  // Prepare data for clients report
  const clientsById = filteredAppointments.reduce((acc, appointment) => {
    const userId = appointment.userId;
    if (!acc[userId]) {
      acc[userId] = {
        id: userId,
        appointments: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        revenue: 0,
      };
    }
    
    acc[userId].appointments += 1;
    
    if (appointment.status === "completed") {
      acc[userId].completed += 1;
      // Find service price
      const service = services.find(s => s.id === appointment.serviceId);
      if (service) {
        acc[userId].revenue += service.price;
      }
    } else if (appointment.status === "cancelled") {
      acc[userId].cancelled += 1;
    } else if (appointment.status === "no-show") {
      acc[userId].noShow += 1;
    }
    
    return acc;
  }, {} as Record<number, { id: number; appointments: number; completed: number; cancelled: number; noShow: number; revenue: number; }>);
  
  const clientReportData = Object.values(clientsById).sort((a, b) => b.appointments - a.appointments);
  
  // Prepare data for finance report
  const incomeByDay = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);
  
  const expensesByDay = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);
  
  // Create an array of all dates in the range
  const allDates = dateRange?.from && dateRange?.to
    ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
    : [];
  
  const financeReportData = allDates.map(date => {
    const dateStr = format(date, "yyyy-MM-dd");
    return {
      date: format(date, "dd/MM"),
      income: incomeByDay[dateStr] || 0,
      expenses: expensesByDay[dateStr] || 0,
      profit: (incomeByDay[dateStr] || 0) - (expensesByDay[dateStr] || 0),
    };
  });
  
  // Prepare data for schedule report
  const appointmentsByDay = filteredAppointments.reduce((acc, appointment) => {
    const date = appointment.date;
    if (!acc[date]) {
      acc[date] = {
        date,
        total: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
      };
    }
    
    acc[date].total += 1;
    
    if (appointment.status === "completed") {
      acc[date].completed += 1;
    } else if (appointment.status === "cancelled") {
      acc[date].cancelled += 1;
    } else if (appointment.status === "no-show") {
      acc[date].noShow += 1;
    }
    
    return acc;
  }, {} as Record<string, { date: string; total: number; completed: number; cancelled: number; noShow: number; }>);
  
  const scheduleReportData = Object.values(appointmentsByDay).map(day => ({
    ...day,
    date: format(new Date(day.date), "dd/MM"),
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate summary metrics
  const totalAppointments = filteredAppointments.length;
  const completedAppointments = filteredAppointments.filter(a => a.status === "completed").length;
  const cancelledAppointments = filteredAppointments.filter(a => a.status === "cancelled").length;
  const noShowAppointments = filteredAppointments.filter(a => a.status === "no-show").length;
  
  const totalIncome = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netProfit = totalIncome - totalExpenses;
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <Sidebar>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full sm:w-auto justify-start text-left font-normal"
                >
                  <CalendarRange className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
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
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={isMobile ? 1 : 2}
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="services" value={reportType} onValueChange={(value) => setReportType(value as any)}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="finance">Financeiro</TabsTrigger>
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
          </TabsList>
          
          {/* Services Report */}
          <TabsContent value="services" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAppointments}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Serviços Realizados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedAppointments}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalAppointments ? Math.round((completedAppointments / totalAppointments) * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Serviços Mais Populares</CardTitle>
                <CardDescription>
                  Número de agendamentos por serviço no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={serviceReportData}
                      layout={isMobile ? "vertical" : "horizontal"}
                      margin={{
                        top: 5,
                        right: 30,
                        left: isMobile ? 100 : 30,
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
                            width={90}
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
                      <Bar dataKey="appointments" fill="#8884d8" name="Agendamentos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Sidebar>
  );
}
