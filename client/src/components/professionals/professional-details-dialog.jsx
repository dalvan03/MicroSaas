// src/components/professionals/professional-details-dialog.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Mail, User, Edit, Trash } from "lucide-react";
import { ProfessionalServicesTab } from "./professional-services-tab";
import { ProfessionalScheduleTab } from "./professional-schedule-tab";

export function ProfessionalDetailsDialog({ 
  professional, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete 
}) {
  const [activeTab, setActiveTab] = useState("services");

  // Fetch professional services
  const { data: professionalServices = [], refetch: refetchProfessionalServices } = useQuery({
    queryKey: ["/api/professionals", professional?.id, "services"],
    enabled: !!professional,
  });

  // Fetch professional schedules
  const { data: workSchedules = [], refetch: refetchWorkSchedules } = useQuery({
    queryKey: ["/api/professionals", professional?.id, "schedules"],
    enabled: !!professional,
  });

  if (!professional) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Profissional</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 pt-4">
          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32 mb-4">
              <AvatarFallback className="text-2xl">
                {professional.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <h3 className="text-lg font-medium">{professional.name}</h3>
            <Badge className={professional.active ? "bg-green-600 mt-1" : "bg-neutral-600 mt-1"}>
              {professional.active ? "Ativo" : "Inativo"}
            </Badge>

            <div className="w-full mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{professional.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{professional.tel}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{professional.cpf}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6 w-full">
              <Button variant="outline" onClick={() => onEdit(professional)}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button variant="outline" onClick={() => onDelete(professional.id)}>
                <Trash className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>

          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="services">Serviços</TabsTrigger>
                <TabsTrigger value="schedule">Horários</TabsTrigger>
              </TabsList>
              <TabsContent value="services" className="pt-4">
                <ProfessionalServicesTab 
                  professionalServices={professionalServices}
                  refetchProfessionalServices={refetchProfessionalServices}
                  professionalId={professional.id}
                />
              </TabsContent>
              <TabsContent value="schedule" className="pt-4">
                <ProfessionalScheduleTab 
                  workSchedules={workSchedules}
                  refetchWorkSchedules={refetchWorkSchedules}
                  professionalId={professional.id}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
