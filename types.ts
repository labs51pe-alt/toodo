
export interface Empresa {
  id: string;
  nombre_comercial: string;
  codigo_acceso: string;
  odoo_url: string;
  odoo_db: string;
  odoo_username: string;
  odoo_api_key: string;
  color_primario: string;
  logo_url: string;
  use_proxy?: boolean;
  yape_numero?: string;
  plin_numero?: string;
  sedes_recojo?: any[];
}

export interface ReporteCierre {
  id: string;
  fecha_reporte: string;
  total_ventas: number;
  total_diferencia: number;
  total_costo: number;
  detalle_json?: any;
  pos_name?: string;
  transacciones?: number;
}

export interface ProductoVendido {
  nombre: string;
  cantidad: number;
  total_venta: number;
  margen: number;
  categoria?: string;
}

export interface PedidoOnline {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  monto_total: number;
  metodo_pago: string;
  estado: string;
  created_at: string;
  sede_recojo?: string;
}

export interface KPIStats {
  totalVentas: number;
  totalMargen: number;
  totalCosto: number;
  unidades: number;
  ticketPromedio: number;
  crecimiento?: number;
}

export interface POSStats {
  name: string;
  value: number;
  tickets: number;
  ticketPromedio: number;
}

export interface SedeStats {
  name: string;
  ventas: number;
  margenPct: number;
}
