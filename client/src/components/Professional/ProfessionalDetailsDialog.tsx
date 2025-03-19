import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Mail, Phone, User, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScheduleSelector } from "@/components/schedule-selector";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	professional: any;
	services: any[];
	professionalServices: any[];
	workSchedules: any[];
	toggleService: (serviceId: number) => void;
	updateCommission: (serviceId: number, commission: number) => void;
	deleteWorkScheduleMutation: any;
	addWorkScheduleMutation: any;
};

export default function ProfessionalDetailsDialog({
	open,
	onOpenChange,
	professional,
	services,
	professionalServices,
	workSchedules,
	toggleService,
	updateCommission,
	deleteWorkScheduleMutation,
	addWorkScheduleMutation,
}: Props) {
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
								{professional.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<h3 className="text-lg font-medium">{professional.name}</h3>
						<Badge className={professional.active ? "bg-green-600 mt-1" : "bg-neutral-600 mt-1"}>
							{professional.active ? "Ativo" : "Inativo"}
						</Badge>
						{/* ...Contato e endereço... */}
						<div className="flex gap-2 mt-6 w-full">
							<Button variant="outline" size="sm">
								<Edit className="h-4 w-4 mr-1" />
								Editar
							</Button>
							<Button variant="outline" size="sm">
								<Trash className="h-4 w-4 mr-1" />
								Excluir
							</Button>
						</div>
					</div>
					<div>
						<Tabs defaultValue="services">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger
									value="services"
									onClick={() => {
										// ...eventos para alterar abas...
									}}
								>
									Serviços
								</TabsTrigger>
								<TabsTrigger
									value="schedule"
									onClick={() => {
										// ...eventos para alterar abas...
									}}
								>
									Horários
								</TabsTrigger>
							</TabsList>
							<TabsContent value="services" className="pt-4">
								<h3 className="text-md font-medium mb-4">Serviços Realizados</h3>
								<div className="space-y-2">
									{services.map((service) => {
										const isAssigned = professionalServices.some((s) => s.id === service.id);
										return (
											<div key={service.id} className="flex items-start space-x-2 rounded-md border p-3">
												<Checkbox
													checked={isAssigned}
													onCheckedChange={() => toggleService(service.id)}
												/>
												<div className="flex flex-col w-full">
													<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
														<label className="text-sm font-medium cursor-pointer mb-2 sm:mb-0">
															{service.name}
														</label>
														<div className="flex items-center mt-2 sm:mt-0">
															<span className="text-xs mr-2">Comissão:</span>
															<Input
																type="number"
																min="0"
																step="0.01"
																className="h-7 w-24 text-xs"
																value={professionalServices.find((s) => s.id === service.id)?.commission || 0}
																onChange={(e) => {
																	const value = parseFloat(e.target.value) || 0;
																	updateCommission(service.id, value);
																}}
															/>
														</div>
													</div>
													{/* ...descrição, duração e preço... */}
												</div>
											</div>
										);
									})}
								</div>
							</TabsContent>
							<TabsContent value="schedule" className="pt-4">
								<div className="flex justify-between items-center mb-4">
									<h3 className="text-md font-medium">Horários de Trabalho</h3>
								</div>
								<ScheduleSelector
									initialSchedules={workSchedules.map((schedule) => ({
										dayOfWeek: schedule.dayOfWeek,
										startTime: schedule.startTime?.toString() || "08:00",
										endTime: schedule.endTime?.toString() || "18:00",
										lunchStartTime: "12:00",
										lunchEndTime: "13:00",
									}))}
									onSave={(schedules) => {
										// Exclui os existentes e adiciona os novos
										workSchedules.forEach((schedule) => {
											deleteWorkScheduleMutation.mutate(schedule.id);
										});
										schedules.forEach((schedule) => {
											addWorkScheduleMutation.mutate({
												professionalId: professional.id,
												...schedule,
											});
										});
									}}
									isLoading={addWorkScheduleMutation.isPending || deleteWorkScheduleMutation.isPending}
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
