// ServiceTable.tsx
import React from 'react';
import { Service } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign, MoreVertical, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ServiceTableProps {
  services: Service[];
  isLoading: boolean;
  onEditService: (service: Service) => void;
  onDeleteService: (id: number) => void;
}

export default function ServiceTable({
  services,
  isLoading,
  onEditService,
  onDeleteService,
}: ServiceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Serviços</CardTitle>
        <CardDescription>
          Gerencie os serviços oferecidos pelo seu estabelecimento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Carregando serviços...</div>
        ) : services.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum serviço cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] sm:w-[300px]">Serviço</TableHead>
                  <TableHead className="hidden sm:table-cell">Duração</TableHead>
                  <TableHead className="hidden sm:table-cell">Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{service.name}</span>
                        {service.description && (
                          <span className="text-sm text-muted-foreground">{service.description}</span>
                        )}
                        <div className="flex items-center gap-4 sm:hidden">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-sm">{service.duration} min</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-sm">R$ {service.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{service.duration} minutos</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>R$ {service.price.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.active ? (
                        <span className="bg-green-600 text-white px-2 py-1 rounded">Ativo</span>
                      ) : (
                        <span className="border px-2 py-1 rounded">Inativo</span>
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
                          <DropdownMenuItem onClick={() => onEditService(service)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => onDeleteService(service.id)}
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
  );
}
