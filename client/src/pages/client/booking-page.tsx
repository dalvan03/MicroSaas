// Melhorias na responsividade do layout
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parse, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, User, Scissors, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useMobile } from "@/hooks/use-mobile";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Service, Professional, WorkSchedule, Appointment } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { ConfirmationDialog } from "./confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function BookingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<number | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Reset selected time and professional when service or date changes
  useEffect(() => {
    setSelectedTimeSlot(null);
    setSelectedProfessional(null);
  }, [selectedService, date]);

  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Fetch professionals who can perform the selected service
  const { data: professionals = [], isLoading: isProfessionalsLoading } = useQuery<Professional[]>({
    queryKey: ["/api/services", selectedService, "professionals"],
    enabled: !!selectedService,
  });

  // Fetch work schedules for the selected professional
  const { data: workSchedules = [] } = useQuery<WorkSchedule[]>({
    queryKey: ["/api/professionals", selectedProfessional, "schedules"],
    enabled: !!selectedProfessional,
  });

  // Fetch existing appointments to check availability
  const { data: appointments = [], isLoading: isAppointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", date ? format(date, "yyyy-MM-dd") : null],
    enabled: !!date && !!selectedService && !!selectedProfessional,
  });

  // Fetch users
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      console.log("Dados do agendamento a serem enviados:", appointmentData);
      const res = await apiRequest("POST", "/api/appointments", appointmentData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agendamento confirmado!",
        description: "Seu horário foi reservado com sucesso.",
      });

      // Reset form and close confirmation
      setSelectedService(null);
      setSelectedTimeSlot(null);
      setSelectedProfessional(null);
      setIsConfirmationOpen(false);

      // Invalidate appointments query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no agendamento",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Find selected service details
  const serviceDetails = services.find(s => s.id === selectedService);

  // Find selected professional details
  const professionalDetails = professionals.find(p => p.id === selectedProfessional);

  // Generate available time slots based on work schedules and existing appointments
  const getAvailableTimeSlots = () => {
    if (!date || !selectedService || !selectedProfessional || !serviceDetails) {
      return [];
    }

    const dayOfWeek = date.getDay();
    const professionalSchedule = workSchedules.find(ws => ws.professionalId === selectedProfessional && ws.dayOfWeek === dayOfWeek);

    if (!professionalSchedule) {
      return []; // Professional doesn't work on this day
    }

    const serviceDuration = serviceDetails.duration;
    const startTime = parse(professionalSchedule.startTime as string, "HH:mm:ss", new Date());
    const endTime = parse(professionalSchedule.endTime as string, "HH:mm:ss", new Date());

    // Generate 30-minute slots
    const slots = [];
    let currentTime = startTime;

    while (currentTime < endTime) {
      const timeString = format(currentTime, "HH:mm");

      // Check if this slot is available (not booked already)
      const isSlotAvailable = !appointments.some(app => {
        return app.professionalId === selectedProfessional && app.startTime === timeString;
      });

      // Check if there's enough time for the service
      const serviceEndTime = addDays(currentTime, 0);
      serviceEndTime.setMinutes(serviceEndTime.getMinutes() + serviceDuration);
      const isEnoughTime = serviceEndTime <= endTime;

      if (isSlotAvailable && isEnoughTime) {
        slots.push(timeString);
      }

      // Increment by 30 minutes
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  };

  const availableTimeSlots = getAvailableTimeSlots();

  const handleBookingConfirmation = () => {
    if (!user || !date || !selectedService || !selectedTimeSlot || !selectedProfessional || !serviceDetails) {
      toast({
        title: "Erro no agendamento",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    // Calculate end time based on service duration
    const startTimeParts = selectedTimeSlot.split(':').map(Number);
    const startDate = new Date(date);
    startDate.setHours(startTimeParts[0], startTimeParts[1], 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + serviceDetails.duration);
    const endTime = format(endDate, "HH:mm");

    // Create appointment
    createAppointmentMutation.mutate({
      userId: user.id,
      professionalId: selectedProfessional,
      serviceId: selectedService,
      date: format(date, "yyyy-MM-dd"),
      startTime: selectedTimeSlot,
      endTime: endTime,
      status: "scheduled"
    });
  };

  const handleConfirmationOpen = () => {
    if (!selectedService || !selectedTimeSlot || !selectedProfessional) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, selecione o serviço, horário e profissional.",
        variant: "destructive",
      });
      return;
    }

    setIsConfirmationOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header transparent={true} />
      
      {/* Hero Banner Carousel */}
      <div className="relative w-full h-[75vh] bg-gradient-to-r from-purple-700 to-purple-900">
        <Carousel className="w-full h-full">
          <CarouselContent className="h-full">
            {/* First Slide */}
            <CarouselItem className="h-full">
              <div className="relative w-full h-full">
                <img 
                  src="https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1769&q=80" 
                  alt="Salão de beleza" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-start pt-32 sm:pt-40 md:pt-60 text-center px-4 sm:px-6">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Transforme seu visual</h1>
                  <p className="text-white text-base sm:text-lg md:text-xl opacity-90 mb-6 max-w-3xl">Nossos profissionais estão prontos para realçar sua beleza natural</p>
                </div>
              </div>
            </CarouselItem>

          </CarouselContent>
        </Carousel>
      </div>

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl -mt-10 relative z-20">
        <div className="mb-12 sm:mb-16 text-center mt-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agendamento de Serviços</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Escolha o serviço, data, horário e profissional para agendar seu atendimento
          </p>
        </div>

        {/* Em dispositivos móveis, use Tabs para navegação entre as etapas */}
        {isMobile ? (
          <div className="mb-6">
            <Tabs defaultValue="service" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="service">Serviço</TabsTrigger>
                <TabsTrigger value="datetime">Data/Hora</TabsTrigger>
                <TabsTrigger value="professional">Profissional</TabsTrigger>
              </TabsList>

              <TabsContent value="service">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Scissors className="h-5 w-5 text-purple-600" />
                      Escolha o Serviço
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedService?.toString()} onValueChange={(value) => setSelectedService(parseInt(value))}>
                      <div className="space-y-3">
                        {services.map((service) => (
                          <div key={service.id} className="flex items-start space-x-3 space-y-0">
                            <RadioGroupItem value={service.id.toString()} id={`service-${service.id}`} />
                            <div className="flex flex-col">
                              <Label htmlFor={`service-${service.id}`} className="font-medium cursor-pointer">
                                {service.name}
                              </Label>
                              {service.description && (
                                <span className="text-sm text-muted-foreground">{service.description}</span>
                              )}
                              <div className="flex items-center gap-4 mt-1 text-sm">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {service.duration} min
                                </span>
                                <span className="font-medium">R$ {service.price.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="datetime">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarIcon className="h-5 w-5 text-purple-600" />
                      Escolha Data e Hora
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col space-y-4">
                    <div>
                      <div className="grid gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              initialFocus
                              disabled={(date) => {
                                // Disable past dates
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date < today;
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {date && selectedService && selectedProfessional && (
                      <div className="space-y-2">
                        <h3 className="font-medium text-sm">Horários Disponíveis</h3>
                        {isAppointmentsLoading ? (
                          <p className="text-sm text-muted-foreground">Carregando horários...</p>
                        ) : availableTimeSlots.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {availableTimeSlots.map((timeSlot) => (
                              <Button
                                key={timeSlot}
                                variant="outline"
                                className={cn(
                                  "text-center border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400",
                                  selectedTimeSlot === timeSlot && "bg-orange-50 border-orange-500 text-orange-700"
                                )}
                                onClick={() => setSelectedTimeSlot(timeSlot)}
                                size="sm"
                              >
                                {timeSlot}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Não há horários disponíveis para esta data
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="professional">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-purple-600" />
                      Escolha o Profissional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!selectedService ? (
                      <p className="text-sm text-muted-foreground">Selecione um serviço primeiro</p>
                    ) : isProfessionalsLoading ? (
                      <p className="text-sm text-muted-foreground">Carregando profissionais...</p>
                    ) : professionals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum profissional disponível para este serviço</p>
                    ) : (
                      <RadioGroup value={selectedProfessional?.toString()} onValueChange={(value) => setSelectedProfessional(parseInt(value))}>
                        <div className="space-y-3">
                          {professionals.map((professional) => (
                            <div key={professional.id} className="flex items-start space-x-3 space-y-0">
                              <RadioGroupItem value={professional.id.toString()} id={`professional-${professional.id}`} />
                              <div className="flex flex-col">
                                <Label htmlFor={`professional-${professional.id}`} className="font-medium cursor-pointer">
                                  {professional.name}
                                </Label>
                                <span className="text-sm text-muted-foreground">{professional.email}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          // Em desktop, mantenha o layout em grid
          <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 md:grid-cols-12">
            {/* Service selection */}
            <Card className="md:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Scissors className="h-5 w-5 text-purple-600" />
                  Serviço
                </CardTitle>
                <CardDescription>Selecione o serviço desejado</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedService?.toString()} onValueChange={(value) => setSelectedService(parseInt(value))}>
                  <div className="space-y-3 sm:space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-start space-x-3 space-y-0">
                        <RadioGroupItem value={service.id.toString()} id={`service-${service.id}`} />
                        <div className="flex flex-col">
                          <Label htmlFor={`service-${service.id}`} className="font-medium cursor-pointer">
                            {service.name}
                          </Label>
                          {service.description && (
                            <span className="text-sm text-muted-foreground">{service.description}</span>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {service.duration} min
                            </span>
                            <span className="font-medium">R$ {service.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Date and time selection */}
            <Card className="md:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CalendarIcon className="h-5 w-5 text-purple-600" />
                  Data e Horário
                </CardTitle>
                <CardDescription>Escolha a data e horário disponível</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col space-y-4">
                <div>
                  <div className="grid gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={(date) => {
                            // Disable past dates
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {date && selectedService && selectedProfessional && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Horários Disponíveis</h3>
                    {isAppointmentsLoading ? (
                      <p className="text-sm text-muted-foreground">Carregando horários...</p>
                    ) : availableTimeSlots.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableTimeSlots.map((timeSlot) => (
                          <Button
                            key={timeSlot}
                            variant="outline"
                            className={cn(
                              "text-center border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400",
                              selectedTimeSlot === timeSlot && "bg-orange-50 border-orange-500 text-orange-700"
                            )}
                            onClick={() => setSelectedTimeSlot(timeSlot)}
                            size={isMobile ? "sm" : "default"}
                          >
                            {timeSlot}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Não há horários disponíveis para esta data
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional selection */}
            <Card className="md:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="h-5 w-5 text-purple-600" />
                  Profissional
                </CardTitle>
                <CardDescription>Escolha o profissional para o atendimento</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedService ? (
                  <p className="text-sm text-muted-foreground">Selecione um serviço primeiro</p>
                ) : isProfessionalsLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando profissionais...</p>
                ) : professionals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum profissional disponível para este serviço</p>
                ) : (
                  <RadioGroup value={selectedProfessional?.toString()} onValueChange={(value) => setSelectedProfessional(parseInt(value))}>
                    <div className="space-y-3 sm:space-y-4">
                      {professionals.map((professional) => (
                        <div key={professional.id} className="flex items-start space-x-3 space-y-0">
                          <RadioGroupItem value={professional.id.toString()} id={`professional-${professional.id}`} />
                          <div className="flex flex-col">
                            <Label htmlFor={`professional-${professional.id}`} className="font-medium cursor-pointer">
                              {professional.name}
                            </Label>
                            <span className="text-sm text-muted-foreground">{professional.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Booking summary and submit button */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">Resumo do Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Serviço</h3>
                <p className="font-medium">{serviceDetails?.name || "Não selecionado"}</p>
                {serviceDetails && (
                  <p className="text-sm text-muted-foreground mt-1">R$ {serviceDetails.price.toFixed(2)}</p>
                )}
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Data</h3>
                <p className="font-medium">{date ? format(date, "PPP", { locale: ptBR }) : "Não selecionada"}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Horário</h3>
                <p className="font-medium">{selectedTimeSlot || "Não selecionado"}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Profissional</h3>
                <p className="font-medium">{professionalDetails?.name || "Não selecionado"}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800"
              size={isMobile ? "default" : "lg"}
              onClick={handleConfirmationOpen}
              disabled={!selectedService || !selectedTimeSlot || !selectedProfessional || createAppointmentMutation.isPending}
            >
              {createAppointmentMutation.isPending ? "Agendando..." : "Confirmar Agendamento"}
            </Button>
          </CardFooter>
        </Card>

        {/* Footer with map */}
        <footer className="mt-12 sm:mt-16 border-t pt-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium">Salão de Beleza & Barbearia</h3>
              <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <a
                  href="https://maps.google.com/?q=Salão+de+Beleza"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                >
                  Rua Exemplo, 123 - Centro - São Paulo/SP
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Telefone: (11) 5555-5555</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                Instagram
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                Facebook
              </a>
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                WhatsApp
              </a>
            </div>
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-center text-muted-foreground">
            © {new Date().getFullYear()} Salão de Beleza & Barbearia. Todos os direitos reservados.
          </p>
        </footer>
      </main>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={isConfirmationOpen}
        onOpenChange={setIsConfirmationOpen}
        onConfirm={handleBookingConfirmation}
        service={serviceDetails}
        date={date}
        time={selectedTimeSlot}
        professional={professionalDetails}
        isLoading={createAppointmentMutation.isPending}
      />
    </div>
  );
}
