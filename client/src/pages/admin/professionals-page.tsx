import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Professional, InsertProfessional, Service, WorkSchedule, InsertWorkSchedule } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
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
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MoreVertical, User, Mail, Phone, MapPin, Plus, Edit, Trash, Calendar } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScheduleSelector } from "@/components/schedule-selector";
import NewProfessionalDialog from "@/components/Professional/NewProfessionalDialog";
import EditProfessionalDialog from "@/components/Professional/EditProfessionalDialog";
import ProfessionalDetailsDialog from "@/components/Professional/ProfessionalDetailsDialog";
import ProfessionalList from "@/components/Professional/ProfessionalList";
import DeleteConfirmationDialog from "@/components/Professional/DeleteConfirmationDialog";

export default function ProfessionalsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [newProfessionalOpen, setNewProfessionalOpen] = useState(false);
  const [editProfessional, setEditProfessional] = useState<Professional | null>(null);
  const [currentProfessional, setCurrentProfessional] = useState<Professional | null>(null);
  const [professionalDetailsOpen, setProfessionalDetailsOpen] = useState(false);
  const [servicesTabOpen, setServicesTabOpen] = useState(false);
  const [scheduleTabOpen, setScheduleTabOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [professionalToDelete, setProfessionalToDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  // Fetch professionals
  const { data: professionals = [], isLoading: isProfessionalsLoading } = useQuery<Professional[]>({
    queryKey: ["/api/professionals"],
  });

  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Fetch professional services
  const { data: professionalServices = [], refetch: refetchProfessionalServices } = useQuery<Service[]>({
    queryKey: ["/api/professionals", currentProfessional?.id, "services"],
    enabled: !!currentProfessional,
  });

  // Fetch professional schedules
  const { data: workSchedules = [], refetch: refetchWorkSchedules } = useQuery<WorkSchedule[]>({
    queryKey: ["/api/professionals", currentProfessional?.id, "schedules"],
    enabled: !!currentProfessional,
  });

  // Create professional mutation
  const createProfessionalMutation = useMutation({
    mutationFn: async (data: InsertProfessional) => {
      const res = await apiRequest("POST", "/api/professionals", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profissional criado",
        description: "O profissional foi cadastrado com sucesso.",
      });
      setNewProfessionalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/professionals"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar profissional",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update professional mutation
  const updateProfessionalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProfessional> }) => {
      const res = await apiRequest("PUT", `/api/professionals/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profissional atualizado",
        description: "O profissional foi atualizado com sucesso.",
      });
      setEditProfessional(null);
      queryClient.invalidateQueries({ queryKey: ["/api/professionals"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar profissional",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete professional mutation
  const deleteProfessionalMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/professionals/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Profissional excluído",
        description: "O profissional foi excluído com sucesso.",
      });
      setDeleteConfirmOpen(false);
      setProfessionalToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/professionals"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir profissional",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add service to professional mutation
  const addServiceToProfessionalMutation = useMutation({
    mutationFn: async (data: { professionalId: number; serviceId: number; commission?: number }) => {
      const res = await apiRequest("POST", "/api/professional-services", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Serviço adicionado",
        description: "O serviço foi adicionado ao profissional com sucesso.",
      });
      if (currentProfessional) {
        refetchProfessionalServices();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove service from professional mutation
  const removeServiceFromProfessionalMutation = useMutation({
    mutationFn: async (data: { professionalId: number; serviceId: number }) => {
      const res = await apiRequest("DELETE", "/api/professional-services", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Serviço removido",
        description: "O serviço foi removido do profissional com sucesso.",
      });
      if (currentProfessional) {
        refetchProfessionalServices();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add work schedule mutation
  const addWorkScheduleMutation = useMutation({
    mutationFn: async (data: InsertWorkSchedule) => {
      const res = await apiRequest("POST", "/api/work-schedules", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Horário adicionado",
        description: "O horário de trabalho foi adicionado com sucesso.",
      });
      if (currentProfessional) {
        refetchWorkSchedules();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar horário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete work schedule mutation
  const deleteWorkScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/work-schedules/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Horário removido",
        description: "O horário de trabalho foi removido com sucesso.",
      });
      if (currentProfessional) {
        refetchWorkSchedules();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover horário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Professional form schema
  const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    tel: z.string().min(1, "Telefone é obrigatório"),
    cpf: z.string().min(1, "CPF é obrigatório"),
    profilePicture: z.string().optional(),
    active: z.boolean().default(true),
  });

  // Create professional form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      tel: "",
      cpf: "",
      profilePicture: "",
      active: true,
    },
  });

  // Edit professional form
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      tel: "",
      cpf: "",
      profilePicture: "",
      active: true,
    },
  });

  // Work schedule form schema
  const scheduleFormSchema = z.object({
    dayOfWeek: z.coerce.number().min(0).max(6),
    startTime: z.string().min(1, "Horário inicial é obrigatório"),
    endTime: z.string().min(1, "Horário final é obrigatório"),
  });

  // Work schedule form
  const scheduleForm = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      dayOfWeek: 1, // Segunda-feira
      startTime: "09:00",
      endTime: "18:00",
    },
  });

  // Set up edit form when a professional is selected for editing
  const handleEditProfessional = (professional: Professional) => {
    setEditProfessional(professional);
    editForm.reset({
      name: professional.name,
      email: professional.email,
      tel: professional.phone,
      cpf: professional.cpf,
      profilePicture: professional.profilePicture || "",
      active: professional.active,
    });
  };

  // Handle professional deletion
  const handleDeleteProfessional = (id: number) => {
    setProfessionalToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteProfessional = () => {
    if (professionalToDelete) {
      deleteProfessionalMutation.mutate(professionalToDelete);
    }
  };

  // Open professional details
  const handleViewProfessional = (professional: Professional) => {
    setCurrentProfessional(professional);
    setProfessionalDetailsOpen(true);
  };

  // Handle form submissions
  const onSubmitNewProfessional = (values: z.infer<typeof formSchema>) => {
    createProfessionalMutation.mutate(values);
  };

  const onSubmitEditProfessional = (values: z.infer<typeof formSchema>) => {
    if (editProfessional) {
      updateProfessionalMutation.mutate({
        id: editProfessional.id,
        data: values,
      });
    }
  };

  const onSubmitSchedule = (values: z.infer<typeof scheduleFormSchema>) => {
    if (currentProfessional) {
      addWorkScheduleMutation.mutate({
        professionalId: currentProfessional.id,
        ...values,
      });
      scheduleForm.reset({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "18:00",
      });
    }
  };

  // Toggle service for professional
  const toggleService = (serviceId: number) => {
    if (!currentProfessional) return;

    const isServiceAssigned = professionalServices.some(s => s.id === serviceId);

    if (isServiceAssigned) {
      removeServiceFromProfessionalMutation.mutate({
        professionalId: currentProfessional.id,
        serviceId,
      });
    } else {
      addServiceToProfessionalMutation.mutate({
        professionalId: currentProfessional.id,
        serviceId,
        commission: 0, // Default commission value
      });
    }
  };

  // Update commission for a professional service
  const updateCommission = (serviceId: number, commission: number) => {
    if (!currentProfessional) return;

    updateProfessionalServiceMutation.mutate({
      professionalId: currentProfessional.id,
      serviceId,
      commission,
    });
  };

  // Add the mutation for updating commission
  const updateProfessionalServiceMutation = useMutation({
    mutationFn: async (data: { professionalId: number; serviceId: number; commission: number }) => {
      const res = await apiRequest("PUT", `/api/professional-services`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Comissão atualizada",
        description: "A comissão foi atualizada com sucesso.",
      });
      if (currentProfessional) {
        refetchProfessionalServices();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar comissão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter professionals based on search query
  const filteredProfessionals = professionals.filter(professional => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      professional.name.toLowerCase().includes(query) ||
      professional.email.toLowerCase().includes(query) ||
      professional.phone.includes(query)
    );
  });

  // Day of week mapping
  const daysOfWeek = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda-feira" },
    { value: 2, label: "Terça-feira" },
    { value: 3, label: "Quarta-feira" },
    { value: 4, label: "Quinta-feira" },
    { value: 5, label: "Sexta-feira" },
    { value: 6, label: "Sábado" },
  ];

  // Get day name by value
  const getDayName = (value: number) => {
    const day = daysOfWeek.find(d => d.value === value);
    return day ? day.label : "Desconhecido";
  };

  return (
    <Sidebar>
      <div className="flex flex-col space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profissionais</h1>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar profissional..."
                className="w-full md:w-[250px] pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button onClick={() => setNewProfessionalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Profissional
            </Button>
          </div>
        </div>
        
        <ProfessionalList
          professionals={professionals}
          filteredProfessionals={filteredProfessionals}
          onViewProfessional={handleViewProfessional}
          onEditProfessional={handleEditProfessional}
          onDeleteProfessional={handleDeleteProfessional}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isLoading={isProfessionalsLoading}
        />
        
        <NewProfessionalDialog
          open={newProfessionalOpen}
          onOpenChange={setNewProfessionalOpen}
          form={form}
          onSubmit={onSubmitNewProfessional}
          isPending={createProfessionalMutation.isPending}
        />
        
        {editProfessional && (
          <EditProfessionalDialog
            open={!!editProfessional}
            onOpenChange={() => setEditProfessional(null)}
            form={editForm}
            onSubmit={onSubmitEditProfessional}
            isPending={updateProfessionalMutation.isPending}
          />
        )}
        
        {currentProfessional && (
          <ProfessionalDetailsDialog
            open={professionalDetailsOpen}
            onOpenChange={(open) => {
              setProfessionalDetailsOpen(open);
              if (!open) {
                setCurrentProfessional(null);
                setServicesTabOpen(false);
                setScheduleTabOpen(false);
              }
            }}
            professional={currentProfessional}
            services={services}
            professionalServices={professionalServices}
            workSchedules={workSchedules}
            toggleService={toggleService}
            updateCommission={updateCommission}
            deleteWorkScheduleMutation={deleteWorkScheduleMutation}
            addWorkScheduleMutation={addWorkScheduleMutation}
          />
        )}
        
        <DeleteConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={confirmDeleteProfessional}
          isPending={deleteProfessionalMutation.isPending}
        />
      </div>
    </Sidebar>
  );
}
