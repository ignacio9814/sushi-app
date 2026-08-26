export interface Variante {
  nombre: string;
  precio: number;
}

export interface Producto {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion?: string;
  variantes?: Variante[];
  precio?: number;
  permite_rebozado?: boolean;
  disponible: boolean;
  imagen_url?: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  orden: number;
}

export interface Configuracion {
  reglas_salsas: string;
  adicional_rebozado: number;
}

export interface SushiData {
  configuracion: Configuracion;
  categorias: Categoria[];
  productos: Producto[];
}

export interface CartItem {
  producto: Producto;
  variante?: Variante;
  cantidad: number;
  conRebozado?: boolean;
}

export type PedidoEstado =
  | "pendiente"
  | "en_preparacion"
  | "listo"
  | "entregado"
  | "cancelado";

export type PedidoPago = "pendiente" | "cobrado";

export type MedioPago = "efectivo" | "transferencia" | "mercadopago";

export const MEDIO_PAGO_LABEL: Record<MedioPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercadopago: "Mercado Pago",
};

export interface PedidoItem {
  productoId: string;
  nombre: string;
  varianteNombre?: string;
  cantidad: number;
  conRebozado: boolean;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  numero: number;
  numeroFormateado: string;
  createdAt: number;
  clienteNombre: string;
  clienteTelefono: string;
  direccion?: string;
  notas?: string;
  items: PedidoItem[];
  totalCentavos: number;
  piezas: number;
  incluyeSalsasGratis: boolean;
  estado: PedidoEstado;
  pago: PedidoPago;
  medioPago?: MedioPago;
  boletaEmitida?: boolean;
  cerradoAt?: number;
}

export const REBOZADO_CENTAVOS = 3000;
export const SALSAS_MAX_PIEZAS = 20;
export const EXTRAS_CATEGORY_ID = "cat_extras";

export function isExtraProduct(producto: { categoria_id: string }) {
  return producto.categoria_id === EXTRAS_CATEGORY_ID;
}
