// src/components/professionals/new-professional-dialog.jsx
import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { InsertProfessional } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Professional form schema
const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  tel: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  profilePicture: z.string().optional(),
  active: z.boolean().default(true),
});

export function NewProfessionalDialog({ children, open, onOpenChange }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  // Create professional form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      tel: "",
      cpf: "",
      profilePicture: "",
      active: true,
    },
  });

  // Upload image function
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  // Create professional mutation
  const createProfessionalMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/professionals", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profissional criado",
        description: "O profissional foi cadastrado com sucesso.",
      });
      onOpenChange(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/professionals"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar profissional",
        description: error.message,
        variant: "destructive",
      });
      console.log(error);
    },
  });

  const onSubmit = (values) => {
    createProfessionalMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Profissional</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para cadastrar um novo profissional.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do profissional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profilePicture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto de Perfil</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      {field.value && (
                        <div className="relative h-16 w-16 rounded-full overflow-hidden border">
                          <img
                            src={field.value}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const uploadedUrl = await uploadImage(file);
                              field.onChange(uploadedUrl);
                            } catch (err) {
                              toast({
                                title: "Erro ao fazer upload",
                                description: "Não foi possível fazer upload da imagem.",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Plus className="h-4 w-4" />
                        {field.value ? "Alterar imagem" : "Adicionar imagem"}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Profissional Ativo</FormLabel>
                    <FormDescription>
                      Profissionais inativos não aparecem para agendamento
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createProfessionalMutation.isPending}>
                {createProfessionalMutation.isPending ? "Cadastrando..." : "Cadastrar Profissional"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}