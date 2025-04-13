import { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  color?: "primary" | "secondary" | "accent";
  subtext?: string;
}

export default function StatsCard({ 
  icon, 
  label, 
  value, 
  color = "primary",
  subtext
}: StatsCardProps) {
  // Get color classes based on the color prop
  const getColorClasses = () => {
    switch (color) {
      case "primary":
        return "bg-primary/10 text-primary";
      case "secondary":
        return "bg-secondary/10 text-secondary";
      case "accent":
        return "bg-accent/10 text-accent";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-lg ${getColorClasses()} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
          {subtext && <p className="text-xs text-neutral-500 mt-1">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}
