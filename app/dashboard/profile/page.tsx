// app/dashboard/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { 
    User, 
    Mail, 
    Phone, 
    FileText, 
    Shield, 
    Calendar, 
    RefreshCw, 
    Edit, 
    Lock,
    CheckCircle2,
    XCircle,
    Clock,
    LogOut,
    Save,
    X
} from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useForm } from "react-hook-form";
import type { UpdateProfileRequest, ChangePasswordRequest } from "@/types/auth.types";

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const editForm = useForm<UpdateProfileRequest>({
        defaultValues: {
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            phone: user?.phone || "",
            documentNumber: user?.documentNumber || "",
        },
    });

    const passwordForm = useForm<ChangePasswordRequest>({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    // Update form when user changes
    useEffect(() => {
        if (user) {
            editForm.reset({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phone: user.phone || "",
                documentNumber: user.documentNumber || "",
            });
        }
    }, [user, editForm]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshUser();
            toast.success("Perfil atualizado com sucesso!");
        } catch (e) {
            console.error(e);
            toast.error("Erro ao atualizar perfil. Tente novamente.");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleEditProfile = async (data: UpdateProfileRequest) => {
        setIsSaving(true);
        try {
            await authService.updateProfile(data);
            await refreshUser();
            setIsEditDialogOpen(false);
            toast.success("Perfil atualizado com sucesso!");
        } catch (error: any) {
            console.error("Erro ao atualizar perfil:", error);
            const errorMessage = error?.message || "Erro ao atualizar perfil. Tente novamente.";
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (data: ChangePasswordRequest) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        if (data.newPassword.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres");
            return;
        }

        setIsSaving(true);
        try {
            await authService.changePassword(data);
            passwordForm.reset();
            setIsPasswordDialogOpen(false);
            toast.success("Senha alterada com sucesso!");
        } catch (error: any) {
            console.error("Erro ao alterar senha:", error);
            const errorMessage = error?.message || "Erro ao alterar senha. Verifique se a senha atual está correta.";
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateString;
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            ADMIN: "Administrador",
            TEACHER: "Professor",
            STUDENT: "Estudante",
            PARENT: "Responsável",
        };
        return labels[role] || role;
    };

    const userRole = user.roles?.[0] ?? "USER";

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Breadcrumbs */}
                <Breadcrumbs 
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Meu Perfil" }
                    ]}
                    className="mb-6"
                />

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
                            <p className="text-muted-foreground">
                                Visualize e gerencie suas informações pessoais
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Atualizar
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sair
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        <CardTitle>Informações Pessoais</CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditDialogOpen(true)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                </div>
                                <CardDescription>
                                    Dados básicos da sua conta
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Nome Completo
                                        </p>
                                        <p className="text-base font-semibold">
                                            {user.firstName} {user.lastName}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            Email
                                        </p>
                                        <p className="text-base font-semibold">{user.email}</p>
                                    </div>
                                    {user.phone && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                Telefone
                                            </p>
                                            <p className="text-base font-semibold">{user.phone}</p>
                                        </div>
                                    )}
                                    {user.documentNumber && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                CPF
                                            </p>
                                            <p className="text-base font-semibold">{user.documentNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Information */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <CardTitle>Informações da Conta</CardTitle>
                                </div>
                                <CardDescription>
                                    Status e configurações da sua conta
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            Tipo de Usuário
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-base font-semibold">
                                                {getRoleLabel(userRole)}
                                            </p>
                                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                {userRole}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            Status da Conta
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {user.active ? (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    <p className="text-base font-semibold text-green-600">Ativa</p>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                    <p className="text-base font-semibold text-red-600">Inativa</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            Email Verificado
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {(user.emailVerified !== undefined ? user.emailVerified : user.active) ? (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    <p className="text-base font-semibold text-green-600">Sim</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="h-4 w-4 text-yellow-600" />
                                                    <p className="text-base font-semibold text-yellow-600">Pendente</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {user.lastLogin && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Último Acesso
                                            </p>
                                            <p className="text-base font-semibold">
                                                {formatDate(user.lastLogin)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Dates */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <CardTitle>Datas da Conta</CardTitle>
                                </div>
                                <CardDescription>
                                    Informações sobre criação e atualização da conta
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Conta Criada em
                                        </p>
                                        <p className="text-base font-semibold">
                                            {formatDate(user.createdAt)}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Última Atualização
                                        </p>
                                        <p className="text-base font-semibold">
                                            {formatDate(user.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ações Rápidas</CardTitle>
                                <CardDescription>
                                    Gerencie sua conta
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => setIsEditDialogOpen(true)}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar Perfil
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => setIsPasswordDialogOpen(true)}
                                >
                                    <Lock className="h-4 w-4 mr-2" />
                                    Alterar Senha
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Account Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumo da Conta</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">ID do Usuário</span>
                                    <span className="text-sm font-mono font-medium">
                                        {typeof user.id === 'string' ? user.id.substring(0, 8) + '...' : user.id}
                                    </span>
                                </div>
                                {user.auth0Id && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Auth0 ID</span>
                                        <span className="text-sm font-mono font-medium">
                                            {user.auth0Id.substring(0, 8)}...
                                        </span>
                                    </div>
                                )}
                                <div className="pt-3 border-t">
                                    <Button 
                                        variant="ghost" 
                                        className="w-full"
                                        onClick={() => router.push('/dashboard')}
                                    >
                                        Voltar ao Dashboard
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                        <DialogDescription>
                            Atualize suas informações pessoais
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={editForm.handleSubmit(handleEditProfile)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nome</Label>
                                <Input
                                    id="firstName"
                                    {...editForm.register("firstName", { required: "Nome é obrigatório" })}
                                />
                                {editForm.formState.errors.firstName && (
                                    <p className="text-sm text-destructive">
                                        {editForm.formState.errors.firstName.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Sobrenome</Label>
                                <Input
                                    id="lastName"
                                    {...editForm.register("lastName", { required: "Sobrenome é obrigatório" })}
                                />
                                {editForm.formState.errors.lastName && (
                                    <p className="text-sm text-destructive">
                                        {editForm.formState.errors.lastName.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="(00) 00000-0000"
                                {...editForm.register("phone")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="documentNumber">CPF</Label>
                            <Input
                                id="documentNumber"
                                placeholder="000.000.000-00"
                                {...editForm.register("documentNumber")}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                disabled={isSaving}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? "Salvando..." : "Salvar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Alterar Senha</DialogTitle>
                        <DialogDescription>
                            Digite sua senha atual e a nova senha
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Senha Atual</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                {...passwordForm.register("currentPassword", { 
                                    required: "Senha atual é obrigatória" 
                                })}
                            />
                            {passwordForm.formState.errors.currentPassword && (
                                <p className="text-sm text-destructive">
                                    {passwordForm.formState.errors.currentPassword.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nova Senha</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                {...passwordForm.register("newPassword", { 
                                    required: "Nova senha é obrigatória",
                                    minLength: {
                                        value: 6,
                                        message: "A senha deve ter pelo menos 6 caracteres"
                                    }
                                })}
                            />
                            {passwordForm.formState.errors.newPassword && (
                                <p className="text-sm text-destructive">
                                    {passwordForm.formState.errors.newPassword.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...passwordForm.register("confirmPassword", { 
                                    required: "Confirmação de senha é obrigatória"
                                })}
                            />
                            {passwordForm.formState.errors.confirmPassword && (
                                <p className="text-sm text-destructive">
                                    {passwordForm.formState.errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsPasswordDialogOpen(false);
                                    passwordForm.reset();
                                }}
                                disabled={isSaving}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                <Lock className="h-4 w-4 mr-2" />
                                {isSaving ? "Alterando..." : "Alterar Senha"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
