import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: any;
	onSubmit: (values: any) => void;
	isPending: boolean;
};

export default function NewProfessionalDialog({ open, onOpenChange, form, onSubmit, isPending }: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[550px]">
				<DialogHeader>
					<DialogTitle>Cadastrar Novo Profissional</DialogTitle>
					<DialogDescription>
						Preencha os dados abaixo para cadastrar um novo profissional.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
						{/* ...FormFields para name, email, tel, cpf... */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }: any) => (
								<FormItem>
									<FormLabel>Nome Completo</FormLabel>
									<FormControl>
										<input placeholder="Nome do profissional" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* ...outros campos semelhantes... */}
						{/* Campo de imagem com upload */}
						<FormField
							control={form.control}
							name="profilePicture"
							render={({ field }: any) => (
								<FormItem>
									<FormLabel>Foto de Perfil</FormLabel>
									<FormControl>
										<div className="flex items-center gap-4">
											{field.value && (
												<div className="relative h-16 w-16 rounded-full overflow-hidden border">
													<img src={field.value} alt="Profile" className="h-full w-full object-cover" />
												</div>
											)}
											<input
												type="file"
												accept="image/*"
												className="hidden"
												/* O componente pai deve fornecer a lógica de upload se necessário */
												onChange={async (e) => {
													const file = e.target.files?.[0];
													if (file) {
														// ...implementar upload ou chamar callback...
													}
												}}
											/>
											<Button type="button" variant="outline">
												<Plus className="h-4 w-4" />
												{field.value ? "Alterar imagem" : "Adicionar imagem"}
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Campo ativo */}
						<FormField
							control={form.control}
							name="active"
							render={({ field }: any) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Profissional Ativo</FormLabel>
										<FormDescription>
											Profissionais inativos não aparecem para agendamento
										</FormDescription>
									</div>
									<FormControl>
										<input type="checkbox" checked={field.value} onChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
								Cancelar
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? "Cadastrando..." : "Cadastrar Profissional"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
