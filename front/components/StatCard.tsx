interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  accentColor: string;
}

export function StatCard({
  icon,
  value,
  label,
  accentColor,
}: StatCardProps) {
  return (
    <div className="group relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${accentColor} rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-lg`} />
      <div className={`relative bg-white rounded-3xl p-8 border border-[#BFC9D1]/20 hover:border-[#BFC9D1]/40 transition-all duration-300 shadow-sm hover:shadow-lg cursor-default`}>
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${accentColor} text-white mb-4 text-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
          {icon}
        </div>
        <div className={`text-4xl font-bold bg-gradient-to-r ${accentColor} bg-clip-text text-transparent`}>
          {value}
        </div>
        <div className="text-sm text-[#25343F]/50 mt-3 font-semibold uppercase tracking-widest">
          {label}
        </div>
      </div>
    </div>
  );
}
