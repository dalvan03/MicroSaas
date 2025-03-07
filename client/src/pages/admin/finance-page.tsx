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
import { DollarSign, ArrowUpCircle, ArrowDownCircle, CalendarIcon, PlusCircle, MinusCircle, Filter } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
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
import { ScrollArea } from "@/components/ui/scroll-area";

export default function FinancePage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year">("month");
  const [newTransactionOpen, setNewTransactionOpen] = useState(false);
  const isMobile = useMobile();
  
  // Calculate date ranges
  const today = new Date();
  let startDate: Date;
  
  switch (dateRange) {
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
  
  // Fetch transactions
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", dateRange],
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
  
  // Calculate summary
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = income - expenses;
  
  // Group transactions by date
  const groupedTransactions: Record<string, Transaction[]> = {};
  
  transactions.forEach(transaction => {
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
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Tabs
              defaultValue="month"
              value={dateRange}
              onValueChange={(value) => setDateRange(value as "today" | "week" | "month" | "year")}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mês</TabsTrigger>
                <TabsTrigger value="year">Ano</TabsTrigger>
              </TabsList>
            </Tabs>
            
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
              <ArrowUpCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {income.toFixed(2)}</div>
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
              <div className="text-2xl font-bold text-red-600">R$ {expenses.toFixed(2)}</div>
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
                R$ {balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transações</CardTitle>
            <CardDescription>
              Histórico de transações financeiras.
            </CardDescription>
          </CardHeader>
          <CardContent>
              {isTransactionsLoading ? (
                <div className="text-center py-4">Carregando transações...</div>
              ) : sortedDates.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhuma transação encontrada para este período.
                </div>
              ) : (
                <div>
                  {sortedDates.map((date) => (
                    <div key={date} className="mb-6">
                      <h3 className="text-sm font-medium mb-2">
                        {format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </h3>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedTransactions[date].map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                {transaction.type === "income" ? (
                                  <div className="flex items-center text-green-600">
                                    <PlusCircle className="h-4 w-4 mr-1" />
                                    <span>Receita</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-red-600">
                                    <MinusCircle className="h-4 w-4 mr-1" />
                                    <span>Despesa</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell className={cn(
                                "text-right font-medium",
                                transaction.type === "income" ? "text-green-600" : "text-red-600"
                              )}>
                                {transaction.type === "income" ? "+" : "-"}R$ {transaction.amount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="flex justify-between items-center mt-2 px-3">
                        <div className="text-sm text-muted-foreground">
                          Total do dia:
                        </div>
                        <div className="text-sm font-medium">
                          {(() => {
                            const dailyTotal = groupedTransactions[date].reduce((sum, t) => {
                              return sum + (t.type === "income" ? t.amount : -t.amount);
                            }, 0);
                            
                            return (
                              <span className={dailyTotal >= 0 ? "text-green-600" : "text-red-600"}>
                                {dailyTotal >= 0 ? "+" : ""}R$ {dailyTotal.toFixed(2)}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
        
        {/* Outstanding Debts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Clientes em Débito</CardTitle>
            <CardDescription>
              Agendamentos com pagamentos pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
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
                  <TableCell>{format(subDays(new Date(), 3), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-right">R$ 120,00</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Registrar Pagamento
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Carlos Mendes</TableCell>
                  <TableCell>Corte e Barba</TableCell>
                  <TableCell>{format(subDays(new Date(), 5), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-right">R$ 70,00</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Registrar Pagamento
                    </Button>
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
