// app/dashboard/profile/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCw } from "lucide-react";

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    const handleRefresh = async () => {
        try {
            await refreshUser();
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-muted/30 p-8">
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <CardTitle>Meu Perfil</CardTitle>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleLogout}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4-4m-4 4l4 4" />
                            </svg>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <CardDescription>Informações da conta</CardDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Nome</p>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Tipo</p>
                            <p className="font-medium">{user.roles?.[0] ?? "-"}</p>
                        </div>
                        {user.phone && (
                            <div>
                                <p className="text-sm text-muted-foreground">Telefone</p>
                                <p className="font-medium">{user.phone}</p>
                            </div>
                        )}
                        {user.documentNumber && (
                            <div>
                                <p className="text-sm text-muted-foreground">CPF</p>
                                <p className="font-medium">{user.documentNumber}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
