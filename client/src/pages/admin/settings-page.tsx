import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, Store, Instagram, Facebook, Phone, MapPin } from "lucide-react";

// Define o schema das configurações da loja
const storeSettingsSchema = z.object({
  storeName: z.string().min(1, "Nome da loja é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
  address: z.string().min(1, "Endereço é obrigatório"),
  instagramUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  whatsappUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  facebookUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  googleBusinessUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

type StoreSettings = z.infer<typeof storeSettingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);

  // Busca as configurações da loja
  const { data: storeSettings, isLoading } = useQuery<StoreSettings>({
    queryKey: ["/api/store-settings"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/store-settings");
        return await res.json();
      } catch (error) {
        return {
          storeName: "Minha Loja",
          cnpj: "",
          address: "",
          instagramUrl: "",
          whatsappUrl: "",
          facebookUrl: "",
          googleBusinessUrl: "",
        };
      }
    },
  });

  // Mutação para atualizar as configurações da loja
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: StoreSettings) => {
      const res = await apiRequest("PUT", "/api/store-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As configurações da loja foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/store-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para upload da imagem de perfil
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiRequest("POST", "/api/upload/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Imagem de perfil atualizada",
        description: "A imagem de perfil foi atualizada com sucesso.",
      });
      setProfileImage(data.url);
      queryClient.invalidateQueries({ queryKey: ["/api/store-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar imagem de perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para upload da imagem do banner
  const uploadBannerImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiRequest("POST", "/api/upload/banner", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Banner atualizado",
        description: "O banner da loja foi atualizado com sucesso.",
      });
      setBannerImage(data.url);
      queryClient.invalidateQueries({ queryKey: ["/api/store-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Inicializa o formulário com as configurações da loja
  const form = useForm<StoreSettings>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      storeName: "",
      cnpj: "",
      address: "",
      instagramUrl: "",
      whatsappUrl: "",
      facebookUrl: "",
      googleBusinessUrl: "",
    },
  });

  // Atualiza os valores do formulário assim que as configurações forem carregadas
  useEffect(() => {
    if (storeSettings) {
      form.reset(storeSettings);
      // Opcional: seta as imagens, se estiverem presentes no retorno
      // setProfileImage(storeSettings.profileImageUrl);
      // setBannerImage(storeSettings.bannerImageUrl);
    }
  }, [storeSettings, form]);

  // Manipula a mudança da imagem de perfil
  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Manipula a mudança da imagem do banner
  const handleBannerImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBannerImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função de envio do formulário
  const onSubmit = (values: StoreSettings) => {
    updateSettingsMutation.mutate(values);

    if (profileImageFile) {
      uploadProfileImageMutation.mutate(profileImageFile);
    }
    if (bannerImageFile) {
      uploadBannerImageMutation.mutate(bannerImageFile);
    }
  };

  return (
    <Sidebar>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configurações da Loja</h1>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="general">Informações Gerais</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          {/* Aba de Informações Gerais */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Loja</CardTitle>
                <CardDescription>
                  Configure as informações básicas da sua loja.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex flex-col items-center space-y-2 mb-4">
                        <Avatar className="w-32 h-32 border-2 border-border">
                          {profileImage ? (
                            <AvatarImage src={profileImage} alt="Profile" />
                          ) : (
                            <AvatarFallback className="text-4xl bg-muted">
                              <Store className="h-12 w-12" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <Label htmlFor="profile-upload" className="cursor-pointer">
                          <div className="flex items-center space-x-2 text-sm text-primary hover:underline">
                            <Camera className="h-4 w-4" />
                            <span>Alterar foto</span>
                          </div>
                          <Input
                            id="profile-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfileImageChange}
                          />
                        </Label>
                      </div>

                      <div className="flex-1 space-y-4">
                        <FormField
                          control={form.control}
                          name="storeName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da Loja</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da sua loja" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cnpj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CNPJ</FormLabel>
                              <FormControl>
                                <Input placeholder="00.000.000/0000-00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço</FormLabel>
                              <FormControl>
                                <Input placeholder="Endereço completo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Redes Sociais</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="instagramUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instagram URL</FormLabel>
                              <FormControl>
                                <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                                  <Instagram className="ml-2 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    placeholder="https://instagram.com/sualoja"
                                    className="border-0 focus-visible:ring-0"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="whatsappUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WhatsApp URL</FormLabel>
                              <FormControl>
                                <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                                  <Phone className="ml-2 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    placeholder="https://wa.me/5500000000000"
                                    className="border-0 focus-visible:ring-0"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="facebookUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facebook URL</FormLabel>
                              <FormControl>
                                <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                                  <Facebook className="ml-2 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    placeholder="https://facebook.com/sualoja"
                                    className="border-0 focus-visible:ring-0"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="googleBusinessUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Google Business URL</FormLabel>
                              <FormControl>
                                <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                                  <MapPin className="ml-2 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    placeholder="https://business.google.com/sualoja"
                                    className="border-0 focus-visible:ring-0"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="mt-4"
                      disabled={
                        updateSettingsMutation.isPending ||
                        uploadProfileImageMutation.isPending ||
                        uploadBannerImageMutation.isPending
                      }
                    >
                      {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Aparência */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Aparência da Loja</CardTitle>
                <CardDescription>
                  Personalize a aparência da sua loja com imagens e banners.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Banner da Loja</h3>
                    <div className="border rounded-md p-4">
                      <div className="aspect-video w-full overflow-hidden rounded-md bg-muted mb-4">
                        {bannerImage ? (
                          <img 
                            src={bannerImage} 
                            alt="Banner" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-muted">
                            <p className="text-muted-foreground">Nenhum banner selecionado</p>
                          </div>
                        )}
                      </div>
                      <Label htmlFor="banner-upload" className="cursor-pointer">
                        <div className="flex items-center justify-center space-x-2 p-2 border rounded-md hover:bg-muted transition-colors">
                          <Upload className="h-4 w-4" />
                          <span>Alterar banner da loja</span>
                        </div>
                        <Input
                          id="banner-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerImageChange}
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-2">
                        Recomendado: 1200 x 400 pixels. Formato: JPG, PNG ou GIF.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Sidebar>
  );
}