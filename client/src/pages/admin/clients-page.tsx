import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
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
  CardFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, Plus, MoreVertical, User as UserIcon, Instagram, Phone, Scissors, UserCheck, Award, Star, Filter, CalendarRange, Edit, ClipboardList } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Appointment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClientsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<"all" | "visits" | "spent" | "recent" | "date">("all");
  const [filterValue, setFilterValue] = useState<"high" | "medium" | "low">("high");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const isMobile = useMobile();

  // Fetch clients (all users with role "client")
  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      // In a real app, this would be a proper API endpoint
      // Mock data for demonstration purposes
      const res = await fetch("/api/user");
      if (!res.ok) {
        return []; // Return empty array if not authenticated or error
      }

      // Return current user as an array for now
      const user = await res.json();
      return [user];
    },
  });

  // Filter clients (only users with role "client")
  const clients = allUsers.filter(user => user.role === "authenticated");

  // Fetch appointments for client details
  const { data: clientAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", selectedClient?.id],
    enabled: !!selectedClient,
    queryFn: async () => {
      // In a real app, this would be a proper API endpoint
      // Mock data for demonstration purposes
      return [];
    },
  });

  // Mock data for client ranking (in a real app, this would come from the backend)
  const topClients = [
    { id: 1, name: "Maria Silva", visits: 24, totalSpent: 2800, lastVisit: "2023-10-15" },
    { id: 2, name: "João Santos", visits: 18, totalSpent: 2100, lastVisit: "2023-10-20" },
    { id: 3, name: "Ana Oliveira", visits: 15, totalSpent: 1750, lastVisit: "2023-10-25" },
  ];

  // Mock data for last professional (in a real app, this would come from the backend)
  const getLastProfessional = (clientId: number) => {
    const professionals = [
      { id: 1, name: "Carlos Ferreira", specialty: "Cabeleireiro" },
      { id: 2, name: "Juliana Mendes", specialty: "Manicure" },
      { id: 3, name: "Roberto Alves", specialty: "Barbeiro" },
    ];

    // Simulate returning a professional based on client ID
    return professionals[clientId % professionals.length];
  };

  // Create new client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente criado",
        description: "O cliente foi criado com sucesso.",
      });
      setNewClientOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form schema for new client
  const formSchema = z.object({
    password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
    name: z.string().min(1, { message: "Nome é obrigatório" }),
    email: z.string().email({ message: "Email inválido" }),
    phone: z.string().optional(),
    address: z.string().optional(),
    instagram: z.string().optional(),
  });

  // Form for new client
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      instagram: "",
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createClientMutation.mutate({
      ...values,
      role: "authenticated",
      profilePicture: "",
    });
  };

  // Apply filters to clients
  const applyFilters = (clientList: any[]) => {
    // First filter by search query
    let filtered = clientList;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client =>
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        (client.phone && client.phone.includes(query))
      );
    }

    // Then apply criteria filters
    if (filterCriteria !== "all") {
      switch (filterCriteria) {
        case "visits":
          filtered = filtered.filter(client => {
            const visits = client.visits || 0;
            if (filterValue === "high") return visits >= 20;
            if (filterValue === "medium") return visits >= 10 && visits < 20;
            return visits < 10;
          });
          break;
        case "spent":
          filtered = filtered.filter(client => {
            const spent = client.totalSpent || 0;
            if (filterValue === "high") return spent >= 2000;
            if (filterValue === "medium") return spent >= 1000 && spent < 2000;
            return spent < 1000;
          });
          break;
        case "recent":
          filtered = filtered.filter(client => {
            if (!client.lastVisit) return false;
            const visitDate = new Date(client.lastVisit);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));

            if (filterValue === "high") return daysDiff <= 7; // Last week
            if (filterValue === "medium") return daysDiff <= 30; // Last month
            return daysDiff > 30; // Older than a month
          });
          break;
        case "date":
          filtered = filtered.filter(client => {
            if (!client.lastVisit || !dateRange?.from) return false;
            const visitDate = new Date(client.lastVisit);

            if (dateRange.to) {
              return visitDate >= dateRange.from && visitDate <= dateRange.to;
            }
            return visitDate >= dateRange.from;
          });
          break;
      }
    }

    return filtered;
  };

  // Filter clients
  const filteredClients = applyFilters(clients);

  // Filter top clients
  const filteredTopClients = applyFilters(topClients);

  return (
    <Sidebar>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto min-w-[320px] max-w-[800px]">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filtrar Clientes</h4>
                    <p className="text-sm text-muted-foreground">
                      Filtre os clientes por critérios específicos.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Select
                        value={filterCriteria}
                        onValueChange={(value) =>
                          setFilterCriteria(value as "all" | "visits" | "spent" | "recent" | "date")
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Critério" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="visits">Visitas</SelectItem>
                          <SelectItem value="spent">Valor Gasto</SelectItem>
                          <SelectItem value="recent">Última Visita</SelectItem>
                          <SelectItem value="date">Período</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {filterCriteria === "date" ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Selecione o período</h4>
                        <div className="grid gap-2">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={isMobile ? 1 : 2}
                            locale={ptBR}
                            className="rounded-md border"
                          />
                          <div className="pt-2 text-sm text-center text-muted-foreground">
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
                          </div>
                        </div>
                      </div>
                    ) : filterCriteria !== "all" ? (
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Select
                          value={filterValue}
                          onValueChange={(value) =>
                            setFilterValue(value as "high" | "medium" | "low")
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Valor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">
                              {filterCriteria === "visits" && "Muitas visitas (20+)"}
                              {filterCriteria === "spent" && "Alto valor (R$2000+)"}
                              {filterCriteria === "recent" && "Última semana"}
                            </SelectItem>
                            <SelectItem value="medium">
                              {filterCriteria === "visits" && "Médio (10-19 visitas)"}
                              {filterCriteria === "spent" && "Médio (R$1000-1999)"}
                              {filterCriteria === "recent" && "Último mês"}
                            </SelectItem>
                            <SelectItem value="low">
                              {filterCriteria === "visits" && "Poucas visitas (<10)"}
                              {filterCriteria === "spent" && "Baixo valor (<R$1000)"}
                              {filterCriteria === "recent" && "Mais de um mês"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}
                  </div>
                  <Button
                    onClick={() => {
                      setFilterCriteria("all");
                      setFilterValue("high");
                      setDateRange({
                        from: subMonths(new Date(), 1),
                        to: new Date(),
                      });
                      setFilterOpen(false);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para cadastrar um novo cliente.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        name="phone"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={createClientMutation.isPending}>
                        {createClientMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Client Ranking Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-purple-600" />
              Ranking de Clientes
            </CardTitle>
            <CardDescription>
              Os clientes mais frequentes do seu salão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredTopClients.length === 0 ?
                (
                  <div className="col-span-3 flex flex-col items-center justify-center py-8 text-center">
                    <UserIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Nenhum cliente encontrado com os filtros selecionados
                    </p>
                    {(filterCriteria !== "all" || searchQuery) && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setFilterCriteria("all");
                          setFilterValue("high");
                          setSearchQuery("");
                          setDateRange({
                            from: subMonths(new Date(), 1),
                            to: new Date(),
                          });
                        }}
                        className="mt-2"
                      >
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                ) :
                (
                  filteredTopClients.map((client, index) => (
                    <div key={client.id} className="flex items-start space-x-4 p-3 rounded-lg border">
                      <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 text-purple-700">
                        {index === 0 ? (
                          <Star className="h-5 w-5 fill-current" />
                        ) : (
                          <span className="font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{client.name}</h4>
                        <div className="flex flex-col mt-1">
                          <span className="text-xs text-muted-foreground">{client.visits} visitas</span>
                          <span className="text-xs text-muted-foreground">R$ {client.totalSpent.toFixed(2)}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        Top {index + 1}
                      </Badge>
                    </div>
                  )))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              Gerencie os clientes do seu salão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isUsersLoading ? (
              <div className="flex justify-center items-center h-40">
                <p>Carregando clientes...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <UserIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                </p>
                {searchQuery && (
                  <Button
                    variant="link"
                    onClick={() => setSearchQuery("")}
                    className="mt-2"
                  >
                    Limpar busca
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <ScrollArea className={isMobile ? "max-h-[400px]" : ""}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Telefone</TableHead>
                        <TableHead className="hidden lg:table-cell">Último Profissional</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => {
                        const lastProfessional = getLastProfessional(client.id);
                        return (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">{client.email}</TableCell>
                            <TableCell className="hidden md:table-cell">{client.phone || "-"}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {lastProfessional ? (
                                <div className="flex items-center gap-2">
                                  <Scissors className="h-3 w-3 text-muted-foreground" />
                                  <span>{lastProfessional.name}</span>
                                  <span className="text-xs text-muted-foreground">({lastProfessional.specialty})</span>
                                </div>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedClient(client);
                                      setClientDetailsOpen(true);
                                    }}
                                  >
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                      }
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Details Dialog */}
      {selectedClient && (
        <Dialog open={clientDetailsOpen} onOpenChange={setClientDetailsOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-purple-600" />
                Detalhes do Cliente
              </DialogTitle>
              <DialogDescription>
                Informações completas do cliente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Profile Information */}
              <div>
                <h3 className="text-lg font-medium">Informações do Perfil</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p>{selectedClient.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{selectedClient.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                    <p>{selectedClient.phone || "Não informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                    <p>{selectedClient.address || "Não informado"}</p>
                  </div>
                  {selectedClient.instagram && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Instagram</p>
                      <div className="flex items-center gap-1">
                        <Instagram className="h-4 w-4 text-pink-600" />
                        <p>{selectedClient.instagram}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Information */}
              <div>
                <h3 className="text-lg font-medium">Informações de Atendimento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Último Profissional</p>
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-purple-600" />
                      <p>
                        {getLastProfessional(selectedClient.id)?.name || "Nenhum atendimento"}
                        {getLastProfessional(selectedClient.id) && (
                          <span className="text-sm text-muted-foreground ml-1">
                            ({getLastProfessional(selectedClient.id)?.specialty})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total de Visitas</p>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <p>{topClients.find(c => c.id === selectedClient.id)?.visits || 0} visitas</p>
                    </div>
                  </div>
                  <div className="space-y-1 col-span-1 sm:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Valor Total Gasto</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600">
                        R$ {topClients.find(c => c.id === selectedClient.id)?.totalSpent.toFixed(2) || "0.00"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Appointments */}
              <div>
                <h3 className="text-lg font-medium">Últimos Agendamentos</h3>
                {clientAppointments.length > 0 ? (
                  <div className="mt-2 border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Serviço</TableHead>
                          <TableHead>Profissional</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>{format(new Date(appointment.date), "dd/MM/yyyy")}</TableCell>
                            <TableCell>Serviço</TableCell>
                            <TableCell>Profissional</TableCell>
                            <TableCell>
                              <Badge
                                className={appointment.status === "completed" ? "bg-green-600" :
                                  appointment.status === "cancelled" ? "bg-red-600" :
                                    "bg-yellow-600"}
                              >
                                {appointment.status === "completed" ? "Concluído" :
                                  appointment.status === "cancelled" ? "Cancelado" :
                                    appointment.status === "no-show" ? "Não Compareceu" : "Agendado"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center border rounded-md mt-2">
                    <ClipboardList className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setClientDetailsOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => {
                // Here you would implement the edit functionality
                // For example, open a new dialog with a form to edit the client
                toast({
                  title: "Funcionalidade em desenvolvimento",
                  description: "A edição de clientes será implementada em breve.",
                });
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Sidebar>
  );
}
