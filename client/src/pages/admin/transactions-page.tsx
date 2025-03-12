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
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CalendarIcon, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  CalendarRange,
  Search
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth } from "date-fns";
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

export default function TransactionsPage() {
  const { toast } = useToast();
  const [periodType, setPeriodType] = useState<"today" | "week" | "month" | "year" | "custom">("month");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [editTransactionOpen, setEditTransactionOpen] = useState(false);
  const [newTransactionOpen, setNewTransactionOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
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

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTransaction> }) => {
      const res = await apiRequest("PUT", `/api/transactions/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transação atualizada",
        description: "A transação foi atualizada com sucesso.",
      });
      setEditTransactionOpen(false);
      setCurrentTransaction(null);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Transação excluída",
        description: "A transação foi excluída com sucesso.",
      });
      setDeleteConfirmOpen(false);
      setCurrentTransaction(null);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Transaction form schema
  const formSchema = z.object({
    type: z.enum(["income", "expense"]),
    amount: z.coerce.number().positive({ message: "O valor deve ser maior que zero" }),
    description: z.string().min(1, { message: "Descrição é obrigatória" }),
    date: z.date({ required_error: "Data é obrigatória" }),
    paymentDate: z.date().optional(),
    observation: z.string().optional(),
  });
  
  // Form for new transaction
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "income",
      amount: 0,
      description: "",
      date: new Date(),
      observation: "",
    },
  });

  // Form for edit transaction
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "income",
      amount: 0,
      description: "",
      date: new Date(),
      observation: "",
    },
  });
  
  // Handle form submission for new transaction
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTransactionMutation.mutate({
      ...values,
      date: format(values.date, "yyyy-MM-dd"),
      paymentDate: values.paymentDate ? format(values.paymentDate, "yyyy-MM-dd") : undefined,
    });
  };

  // Handle form submission for edit transaction
  const onSubmitEdit = (values: z.infer<typeof formSchema>) => {
    if (currentTransaction) {
      updateTransactionMutation.mutate({
        id: currentTransaction.id,
        data: {
          ...values,
          date: format(values.date, "yyyy-MM-dd"),
          paymentDate: values.paymentDate ? format(values.paymentDate, "yyyy-MM-dd") : undefined,
        },
      });
    }
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    editForm.reset({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      date: new Date(transaction.date),
      paymentDate: transaction.paymentDate ? new Date(transaction.paymentDate) : undefined,
      observation: transaction.observation || "",
    });
    setEditTransactionOpen(true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTransaction = () => {
    if (currentTransaction) {
      deleteTransactionMutation.mutate(currentTransaction.id);
    }
  };
  
  // Filter transactions by date range and search query
  const filterTransactions = (items: Transaction[]): Transaction[] => {
    return items.filter(item => {
      // Filter by date range
      const itemDate = new Date(item.date);
      let dateMatches = false;
      
      if (periodType === "custom" && customDateRange?.from) {
        const endDate = customDateRange.to || today;
        dateMatches = itemDate >= customDateRange.from && itemDate <= endDate;
      } else {
        dateMatches = itemDate >= startDate && itemDate <= today;
      }

      // Filter by search query
      const searchMatches = !searchQuery || 
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.observation && item.observation.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return dateMatches && searchMatches;
    });
  };

  const filteredTransactions = filterTransactions(transactions);
  
  // Calculate summary
  const income = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = income - expenses;
  
  return (
    <Sidebar>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Movimentações</h1>
          
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

            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar transação..."
                className="w-full md:w-[250px] pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={newTransactionOpen} onOpenChange={setNewTransactionOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Transação
                </Button>
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
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="income"
                                  value="income"
                                  checked={field.value === "income"}
                                  onChange={() => field.onChange("income")}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="income" className="flex items-center">
                                  <ArrowUpCircle className="mr-2 h-4 w-4 text-green-500" />
                                  Receita
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="expense"
                                  value="expense"
                                  checked={field.value === "expense"}
                                  onChange={() => field.onChange("expense")}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="expense" className="flex items-center">
                                  <ArrowDownCircle className="mr-2 h-4 w-4 text-red-500" />
                                  Despesa
                                </Label>
                              </div>
                            </div>
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
                            <Input placeholder="Descreva a transação" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data da Transação</FormLabel>
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
                      
                      <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data de Pagamento/Recebimento</FormLabel>
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
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="observation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observação</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Observações adicionais" {...field} />
                          </FormControl>
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
        
        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Movimentações</CardTitle>
            <CardDescription>
              Histórico detalhado de todas as transações financeiras.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isTransactionsLoading ? (
              <div className="text-center py-4">Carregando transações...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery ? "Nenhuma transação encontrada com este termo." : "Nenhuma transação encontrada para este período."}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Pago/Recebido em</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className={cn(
                          "font-medium",
                          transaction.type === "income" ? "text-green-600" : "text-red-600"
                        )}>
                          R$ {transaction.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {transaction.paymentDate ? format(new Date(transaction.paymentDate), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {transaction.observation || "-"}
                        </TableCell>
                        <TableCell>
                          {transaction.type === "income" ? (
                            <div className="flex items-center text-green-600">
                              <ArrowUpCircle className="h-4 w-4 mr-1" />
                              <span>Receita</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <ArrowDownCircle className="h-4 w-4 mr-1" />
                              <span>Despesa</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTransaction(transaction)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteTransaction(transaction)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">Total Receitas:</TableCell>
                      <TableCell className="font-bold text-green-600">R$ {income.toFixed(2)}</TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">Total Despesas:</TableCell>
                      <TableCell className="font-bold text-red-600">R$ {expenses.toFixed(2)}</TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">Resultado:</TableCell>
                      <TableCell className={cn(
                        "font-bold",
                        balance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        R$ {balance.toFixed(2)}
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Transaction Dialog */}
        <Dialog open={editTransactionOpen} onOpenChange={setEditTransactionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Transação</DialogTitle>
              <DialogDescription>
                Edite os detalhes da transação financeira.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Transação</FormLabel>
                      <FormControl>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="edit-income"
                              value="income"
                              checked={field.value === "income"}
                              onChange={() => field.onChange("income")}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="edit-income" className="flex items-center">
                              <ArrowUpCircle className="mr-2 h-4 w-4 text-green-500" />
                              Receita
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="edit-expense"
                              value="expense"
                              checked={field.value === "expense"}
                              onChange={() => field.onChange("expense")}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="edit-expense" className="flex items-center">
                              <ArrowDownCircle className="mr-2 h-4 w-4 text-red-500" />
                              Despesa
                            </Label>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Descreva a transação" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data da Transação</FormLabel>
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
                  
                  <FormField
                    control={editForm.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Pagamento/Recebimento</FormLabel>
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
                </div>
                
                <FormField
                  control={editForm.control}
                  name="observation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observação</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações adicionais" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={updateTransactionMutation.isPending}>
                    {updateTransactionMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteTransaction}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Sidebar>
  );
}