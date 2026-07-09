interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientCard({ children, className = "" }: GradientCardProps) {
  return (
    <div className={`relative rounded-xl border border-violet-500/20 bg-card p-5 ${className}`}>
      <div className="absolute inset-0 rounded-xl glow-sm opacity-30" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
