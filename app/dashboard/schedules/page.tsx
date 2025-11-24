<div>Carregando...</div>
            ) : (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schedules.map((schedule) => (
            <Card key={schedule.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {schedule.subject?.name || 'Disciplina sem nome'}
                    </CardTitle>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(schedule)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(schedule.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {dayLabels[schedule.dayOfWeek] || schedule.dayOfWeek}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Clock className="mr-1 h-3 w-3" />
                        {schedule.startTime} - {schedule.endTime}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <MapPin className="mr-1 h-3 w-3" />
                        {schedule.room}
                    </p>
                    <div className="mt-4 text-xs text-muted-foreground">
                        Turma: {schedule.classEntity?.name}
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
)}

{/* Edit Dialog */ }
<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
    <DialogContent className="max-w-2xl">
        <DialogHeader>
            <DialogTitle>Editar Horário</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitEdit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dia da Semana</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o dia" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {daysOfWeek.map((day) => (
                                        <SelectItem key={day} value={day}>
                                            {dayLabels[day]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Horário Início</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Horário Término</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="room"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sala</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>
            </form>
        </Form>
    </DialogContent>
</Dialog>
        </div >
    );
}
