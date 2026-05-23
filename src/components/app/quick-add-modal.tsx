"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CreditCard, Plus, Repeat2, Tags, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTransaction } from "@/lib/actions";

type Category = { id: string; name: string; type: "income" | "expense"; color: string };
type PaymentMethod = { id: string; name: string };
type QuickAddData = { categories: Category[]; paymentMethods: PaymentMethod[]; descriptions: string[] };

export function QuickAddModal() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [data, setData] = useState<QuickAddData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const descriptionId = "description-suggestions";
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const filteredCategories = (data?.categories ?? []).filter((category) => category.type === type);
  const selectClass =
    "h-10 w-full rounded-lg border border-slate-200/80 bg-white/80 px-3 text-sm text-slate-950 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/15 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-50 dark:hover:border-slate-700 dark:focus:border-teal-500";

  const loadQuickAddData = useCallback(async () => {
    if (data || loading) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/quick-add", { cache: "no-store" });
      if (!response.ok) throw new Error("Nie udało się pobrać danych formularza.");
      setData((await response.json()) as QuickAddData);
    } catch {
      setError("Nie udało się pobrać list formularza. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }, [data, loading]);

  const changeOpen = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) void loadQuickAddData();
    },
    [loadQuickAddData],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "n" && !event.metaKey && !event.ctrlKey) changeOpen(true);
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeOpen]);

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger asChild>
        <Button className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-slate-950 text-white shadow-[0_16px_42px_rgba(15,23,42,0.30)] transition-transform hover:scale-105 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 md:bottom-6 md:right-6" size="icon" title="Nowa transakcja">
          <Plus className="h-7 w-7" />
        </Button>
      </Dialog.Trigger>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-white/70 bg-white/90 p-5 shadow-[0_28px_90px_rgba(15,23,42,0.28)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/90"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-semibold">Nowa transakcja</Dialog.Title>
                    <Dialog.Description className="text-sm text-slate-500 dark:text-slate-400">Szybki wpis do wspólnego budżetu.</Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Zamknij">
                      <X className="h-5 w-5" />
                    </Button>
                  </Dialog.Close>
                </div>
                <form
                  ref={formRef}
                  action={async (formData) => {
                    await createTransaction(formData);
                    formRef.current?.reset();
                    setOpen(false);
                  }}
                  className="grid gap-4"
                >
                  {loading ? <div className="rounded-lg bg-slate-100/80 px-3 py-2 text-sm text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">Ładowanie list...</div> : null}
                  {error ? <div className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/90 dark:text-red-200">{error}</div> : null}
                  <div className="grid grid-cols-2 rounded-lg bg-slate-100/80 p-1 shadow-inner dark:bg-slate-900/80">
                    {(["expense", "income"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setType(option)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${type === option ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"}`}
                      >
                        {option === "expense" ? "Wydatek" : "Przychód"}
                      </button>
                    ))}
                  </div>
                  <input type="hidden" name="type" value={type} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Kwota</Label>
                      <Input id="amount" name="amount" inputMode="decimal" step="0.01" min="0.01" type="number" required placeholder="0,00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date" className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden /> Data</Label>
                      <Input id="date" name="date" type="date" defaultValue={today} required />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="categoryId" className="inline-flex items-center gap-1.5"><Tags className="h-3.5 w-3.5" aria-hidden /> Kategoria</Label>
                      <select id="categoryId" name="categoryId" required disabled={loading || !filteredCategories.length} className={selectClass}>
                        {filteredCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethodId" className="inline-flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" aria-hidden /> Metoda</Label>
                      <select id="paymentMethodId" name="paymentMethodId" required disabled={loading || !data?.paymentMethods.length} className={selectClass}>
                        {data?.paymentMethods.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Opis</Label>
                    <Textarea id="description" name="description" placeholder="np. zakupy, czynsz, zwrot" />
                    <datalist id={descriptionId}>
                      {data?.descriptions.map((description) => (
                        <option key={description} value={description} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurrence" className="inline-flex items-center gap-1.5"><Repeat2 className="h-3.5 w-3.5" aria-hidden /> Cykliczność</Label>
                    <select id="recurrence" name="recurrence" className={selectClass} defaultValue="none">
                      <option value="none">Nie</option>
                      <option value="weekly">Co tydzień</option>
                      <option value="monthly">Co miesiąc</option>
                      <option value="yearly">Co rok</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={loading || Boolean(error) || !filteredCategories.length || !data?.paymentMethods.length}>Zapisz transakcję</Button>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
