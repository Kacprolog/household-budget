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

export function HorizontalBars({ data }: { data: { name: string; value: number; color?: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => money(Number(value))} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color ?? "#0f172a"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BalanceLine({ data }: { data: { day: string; saldo: number; trend?: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
        <Tooltip formatter={(value) => money(Number(value))} />
        <Line type="monotone" dataKey="saldo" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="trend" stroke="#f97316" strokeDasharray="5 5" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data }: { data: { name: string; value: number; color?: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color ?? "#64748b"} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => money(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CompareBars({ data }: { data: { name: string; current: number; previous: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
        <Tooltip formatter={(value) => money(Number(value))} />
        <Legend />
        <Bar dataKey="previous" name="Poprzedni" fill="#94a3b8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="current" name="Ten miesiąc" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseLine({ data }: { data: { label: string; przychody: number; wydatki: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
        <Tooltip formatter={(value) => money(Number(value))} />
        <Legend />
        <Area type="monotone" dataKey="przychody" stroke="#16a34a" fill="#16a34a33" />
        <Area type="monotone" dataKey="wydatki" stroke="#dc2626" fill="#dc262633" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SavingsLine({ data }: { data: { label: string; oszczednosci: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
        <Tooltip formatter={(value) => money(Number(value))} />
        <Line type="monotone" dataKey="oszczednosci" stroke="#16a34a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
