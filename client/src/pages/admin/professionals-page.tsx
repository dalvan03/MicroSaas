// src/pages/professionals.jsx
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Professional } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfessionalsTable } from "@/components/professionals/professionals-table";
import { NewProfessionalDialog } from "@/components/professionals/new-professional-dialog";
import { EditProfessionalDialog } from "@/components/professionals/edit-professional-dialog";
import { ProfessionalDetailsDialog } from "@/components/professionals/professional-details-dialog";
import { DeleteProfessionalDialog } from "@/components/professionals/delete-professional-dialog";

export default function ProfessionalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [newProfessionalOpen, setNewProfessionalOpen] = useState(false);
  const [editProfessional, setEditProfessional] = useState(null);
  const [currentProfessional, setCurrentProfessional] = useState(null);
  const [professionalDetailsOpen, setProfessionalDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [professionalToDelete, setProfessionalToDelete] = useState(null);

  // Fetch professionals
  const { data: professionals = [], isLoading: isProfessionalsLoading } = useQuery({
    queryKey: ["/api/professionals"],
  });

  // Filter professionals based on search query
  const filteredProfessionals = professionals.filter(professional => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      professional.name.toLowerCase().includes(query) ||
      professional.email.toLowerCase().includes(query) ||
      professional.tel.includes(query)
    );
  });

  // Handler functions
  const handleEditProfessional = (professional) => {
    setEditProfessional(professional);
  };

  const handleDeleteProfessional = (id) => {
    setProfessionalToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleViewProfessional = (professional) => {
    setCurrentProfessional(professional);
    setProfessionalDetailsOpen(true);
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

            <NewProfessionalDialog 
              open={newProfessionalOpen} 
              onOpenChange={setNewProfessionalOpen}
            >
              <Button className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Profissional
              </Button>
            </NewProfessionalDialog>
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
            <ProfessionalsTable 
              professionals={filteredProfessionals}
              isLoading={isProfessionalsLoading}
              searchQuery={searchQuery}
              onEdit={handleEditProfessional}
              onDelete={handleDeleteProfessional}
              onView={handleViewProfessional}
            />
          </CardContent>
        </Card>

        {/* Dialogs */}
        <EditProfessionalDialog 
          professional={editProfessional} 
          onOpenChange={(open) => !open && setEditProfessional(null)} 
        />

        <ProfessionalDetailsDialog
          professional={currentProfessional}
          open={professionalDetailsOpen}
          onOpenChange={(open) => {
            setProfessionalDetailsOpen(open);
            if (!open) setCurrentProfessional(null);
          }}
          onEdit={handleEditProfessional}
          onDelete={handleDeleteProfessional}
        />

        <DeleteProfessionalDialog
          professionalId={professionalToDelete}
          open={deleteConfirmOpen}
          onOpenChange={(open) => {
            setDeleteConfirmOpen(open);
            if (!open) setProfessionalToDelete(null);
          }}
        />
      </div>
    </Sidebar>
  );
}