/**
 * Feedback Header
 */

interface FeedbackHeaderProps {
  title: string;
  subtitle?: string;
}

export function FeedbackHeader({ title, subtitle }: FeedbackHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
