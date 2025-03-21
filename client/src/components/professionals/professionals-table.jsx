// src/components/professionals/professionals-table.jsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Mail, Edit, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProfessionalsTable({ 
  professionals, 
  isLoading,
  searchQuery,
  onEdit, 
  onDelete, 
  onView 
}) {
  if (isLoading) {
    return <div className="text-center py-4">Carregando profissionais...</div>;
  }

  if (professionals.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {searchQuery ? "Nenhum profissional encontrado com este termo." : "Nenhum profissional cadastrado."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] md:w-[300px]">Profissional</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead className="hidden md:table-cell">CPF</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {professionals.map((professional) => (
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
                    <span className="text-sm">{professional.tel}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{professional.cpf}</TableCell>
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
                    <DropdownMenuItem onClick={() => onView(professional)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(professional)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDelete(professional.id)}
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
  );
}