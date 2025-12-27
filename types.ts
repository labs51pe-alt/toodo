
export interface Empresa {
  id: string;
  nombre_comercial: string;
  codigo_acceso: string;
  odoo_url: string;
  odoo_db: string;
  odoo_username: string;
  odoo_api_key: string;
  odoo_company_id?: number; // ID de la compañía específica en Odoo
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

export interface KPIStats {
  totalVentas: number;
  totalMargen: number;
  totalCosto: number;
  unidades: number;
  ticketPromedio: number;
  crecimiento?: number;
}

export interface SedeStats {
  name: string;
  ventas: number;
  margenPct: number;
  transacciones: number;
}
