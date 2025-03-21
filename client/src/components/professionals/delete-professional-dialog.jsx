// src/components/professionals/delete-professional-dialog.jsx
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

export function DeleteProfessionalDialog({ professionalId, open, onOpenChange }) {
  const { toast } = useToast();

  // Delete professional mutation
  const deleteProfessionalMutation = useMutation({
    mutationFn: async (id) => {
      await apiRequest("DELETE", `/api/professionals/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Profissional excluído",
        description: "O profissional foi excluído com sucesso.",
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/professionals"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir profissional",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelete = () => {
    if (professionalId) {
      deleteProfessionalMutation.mutate(professionalId);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Profissional</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteProfessionalMutation.isPending}
          >
            {deleteProfessionalMutation.isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}