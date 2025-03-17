import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO, startOfWeek, endOfWeek, addDays, isSameDay, parse } from "date-fns";
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
  CardDescription,
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
import { Appointment, Professional, Service, InsertAppointment, WorkSchedule } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ScheduleSelector } from "@/components/schedule-selector";

// Import mock data for demonstration purposes
import { mockAppointments, mockUsers, mockProfessionals, mockServices } from "@/data/mock-appointments";

export default function SchedulePage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openFilter, setOpenFilter] = useState(false);
  const [openNewAppointment, setOpenNewAppointment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  // Invalidate appointments query when date changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/appointments", format(selectedDate, "yyyy-MM-dd")] });
  }, [selectedDate]);
  const [filters, setFilters] = useState({
    professionalId: "",
    status: "",
    serviceId: "",
  });
  const isMobile = useMobile();

  // Time slots for the agenda view
  const timeSlots = [
    "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  // Fetch appointments for the selected date
  const { data: appointments = mockAppointments, isLoading: isAppointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", format(selectedDate, "yyyy-MM-dd")],
    enabled: !!selectedDate,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0, // Override the global staleTime to ensure refetching
  });

  // Fetch professionals
  const { data: professionals = mockProfessionals } = useQuery<Professional[]>({
    queryKey: ["/api/professionals"],
  });

  // Fetch services
  const { data: services = mockServices } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Fetch users
  const { data: users = mockUsers } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Fetch work schedules for the selected professional
  const { data: workSchedules = [] } = useQuery<WorkSchedule[]>({
    queryKey: ["/api/professionals", selectedProfessionalId ? parseInt(selectedProfessionalId) : null, "schedules"],
    enabled: !!selectedProfessionalId,
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
  const filteredAppointments = appointments.filter((appointment: Appointment) => {
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
      setAvailableTimeSlots([]);
      setSelectedProfessionalId("");
      setSelectedServiceId("");
    }
  }, [openNewAppointment, selectedDate, form]);

  // Calculate available time slots when professional or service changes
  useEffect(() => {
    if (!selectedProfessionalId || !selectedServiceId) {
      setAvailableTimeSlots([]);
      return;
    }

    const professionalId = parseInt(selectedProfessionalId);
    const serviceId = parseInt(selectedServiceId);
    const service = services.find(s => s.id === serviceId);

    if (!service) {
      setAvailableTimeSlots([]);
      return;
    }

    // Get professional's work schedule for the selected date
    const dayOfWeek = selectedDate.getDay();
    const professionalSchedules = workSchedules.filter(ws =>
      ws.professionalId === professionalId && ws.dayOfWeek === dayOfWeek
    );

    if (professionalSchedules.length === 0) {
      setAvailableTimeSlots([]);
      return;
    }

    // For simplicity, use the first schedule found
    const schedule = professionalSchedules[0];
    const startTime = parse(schedule.startTime as string, "HH:mm:ss", new Date());
    const endTime = parse(schedule.endTime as string, "HH:mm:ss", new Date());

    // Generate 30-minute slots
    const slots = [];
    let currentTime = startTime;

    while (currentTime < endTime) {
      const timeString = format(currentTime, "HH:mm");

      // Check if this slot is available (not booked already)
      const isSlotAvailable = !appointments.some((app: Appointment) => {
        return app.professionalId === professionalId &&
          app.startTime === timeString &&
          format(new Date(app.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
      });

      // Check if there's enough time for the service
      const serviceEndTime = new Date(currentTime);
      serviceEndTime.setMinutes(serviceEndTime.getMinutes() + service.duration);
      const isEnoughTime = serviceEndTime <= endTime;

      if (isSlotAvailable && isEnoughTime) {
        slots.push(timeString);
      }

      // Increment by 30 minutes
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    setAvailableTimeSlots(slots);
  }, [selectedProfessionalId, selectedServiceId, selectedDate, services, appointments, workSchedules]);

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
        return <Badge variant="secondary">Concluído</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "no-show":
        return <Badge variant="outline">Não Compareceu</Badge>;
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
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar cliente..."
                className="w-full md:w-[200px] pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                  <Button size="sm" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Agendar
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
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedProfessionalId(value);
                              }}
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
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedServiceId(value);
                              }}
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
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: ptBR })
                                    ) : (
                                      <span>Selecione uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    if (date) {
                                      field.onChange(date);
                                    }
                                  }}
                                  disabled={(date) => {
                                    // Disable past dates
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today;
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
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
                            <div className="space-y-2">
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>

                              {availableTimeSlots.length > 0 && (
                                <div className="mt-2">
                                  <FormLabel className="text-sm font-medium">Horários Disponíveis</FormLabel>
                                  <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-input p-2">
                                    <div className="grid grid-cols-3 gap-2">
                                      {availableTimeSlots.map((timeSlot) => (
                                        <Button
                                          key={timeSlot}
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className={cn(
                                            "text-center",
                                            field.value === timeSlot && "bg-purple-100 border-purple-500 text-purple-700"
                                          )}
                                          onClick={() => field.onChange(timeSlot)}
                                        >
                                          {timeSlot}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {selectedProfessionalId && selectedServiceId && availableTimeSlots.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Não há horários disponíveis para esta data e profissional
                                </p>
                              )}

                              <FormMessage />
                            </div>
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

        <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
          {/* Left sidebar with calendar */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-center">{format(selectedDate, "MMMM yyyy", { locale: ptBR })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border w-full"
                initialFocus
              />

              <div className="mt-4">
                <h3 className="font-medium mb-2">Profissionais</h3>
                <div className="space-y-2">
                  {professionals.map((professional) => (
                    <div key={professional.id} className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-purple-600 mr-2"></div>
                      <span className="text-sm">{professional.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right side with agenda view */}
          <Card className="md:col-span-5">
            <CardHeader className="pb-2">
              <CardTitle>Agenda: {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</CardTitle>
            </CardHeader>
            <CardContent>
              {isAppointmentsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Carregando agendamentos...</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[calc(100vh-260px)]">
                  <div className="min-w-full divide-y divide-gray-200">
                    {/* Header with professionals */}
                    <div className="grid grid-cols-[80px_1fr] border-b">
                      <div className="py-0.5 text-[10px] font-medium text-gray-500">Horário</div>
                      <div className="grid grid-cols-1 divide-x">
                        {filters.professionalId ? (
                          <div className="py-2 px-3 text-sm font-medium text-center">
                            {professionals.find(p => p.id.toString() === filters.professionalId)?.name || "Profissional"}
                          </div>
                        ) : (
                          professionals.map(professional => (
                            <div key={professional.id} className="py-2 px-3 text-sm font-medium text-center">
                              {professional.name}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Time slots */}
                    {timeSlots.map((timeSlot) => {
                      // Find appointments for this time slot
                      const slotAppointments = filteredAppointments.filter((app: Appointment) =>
                        app.startTime.substring(0, 5) === timeSlot
                      );

                      return (
                        <div key={timeSlot} className="grid grid-cols-[80px_1fr] hover:bg-gray-50 min-h-[30px]">
                          <div className="py-1 text-[10px] text-gray-500 border-r flex items-center justify-center">{timeSlot}</div>
                          <div className="grid grid-cols-1 divide-x">
                            {filters.professionalId ? (
                              <div className="relative min-h-[30px] p-0.25">
                                {slotAppointments
                                  .filter((appointment: Appointment) => appointment.professionalId.toString() === filters.professionalId)
                                  .map((appointment: Appointment, index: number) => {
                                    const service = services.find(s => s.id === appointment.serviceId);
                                    const user = users.find(u => u.id === appointment.userId);
                                    const professional = professionals.find(p => p.id === appointment.professionalId);
                                    const totalAppointments = slotAppointments.filter(app => app.professionalId.toString() === filters.professionalId).length;
                                    const height = totalAppointments > 1 ? `calc(100% / ${totalAppointments})` : '100%';
                                    const top = totalAppointments > 1 ? `calc(${index} * ${height})` : '0';
                                    
                                    return (
                                      <div
                                        key={appointment.id}
                                        className={`absolute m-0.25 rounded border p-1 text-[9px] leading-none overflow-hidden ${index % 3 === 0 ? 'bg-purple-100 border-purple-300' : index % 3 === 1 ? 'bg-blue-100 border-blue-300' : 'bg-green-100 border-green-300'}`}
                                        style={{
                                          top,
                                          height,
                                          left: 0,
                                          right: 0
                                        }}
                                      >
                                        <div className="font-medium truncate">{user?.name || `Cliente ${appointment.userId}`}</div>
                                        <div className={`truncate ${index % 3 === 0 ? 'text-purple-700' : index % 3 === 1 ? 'text-blue-700' : 'text-green-700'}`}>{service?.name || "Serviço"}</div>
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : (
                              professionals.map(professional => {
                                const profAppointments = slotAppointments.filter((app: Appointment) => app.professionalId === professional.id);
                                return (
                                  <div key={professional.id} className="relative min-h-[30px] p-0.25">
                                    {profAppointments.length > 0 && profAppointments.map((appointment, index) => {
                                      const service = services.find(s => s.id === appointment.serviceId);
                                      const user = users.find(u => u.id === appointment.userId);
                                      const totalAppointments = profAppointments.length;
                                      const height = totalAppointments > 1 ? `calc(100% / ${totalAppointments})` : '100%';
                                      const top = totalAppointments > 1 ? `calc(${index} * ${height})` : '0';
                                      
                                      return (
                                        <div
                                          key={appointment.id}
                                          className={`absolute m-0.25 rounded border p-1 text-[9px] leading-none overflow-hidden ${index % 3 === 0 ? 'bg-purple-100 border-purple-300' : index % 3 === 1 ? 'bg-blue-100 border-blue-300' : 'bg-green-100 border-green-300'}`}
                                          style={{
                                            top,
                                            height,
                                            left: 0,
                                            right: 0
                                          }}
                                        >
                                          <div className="font-medium truncate">{user?.name || `Cliente ${appointment.userId}`}</div>
                                          <div className={`truncate ${index % 3 === 0 ? 'text-purple-700' : index % 3 === 1 ? 'text-blue-700' : 'text-green-700'}`}>
                                            {service?.name || "Serviço"}
                                          </div>
                                          <div className="text-[8px] text-gray-500 truncate">{professional.name}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
              <CardDescription>
                Configure os horários de funcionamento do estabelecimento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleSelector
                onSave={(schedules) => {
                  // Handle save schedules
                  console.log(schedules);
                }}
              />
            </CardContent>
          </Card>
          </div>
      </div>
    </Sidebar>
  );
}