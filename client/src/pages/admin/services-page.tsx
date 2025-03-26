// ServicesPage.tsx
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Service, InsertService } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Componentes customizados
import ServiceForm from "@/components/ServiceForm";
import ServiceTable from "@/components/ServiceTable";
import DeleteDialog from "@/components/DeleteDialog";

export default function ServicesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [newServiceOpen, setNewServiceOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

  // Busca dos serviços
  const { data: services = [], isLoading: isServicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Mutation para criação de serviço
  const createServiceMutation = useMutation({
    mutationFn: async (data: InsertService) => {
      const res = await apiRequest("POST", "/api/services", data); // Send data to the backend
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create service"); // Handle backend errors
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Serviço criado",
        description: "O serviço foi criado com sucesso.",
      });
      setNewServiceOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualização de serviço
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertService> }) => {
      const res = await apiRequest("PUT", `/api/services/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Serviço atualizado",
        description: "O serviço foi atualizado com sucesso.",
      });
      setEditService(null);
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para exclusão de serviço
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/services/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso.",
      });
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtragem dos serviços com base na busca
  const filteredServices = services.filter(service => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      (service.description && service.description.toLowerCase().includes(query))
    );
  });

  const handleEditService = (service: Service) => {
    setEditService(service);
  };

  const handleDeleteService = (id: number) => {
    setServiceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteService = () => {
    if (serviceToDelete) {
      deleteServiceMutation.mutate(serviceToDelete);
    }
  };

  return (
    <Sidebar>
      <div className="flex flex-col space-y-6">
        {/* Cabeçalho com busca e botão para novo serviço */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Meus Serviços</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar serviço..."
                className="w-full sm:w-[250px] pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="w-full sm:w-auto" onClick={() => setNewServiceOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          </div>
        </div>

        {/* Tabela de serviços */}
        <ServiceTable 
          services={filteredServices} 
          isLoading={isServicesLoading} 
          onEditService={handleEditService} 
          onDeleteService={handleDeleteService} 
        />

        {/* Diálogo para criar novo serviço */}
        <Dialog open={newServiceOpen} onOpenChange={setNewServiceOpen}>
          <ServiceForm 
            title="Criar Novo Serviço" 
            description="Preencha os dados abaixo para criar um novo serviço." 
            onSubmit={(values) => createServiceMutation.mutate(values)} 
            isPending={createServiceMutation.isPending}
            onCancel={() => setNewServiceOpen(false)}
          />
        </Dialog>

        {/* Diálogo para editar serviço */}
        {editService && (
          <Dialog open={!!editService} onOpenChange={(open) => !open && setEditService(null)}>
            <ServiceForm 
              title="Editar Serviço" 
              description="Altere as informações do serviço." 
              initialValues={{
                name: editService.name,
                description: editService.description || "",
                duration: editService.duration,
                price: editService.price,
                active: editService.active,
              }}
              onSubmit={(values) => updateServiceMutation.mutate({ id: editService.id, data: values })}
              isPending={updateServiceMutation.isPending}
              onCancel={() => setEditService(null)}
            />
          </Dialog>
        )}

        {/* Diálogo de confirmação para exclusão */}
        <DeleteDialog 
          open={deleteConfirmOpen} 
          onCancel={() => setDeleteConfirmOpen(false)} 
          onConfirm={confirmDeleteService}
          isPending={deleteServiceMutation.isPending}
        />
      </div>
    </Sidebar>
  );
}
