import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction, InsertTransaction } from "@shared/schema";
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
  TableFooter,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, ArrowUpCircle, ArrowDownCircle, CalendarIcon, PlusCircle, MinusCircle, Filter, X, Edit, CalendarRange, Search, Plus, Eye, EyeOff } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function FinancePage() {
  const { toast } = useToast();
  const [periodType, setPeriodType] = useState<"today" | "week" | "month" | "year" | "custom">("month");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [newTransactionOpen, setNewTransactionOpen] = useState(false);
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

  // Fetch transactions
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", periodType, customDateRange],
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: Omit<InsertTransaction, "createdAt">) => {
      const res = await apiRequest("POST", "/api/transactions", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transação registrada",
        description: "A transação foi registrada com sucesso.",
      });
      setNewTransactionOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form schema for new transaction
  const formSchema = z.object({
    type: z.enum(["income", "expense"]),
    amount: z.coerce.number().positive({ message: "O valor deve ser maior que zero" }),
    description: z.string().min(1, { message: "Descrição é obrigatória" }),
    date: z.date({ required_error: "Data é obrigatória" }),
    appointmentId: z.string().optional(),
  });

  // Form for new transaction
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "income",
      amount: 0,
      description: "",
      date: new Date(),
      appointmentId: undefined,
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTransactionMutation.mutate({
      ...values,
      date: format(values.date, "yyyy-MM-dd"),
      appointmentId: values.appointmentId ? parseInt(values.appointmentId) : undefined,
    });
  };

  // Filter transactions by date range
  const filterByDateRange = (items: Transaction[]): Transaction[] => {
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

  const filteredTransactions = filterByDateRange(transactions);

  // Calculate summary
  const income = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  // Group transactions by date
  const groupedTransactions: Record<string, Transaction[]> = {};

  filteredTransactions.forEach(transaction => {
    const date = transaction.date;
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(transaction);
  });

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <Sidebar>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Frente De Caixa</h1>

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

            <Dialog open={newTransactionOpen} onOpenChange={setNewTransactionOpen}>
              <DialogTrigger asChild>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Transação</DialogTitle>
                  <DialogDescription>
                    Registre uma nova transação financeira.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Tipo de Transação</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="income" id="income" />
                                <Label htmlFor="income" className="flex items-center">
                                  <ArrowUpCircle className="mr-2 h-4 w-4 text-green-500" />
                                  Receita
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="expense" id="expense" />
                                <Label htmlFor="expense" className="flex items-center">
                                  <ArrowDownCircle className="mr-2 h-4 w-4 text-red-500" />
                                  Despesa
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="number" step="0.01" min="0" placeholder="0.00" className="pl-8" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descreva a transação" {...field} />
                          </FormControl>
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
                                  className="w-full pl-3 text-left font-normal"
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
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={createTransactionMutation.isPending}>
                        {createTransactionMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receitas
              </CardTitle>
              <div className="flex items-center gap-2">
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
                <ArrowUpCircle className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {hideValues ? "R$ ******" : `R$ ${income.toFixed(2)}`}
              </div>
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
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {hideValues ? "R$ ******" : `R$ ${expenses.toFixed(2)}`}
              </div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                balance >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {hideValues ? "R$ ******" : `R$ ${balance.toFixed(2)}`}
              </div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Nova venda */}
        <Card>
          <CardHeader>
            <CardTitle>Nova venda</CardTitle>
            <CardDescription>
              Registre uma nova venda de serviço ou produto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="client-search">Cliente</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="client-search" 
                    placeholder="Buscar cliente por nome..." 
                    className="pl-8"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Cliente não encontrado? 
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 h-auto font-normal" type="button">
                        Cadastrar novo cliente
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Cliente</DialogTitle>
                        <DialogDescription>
                          Preencha os dados para cadastrar um novo cliente.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" placeholder="Nome completo" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="email">Email</Label>
                              <Input id="email" placeholder="email@exemplo.com" type="email" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="phone">Telefone</Label>
                              <Input id="phone" placeholder="(00) 00000-0000" />
                            </div>
                            <div className="grid gap-2">
                            <Label htmlFor="name">CPF</Label>
                            <Input id="name" placeholder="000.000.000-00" />
                          </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button">Salvar Cliente</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Profissional */}
              <div className="space-y-2">
                <Label htmlFor="professional">Profissional</Label>
                <select 
                  id="professional" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um profissional</option>
                  <option value="1">Carlos Ferreira</option>
                  <option value="2">Juliana Mendes</option>
                  <option value="3">Roberto Alves</option>
                </select>
              </div>

              {/* Serviço */}
              <div className="space-y-2">
                <Label htmlFor="service">Serviço</Label>
                <select 
                  id="service" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um serviço</option>
                  <option value="1">Corte de Cabelo - R$ 50,00</option>
                  <option value="2">Coloração - R$ 120,00</option>
                  <option value="3">Manicure - R$ 35,00</option>
                </select>
              </div>

              {/* Produtos e Preços */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Produtos e Serviços</Label>
                  <Button variant="outline" size="sm" type="button">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Item
                  </Button>
                </div>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Corte de Cabelo</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            defaultValue="1" 
                            min="1" 
                            className="w-16 h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            defaultValue="50.00" 
                            min="0" 
                            step="0.01" 
                            className="w-24 h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">R$ 50,00</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Shampoo Profissional</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            defaultValue="1" 
                            min="1" 
                            className="w-16 h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            defaultValue="45.00" 
                            min="0" 
                            step="0.01" 
                            className="w-24 h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">R$ 45,00</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">Valor Total:</TableCell>
                        <TableCell className="text-right font-bold text-lg">R$ 95,00</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button">Cancelar</Button>
                <Button variant="outline" type="button">Salvar</Button>
                <Button type="button" className="bg-green-600 hover:bg-green-700">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Confirmar Pagamento e Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Debts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Agendamentos com pagamentos pendentes</CardTitle>
            <CardDescription>
              Conclua os pagamentos pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Example row */}
                <TableRow>
                  <TableCell>Ana Silva</TableCell>
                  <TableCell>Coloração</TableCell>
                  <TableCell>Juliana Mendes</TableCell>
                  <TableCell>{format(subDays(new Date(), 3), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-right">R$ 120,00</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <Button variant="outline" size="sm">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Registrar Pagamento
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                        <X className="h-4 w-4 mr-1" />
                        Não Compareceu
                      </Button>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        Remarcar
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Carlos Mendes</TableCell>
                  <TableCell>Corte e Barba</TableCell>
                  <TableCell>Roberto Alves</TableCell>
                  <TableCell>{format(subDays(new Date(), 5), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-right">R$ 70,00</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <Button variant="outline" size="sm">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Registrar Pagamento
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                        <X className="h-4 w-4 mr-1" />
                        Não Compareceu
                      </Button>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        Remarcar
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
}
