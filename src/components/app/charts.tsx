"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "@/lib/utils";

const gridStroke = "#cbd5e166";
const axisTick = { fontSize: 12, fill: "#64748b" };
const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid rgba(148, 163, 184, 0.28)",
  boxShadow: "0 18px 48px rgba(15, 23, 42, 0.16)",
};

export function HorizontalBars({ data }: { data: { name: string; value: number; color?: string }[] }) {
  if (!data.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} axisLine={false} tickLine={false} tick={axisTick} />
        <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={axisTick} />
        <Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle} cursor={{ fill: "rgba(148, 163, 184, 0.10)" }} />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color ?? "#0f172a"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BalanceLine({ data }: { data: { day: string; saldo: number; trend?: number }[] }) {
  if (!data.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={axisTick} />
        <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} axisLine={false} tickLine={false} tick={axisTick} />
        <Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="saldo" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="trend" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data }: { data: { name: string; value: number; color?: string }[] }) {
  if (!data.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color ?? "#64748b"} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle} />
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CompareBars({ data }: { data: { name: string; current: number; previous: number }[] }) {
  if (!data.length) return <EmptyChart height="h-[300px]" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} axisLine={false} tickLine={false} tick={axisTick} />
        <Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle} cursor={{ fill: "rgba(148, 163, 184, 0.10)" }} />
        <Legend iconType="circle" />
        <Bar dataKey="previous" name="Poprzedni" fill="#94a3b8" radius={[8, 8, 0, 0]} />
        <Bar dataKey="current" name="Ten miesiąc" fill="#2563eb" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseLine({ data }: { data: { label: string; przychody: number; wydatki: number }[] }) {
  if (!data.length) return <EmptyChart height="h-[320px]" />;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} />
        <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} axisLine={false} tickLine={false} tick={axisTick} />
        <Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle} />
        <Legend iconType="circle" />
        <Area type="monotone" dataKey="przychody" stroke="#16a34a" fill="#16a34a33" />
        <Area type="monotone" dataKey="wydatki" stroke="#dc2626" fill="#dc262633" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SavingsLine({ data }: { data: { label: string; oszczednosci: number }[] }) {
  if (!data.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} />
        <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} axisLine={false} tickLine={false} tick={axisTick} />
        <Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="oszczednosci" stroke="#16a34a" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ height = "h-[260px]" }: { height?: string }) {
  return (
    <div className={`grid ${height} place-items-center rounded-lg border border-dashed border-slate-200 bg-white/40 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400`}>
      Brak danych do wykresu
    </div>
  );
}
