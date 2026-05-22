"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTransaction } from "@/lib/actions";

type Category = { id: string; name: string; type: "income" | "expense"; color: string };
type PaymentMethod = { id: string; name: string };

export function QuickAddModal({
  categories,
  paymentMethods,
  descriptions,
}: {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  descriptions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const formRef = useRef<HTMLFormElement>(null);
  const descriptionId = "description-suggestions";
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const filteredCategories = categories.filter((category) => category.type === type);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "n" && !event.metaKey && !event.ctrlKey) setOpen(true);
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:right-6" size="icon" title="Nowa transakcja">
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
                className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold">Nowa transakcja</Dialog.Title>
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
                  <div className="grid grid-cols-2 rounded-md bg-slate-100 p-1 dark:bg-slate-900">
                    {(["expense", "income"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setType(option)}
                        className={`rounded-md px-3 py-2 text-sm font-medium ${type === option ? "bg-white shadow-sm dark:bg-slate-800" : "text-slate-500"}`}
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
                      <Label htmlFor="date">Data</Label>
                      <Input id="date" name="date" type="date" defaultValue={today} required />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Kategoria</Label>
                      <select id="categoryId" name="categoryId" required className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                        {filteredCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethodId">Metoda</Label>
                      <select id="paymentMethodId" name="paymentMethodId" required className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                        {paymentMethods.map((method) => (
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
                      {descriptions.map((description) => (
                        <option key={description} value={description} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurrence">Cykliczność</Label>
                    <select id="recurrence" name="recurrence" className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950" defaultValue="none">
                      <option value="none">Nie</option>
                      <option value="weekly">Co tydzień</option>
                      <option value="monthly">Co miesiąc</option>
                      <option value="yearly">Co rok</option>
                    </select>
                  </div>
                  <Button type="submit">Zapisz transakcję</Button>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
