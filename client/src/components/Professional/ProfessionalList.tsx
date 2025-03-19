import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical, Trash, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
	professionals: any[];
	filteredProfessionals: any[];
	onViewProfessional: (professional: any) => void;
	onEditProfessional: (professional: any) => void;
	onDeleteProfessional: (id: number) => void;
	searchQuery: string;
	setSearchQuery: (q: string) => void;
	isLoading: boolean;
};

export default function ProfessionalList({
	professionals,
	filteredProfessionals,
	onViewProfessional,
	onEditProfessional,
	onDeleteProfessional,
	searchQuery,
	setSearchQuery,
	isLoading,
}: Props) {
	return (
		<div>
			<div className="relative w-full md:w-[250px] mb-4">
				<Input
					type="search"
					placeholder="Buscar profissional..."
					className="w-full pl-8"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>
			{isLoading ? (
				<div className="text-center py-4">Carregando profissionais...</div>
			) : filteredProfessionals.length === 0 ? (
				<div className="text-center py-4 text-muted-foreground">
					{searchQuery ? "Nenhum profissional encontrado com este termo." : "Nenhum profissional cadastrado."}
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[200px] md:w-[300px]">Profissional</TableHead>
								<TableHead>Contato</TableHead>
								<TableHead className="hidden md:table-cell">CPF</TableHead>
								<TableHead className="hidden md:table-cell">Endereço</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredProfessionals.map((professional) => (
								<TableRow key={professional.id}>
									<TableCell>
										<div className="flex items-center space-x-3">
											<Avatar>
												<AvatarFallback>
													{professional.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="font-medium">{professional.name}</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex flex-col">
											<div className="flex items-center">
												<Mail className="h-4 w-4 mr-1" />
												<span className="text-sm">{professional.email}</span>
											</div>
											<div className="flex items-center mt-1">
												<Phone className="h-4 w-4 mr-1" />
												<span className="text-sm">{professional.phone}</span>
											</div>
										</div>
									</TableCell>
									<TableCell className="hidden md:table-cell">{professional.cpf}</TableCell>
									<TableCell className="hidden md:table-cell">
										<div className="flex items-start">
											<MapPin className="h-4 w-4 mr-1 mt-0.5" />
											<span className="text-sm line-clamp-2">{professional.address}</span>
										</div>
									</TableCell>
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
												<DropdownMenuItem onClick={() => onViewProfessional(professional)}>
													<Edit className="h-4 w-4 mr-2" />
													Editar
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem onClick={() => onDeleteProfessional(professional.id)} className="text-red-600">
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
		</div>
	);
}
