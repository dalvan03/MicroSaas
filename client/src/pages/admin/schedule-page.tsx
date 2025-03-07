import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Filter, Check, X, Plus, Search } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useMobile } from "@/hooks/use-mobile";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Appointment, Professional, Service, InsertAppointment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export default function SchedulePage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openFilter, setOpenFilter] = useState(false);
  const [openNewAppointment, setOpenNewAppointment] = useState(false);
  
  // Invalidate appointments query when date changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/appointments", format(selectedDate, "yyyy-MM-dd")] });
  }, [selectedDate]);
  const [filters, setFilters] = useState({
    professionalId: "",
    status: "",
    serviceId: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useMobile();

  // Fetch appointments for the selected date
  const { data: appointments = [], isLoading: isAppointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", format(selectedDate, "yyyy-MM-dd")],
    enabled: !!selectedDate,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0, // Override the global staleTime to ensure refetching
    cacheTime: 0, // Don't cache the data to ensure fresh data on each date change
  });

  // Fetch professionals
  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ["/api/professionals"],
  });

  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Fetch users
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Enviando dados para criação de agendamento:", data);
      const res = await apiRequest("POST", "/api/appointments", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });
      setOpenNewAppointment(false);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    if (filters.professionalId && appointment.professionalId.toString() !== filters.professionalId) {
      return false;
    }
    if (filters.serviceId && appointment.serviceId.toString() !== filters.serviceId) {
      return false;
    }
    if (filters.status && appointment.status !== filters.status) {
      return false;
    }
    if (searchQuery) {
      // In a real app, we would search by client name, but we don't have that info here
      return true;
    }
    return true;
  });

  // Form schema for new appointment
  const formSchema = z.object({
    userId: z.string().min(1, { message: "Cliente é obrigatório" }),
    professionalId: z.string().min(1, { message: "Profissional é obrigatório" }),
    serviceId: z.string().min(1, { message: "Serviço é obrigatório" }),
    date: z.date({ required_error: "Data é obrigatória" }),
    startTime: z.string().min(1, { message: "Horário é obrigatório" }),
    notes: z.string().optional(),
  });

  // Form for new appointment
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      professionalId: "",
      serviceId: "",
      startTime: "",
      notes: "",
    },
  });

  // Reset form when opening new appointment dialog
  useEffect(() => {
    if (openNewAppointment) {
      form.reset({
        userId: "",
        professionalId: "",
        serviceId: "",
        date: selectedDate,
        startTime: "",
        notes: "",
      });
    }
  }, [openNewAppointment, selectedDate, form]);

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Get service duration for end time calculation
    const service = services.find(s => s.id.toString() === values.serviceId);
    if (!service) {
      toast({
        title: "Erro",
        description: "Serviço não encontrado",
        variant: "destructive",
      });
      return;
    }

    // Calculate end time based on start time and service duration
    const [hours, minutes] = values.startTime.split(":").map(Number);
    const startDate = new Date(values.date);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + service.duration);

    const appointmentData: InsertAppointment = {
      userId: parseInt(values.userId),
      professionalId: parseInt(values.professionalId),
      serviceId: parseInt(values.serviceId),
      date: format(values.date, "yyyy-MM-dd"),
      startTime: values.startTime,
      endTime: `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}:00`,
      status: "scheduled",
      notes: values.notes || "",
    };

    createAppointmentMutation.mutate(appointmentData);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline">Agendado</Badge>;
      case "completed":
        return <Badge variant="success">Concluído</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "no-show":
        return <Badge variant="warning">Não Compareceu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Sidebar>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Popover open={openFilter} onOpenChange={setOpenFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filtrar Agendamentos</h4>
                    <p className="text-sm text-muted-foreground">
                      Filtre os agendamentos por profissional, serviço ou status.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Select
                        value={filters.professionalId}
                        onValueChange={(value) =>
                          setFilters({ ...filters, professionalId: value })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Profissional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          {professionals.map((professional) => (
                            <SelectItem key={professional.id} value={professional.id.toString()}>
                              {professional.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Select
                        value={filters.serviceId}
                        onValueChange={(value) =>
                          setFilters({ ...filters, serviceId: value })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Select
                        value={filters.status}
                        onValueChange={(value) =>
                          setFilters({ ...filters, status: value })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="scheduled">Agendado</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="no-show">Não Compareceu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setFilters({
                        professionalId: "",
                        status: "",
                        serviceId: "",
                      });
                      setOpenFilter(false);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    size="sm"
                    className="w-full sm:w-[240px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Dialog open={openNewAppointment} onOpenChange={setOpenNewAppointment}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Novo Agendamento</DialogTitle>
                    <DialogDescription>
                      Preencha os dados para criar um novo agendamento.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um cliente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {users.map((user) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="professionalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profissional</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um profissional" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {professionals.map((professional) => (
                                  <SelectItem key={professional.id} value={professional.id.toString()}>
                                    {professional.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="serviceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Serviço</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um serviço" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {services.map((service) => (
                                  <SelectItem key={service.id} value={service.id.toString()}>
                                    {service.name} - {service.duration} min - R$ {service.price.toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Horário</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={createAppointmentMutation.isPending}>
                          {createAppointmentMutation.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agendamentos para {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</CardTitle>
          </CardHeader>
          <CardContent>
            {isAppointmentsLoading ? (
              <div className="flex justify-center items-center h-40">
                <p>Carregando agendamentos...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                <p>Nenhum agendamento encontrado para esta data.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => {
                    const professional = professionals.find(p => p.id === appointment.professionalId);
                    const service = services.find(s => s.id === appointment.serviceId);
                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.startTime.substring(0, 5)}</TableCell>
                        <TableCell>{users.find(u => u.id === appointment.userId)?.name || `Cliente ${appointment.userId}`}</TableCell>
                        <TableCell>{professional?.name || "Desconhecido"}</TableCell>
                        <TableCell>{service?.name || "Desconhecido"}</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
}