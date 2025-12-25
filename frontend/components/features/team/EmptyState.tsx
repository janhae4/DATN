// 3. Empty State
export function EmptyState({ icon: Icon, title, description }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground/80">
      <div className="p-3 bg-muted rounded-full mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="text-xs max-w-[200px]">{description}</p>
    </div>
  );
}