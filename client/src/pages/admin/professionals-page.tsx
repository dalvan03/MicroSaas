import { useState } from "react";
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
    mutationFn: async (data: { professionalId: number; serviceId: number }) => {
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
    phone: z.string().min(1, "Telefone é obrigatório"),
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
      phone: "",
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
      phone: "",
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
      phone: professional.phone,
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
              
              <Dialog open={newProfessionalOpen} onOpenChange={setNewProfessionalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Profissional
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Profissional</DialogTitle>
                    <DialogDescription>
                      Preencha os dados abaixo para cadastrar um novo profissional.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitNewProfessional)} className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do profissional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="email@exemplo.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input placeholder="(00) 00000-0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input placeholder="000.000.000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input placeholder="Endereço completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="profilePicture"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Foto de Perfil</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-4">
                                {field.value && (
                                  <div className="relative h-16 w-16 rounded-full overflow-hidden border">
                                    <img 
                                      src={field.value} 
                                      alt="Profile" 
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="flex gap-2"
                                  onClick={() => {
                                    // Here you would typically open a file picker
                                    // For now, we'll just use a placeholder URL
                                    const imageUrl = prompt("Insira a URL da imagem (temporário até implementar upload):");
                                    if (imageUrl) field.onChange(imageUrl);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                  {field.value ? "Alterar imagem" : "Adicionar imagem"}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Profissional Ativo</FormLabel>
                              <FormDescription>
                                Profissionais inativos não aparecem para agendamento
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewProfessionalOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createProfessionalMutation.isPending}>
                          {createProfessionalMutation.isPending ? "Cadastrando..." : "Cadastrar Profissional"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Lista de Profissionais</CardTitle>
              <CardDescription>
                Gerenciamento de profissionais do estabelecimento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isProfessionalsLoading ? (
                <div className="text-center py-4">Carregando profissionais...</div>
              ) : filteredProfessionals.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {searchQuery ? "Nenhum profissional encontrado com este termo." : "Nenhum profissional cadastrado."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px] md:w-[300px]">Profissional</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead className="hidden md:table-cell">CPF</TableHead>
                        <TableHead className="hidden md:table-cell">Endereço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfessionals.map((professional) => (
                      <TableRow key={professional.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {professional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{professional.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="text-sm">{professional.email}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="text-sm">{professional.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{professional.cpf}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-1 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="text-sm line-clamp-2">{professional.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {professional.active ? (
                            <Badge className="bg-green-600">Ativo</Badge>
                          ) : (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewProfessional(professional)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteProfessional(professional.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>
          
          {/* Edit Professional Dialog */}
          {editProfessional && (
            <Dialog open={!!editProfessional} onOpenChange={(open) => !open && setEditProfessional(null)}>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Editar Profissional</DialogTitle>
                  <DialogDescription>
                    Altere as informações do profissional.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onSubmitEditProfessional)} className="space-y-4 pt-4">
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={editForm.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Profissional Ativo</FormLabel>
                            <FormDescription>
                              Profissionais inativos não aparecem para agendamento
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditProfessional(null)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={updateProfessionalMutation.isPending}>
                        {updateProfessionalMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Professional Details Dialog */}
          {currentProfessional && (
            <Dialog 
              open={professionalDetailsOpen} 
              onOpenChange={(open) => {
                setProfessionalDetailsOpen(open);
                if (!open) {
                  setCurrentProfessional(null);
                  setServicesTabOpen(false);
                  setScheduleTabOpen(false);
                }
              }}
            >
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Detalhes do Profissional</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 pt-4">
                  <div className="flex flex-col items-center">
                    <Avatar className="w-32 h-32 mb-4">
                      <AvatarFallback className="text-2xl">
                        {currentProfessional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="text-lg font-medium">{currentProfessional.name}</h3>
                    <Badge className={currentProfessional.active ? "bg-green-600 mt-1" : "bg-neutral-600 mt-1"}>
                      {currentProfessional.active ? "Ativo" : "Inativo"}
                    </Badge>
                    
                    <div className="w-full mt-6 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{currentProfessional.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{currentProfessional.phone}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{currentProfessional.cpf}</span>
                      </div>
                      
                      <div className="flex items-start gap-2 text-sm">
                        <div className="mt-0.5 shrink-0">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span>{currentProfessional.address}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-6 w-full">
                      <Button
                        className="flex-1"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProfessional(currentProfessional)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        className="flex-1"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProfessional(currentProfessional.id)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Tabs defaultValue="services">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger 
                          value="services" 
                          onClick={() => {
                            setServicesTabOpen(true);
                            setScheduleTabOpen(false);
                          }}
                        >
                          Serviços
                        </TabsTrigger>
                        <TabsTrigger 
                          value="schedule"
                          onClick={() => {
                            setScheduleTabOpen(true);
                            setServicesTabOpen(false);
                          }}
                        >
                          Horários
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="services" className="pt-4">
                        <h3 className="text-md font-medium mb-4">Serviços Realizados</h3>
                        <div className="space-y-2">
                          {services.map((service) => {
                            const isAssigned = professionalServices.some(s => s.id === service.id);
                            
                            return (
                              <div key={service.id} className="flex items-start space-x-2 rounded-md border p-3">
                                <Checkbox
                                  id={`service-${service.id}`}
                                  checked={isAssigned}
                                  onCheckedChange={() => toggleService(service.id)}
                                />
                                <div className="flex flex-col w-full">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
                                    <label
                                      htmlFor={`service-${service.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer mb-2 sm:mb-0"
                                    >
                                      {service.name}
                                    </label>
                                    <div className="flex items-center mt-2 sm:mt-0">
                                      <span className="text-xs text-muted-foreground mr-2">Comissão:</span>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="h-7 w-24 text-xs"
                                        placeholder="R$ 0,00"
                                        value={professionalServices.find(s => s.id === service.id)?.commission || 0}
                                        disabled={false}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          if (!isAssigned) {
                                            const value = parseFloat(e.target.value) || 0;
                                            updateCommission(service.id, value);
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                  {service.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {service.description}
                                    </p>
                                  )}
                                  <div className="flex mt-1 gap-4 text-xs text-muted-foreground">
                                    <span>Duração: {service.duration} min</span>
                                    <span>Preço: R$ {service.price.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="schedule" className="pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-md font-medium">Horários de Trabalho</h3>
                        </div>
                        
                        {/* Import the ScheduleSelector component */}
                        <ScheduleSelector 
                          initialSchedules={workSchedules.map(schedule => ({
                            dayOfWeek: schedule.dayOfWeek,
                            startTime: schedule.startTime?.toString() || "08:00",
                            endTime: schedule.endTime?.toString() || "18:00"
                          }))}
                          onSave={(schedules) => {
                            // First, delete all existing schedules
                            workSchedules.forEach(schedule => {
                              deleteWorkScheduleMutation.mutate(schedule.id);
                            });
                            
                            // Then add all new schedules
                            schedules.forEach(schedule => {
                              if (currentProfessional) {
                                addWorkScheduleMutation.mutate({
                                  professionalId: currentProfessional.id,
                                  ...schedule,
                                });
                              }
                            });
                          }}
                          isLoading={addWorkScheduleMutation.isPending || deleteWorkScheduleMutation.isPending}
                        />
                        
                        {/* Display existing schedules for reference */}
                        {workSchedules.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-medium mb-2">Horários Atuais</h4>
                            <div className="space-y-2">
                              {workSchedules.map((schedule) => (
                                <div key={schedule.id} className="flex justify-between items-center rounded-md border p-3">
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium">{getDayName(schedule.dayOfWeek)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {schedule.startTime} - {schedule.endTime}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteWorkScheduleMutation.mutate(schedule.id)}
                                    disabled={deleteWorkScheduleMutation.isPending}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setProfessionalDetailsOpen(false)}
                  >
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Profissional</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProfessionalToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDeleteProfessional}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteProfessionalMutation.isPending}
                >
                  {deleteProfessionalMutation.isPending ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
          </Sidebar>
  );
}
