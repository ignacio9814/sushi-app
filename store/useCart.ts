import { create } from "zustand";
import { persist } from "zustand/middleware";
import { itemUnitPrice, piecesOfLine } from "@/lib/money";
import {
  REBOZADO_CENTAVOS,
  SALSAS_MAX_PIEZAS,
  type CartItem,
  type Producto,
  type Variante,
} from "@/types";

function sameLine(
  item: CartItem,
  productoId: string,
  varianteNombre?: string,
  conRebozado?: boolean
) {
  return (
    item.producto.id === productoId &&
    item.variante?.nombre === varianteNombre &&
    Boolean(item.conRebozado) === Boolean(conRebozado)
  );
}

interface CartStore {
  items: CartItem[];
  addItem: (producto: Producto, variante?: Variante, conRebozado?: boolean) => void;
  removeItem: (
    productoId: string,
    varianteNombre?: string,
    conRebozado?: boolean
  ) => void;
  updateQuantity: (
    productoId: string,
    cantidad: number,
    varianteNombre?: string,
    conRebozado?: boolean
  ) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalItems: () => number;
  getTotalPieces: () => number;
  includesFreeSauces: () => boolean;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (producto, variante, conRebozado) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex((item) =>
            sameLine(item, producto.id, variante?.nombre, conRebozado)
          );

          if (existingItemIndex >= 0) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              cantidad: updatedItems[existingItemIndex].cantidad + 1,
            };
            return { items: updatedItems };
          }

          return {
            items: [
              ...state.items,
              {
                producto,
                variante,
                cantidad: 1,
                conRebozado,
              },
            ],
          };
        });
      },

      removeItem: (productoId, varianteNombre, conRebozado) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !sameLine(item, productoId, varianteNombre, conRebozado)
          ),
        }));
      },

      updateQuantity: (productoId, cantidad, varianteNombre, conRebozado) => {
        if (cantidad <= 0) {
          get().removeItem(productoId, varianteNombre, conRebozado);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            sameLine(item, productoId, varianteNombre, conRebozado)
              ? { ...item, cantidad }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce((total, item) => {
          const unit = itemUnitPrice(
            item.producto.precio,
            item.variante?.precio,
            Boolean(item.conRebozado),
            REBOZADO_CENTAVOS
          );
          return total + unit * item.cantidad;
        }, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.cantidad, 0);
      },

      getTotalPieces: () => {
        return get().items.reduce((total, item) => total + piecesOfLine(item), 0);
      },

      includesFreeSauces: () => {
        const pieces = get().getTotalPieces();
        return pieces > 0 && pieces <= SALSAS_MAX_PIEZAS;
      },
    }),
    { name: "sushi-cart", skipHydration: true }
  )
);
