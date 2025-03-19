import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type Props = {
	open: boolean;
	onOpenChange: () => void;
	form: any;
	onSubmit: (values: any) => void;
	isPending: boolean;
};

export default function EditProfessionalDialog({ open, onOpenChange, form, onSubmit, isPending }: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[550px]">
				<DialogHeader>
					<DialogTitle>Editar Profissional</DialogTitle>
					<DialogDescription>
						Altere as informações do profissional.
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
										<input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* ...outros campos semelhantes... */}
						<DialogFooter>
							<Button type="button" variant="outline" onClick={onOpenChange}>
								Cancelar
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? "Salvando..." : "Salvar Alterações"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
