export type Toast = { id: number; message: string };
type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(toasts);
}

/** Show a transient toast message (auto-dismisses). */
export function toast(message: string) {
  const id = nextId++;
  toasts = [...toasts, { id, message }];
  emit();
  setTimeout(() => dismiss(id), 3500);
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}
