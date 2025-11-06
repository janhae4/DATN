import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { 
  ChevronUp, 
  ChevronDown, 
  Minus 
} from 'lucide-react'; // <-- ĐÃ THAY ĐỔI

interface StatCardProps {
  icon: ReactNode;
  value: number;
  title: string;
  period: string;
  change?: number;
  unit?: string;
}

export default function StatCard({ 
  icon, 
  value, 
  title, 
  period, 
  change,
  unit = "" 
}: StatCardProps) {

  // --- Logic xử lý cho prop 'change' ---
  const hasChangeValue = change !== undefined;
  let changeDisplay = null;
  
  if (hasChangeValue) {
    const isPositive = change > 0;
    const isNegative = change < 0;
    const absChange = Math.abs(change);

    let bgColorClass = 'bg-gray-100 text-gray-800'; // Dùng màu muted
    let textColorClass = 'text-gray-800';
    let ArrowIcon = Minus; // <-- ĐÃ THAY ĐỔI

    if (isPositive) {
      bgColorClass = 'bg-green-100 text-green-800';
      textColorClass = 'text-green-800';
      ArrowIcon = ChevronUp; // <-- ĐÃ THAY ĐỔI
    } else if (isNegative) {
      bgColorClass = 'bg-red-100 text-red-800';
      textColorClass = 'text-red-800';
      ArrowIcon = ChevronDown; // <-- ĐÃ THAY ĐỔI
    }

    changeDisplay = (
      <div className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        bgColorClass,
        textColorClass
      )}>
        {/* Kích thước icon của Lucide (h-3 w-3) nhỏ hơn Radix một chút (h-4 w-4)
            nên dùng strokeWidth={3} để nó đậm hơn, hoặc tăng size
        */}
        <ArrowIcon className="h-3 w-3" strokeWidth={3} />
        {absChange}%
      </div>
    );
  }
  // --- Hết logic ---

  return (

    <div className="flex flex-col p-4 bg-white border rounded-lg shadow-sm w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-base font-medium text-gray-800">
          <span className="text-gray-600">{icon}</span>
          <span>{title}</span>
        </div>
        {changeDisplay}
      </div>

      <div className="flex flex-wrap justify-between items-end">
        <div>

        <span className="text-4xl font-bold">{value}</span>
        {unit && <span className="ml-2 text-gray-600">{unit}</span>}
        </div>
      <p className="text-sm text-gray-500">{period}</p>
      </div>

    </div>
  );
}