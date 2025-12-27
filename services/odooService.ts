
import { Empresa, ReporteCierre, ProductoVendido } from "../types";

export class OdooService {
  private url: string;
  private db: string;
  private username: string;
  private apiKey: string;
  private useProxy: boolean;
  private uid: number | null = null;

  constructor(empresa: Empresa) {
    this.url = empresa.odoo_url.endsWith('/') ? empresa.odoo_url.slice(0, -1) : empresa.odoo_url;
    this.db = empresa.odoo_db;
    this.username = empresa.odoo_username;
    this.apiKey = empresa.odoo_api_key;
    this.useProxy = !!empresa.use_proxy;
  }

  private async jsonRpc(path: string, method: string, params: any) {
    const fullUrl = `${this.url}${path}`;
    const requestUrl = this.useProxy 
      ? `https://corsproxy.io/?url=${encodeURIComponent(fullUrl)}` 
      : fullUrl;

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: params,
          id: Math.floor(Math.random() * 1000)
        })
      });

      if (!response.ok) {
        throw new Error(`Error de Servidor: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.data?.message || data.error.message || "Error en Odoo");
      }
      return data.result;
    } catch (error: any) {
      if (error.name === 'TypeError') {
        throw new Error("Falla de Conexión: Verifique el servidor Odoo o active el Proxy.");
      }
      throw error;
    }
  }

  async authenticate(): Promise<number> {
    const result = await this.jsonRpc('/jsonrpc', 'call', {
      service: 'common',
      method: 'authenticate',
      args: [this.db, this.username, this.apiKey, {}]
    });
    
    if (typeof result !== 'number') {
      throw new Error("Credenciales de Odoo inválidas.");
    }
    
    this.uid = result;
    return result;
  }

  async getPosOrders(limit = 100): Promise<ReporteCierre[]> {
    if (!this.uid) await this.authenticate();
    
    // Obtenemos órdenes con información de sesión y configuración de POS (Sede)
    const orders = await this.jsonRpc('/jsonrpc', 'call', {
      service: 'object',
      method: 'execute_kw',
      args: [this.db, this.uid, this.apiKey, 'pos.order', 'search_read', [
        [['state', 'in', ['paid', 'done', 'invoiced']]],
        ['id', 'name', 'date_order', 'amount_total', 'amount_tax', 'session_id', 'config_id']
      ], { limit, order: 'date_order desc' }]
    });

    return (orders || []).map((o: any) => ({
      id: o.id.toString(),
      fecha_reporte: o.date_order,
      total_ventas: o.amount_total,
      total_costo: o.amount_total * 0.65, // Estimación, en Odoo real se calcula línea por línea
      total_diferencia: 0,
      pos_name: Array.isArray(o.session_id) ? o.session_id[1].split('/')[0].trim() : 'Caja Principal',
      transacciones: 1
    }));
  }

  async getTopProducts(): Promise<ProductoVendido[]> {
    if (!this.uid) await this.authenticate();
    
    const lines = await this.jsonRpc('/jsonrpc', 'call', {
      service: 'object',
      method: 'execute_kw',
      args: [this.db, this.uid, this.apiKey, 'pos.order.line', 'read_group', [
        [['order_id.state', 'in', ['paid', 'done', 'invoiced']]],
        ['product_id', 'qty', 'price_subtotal_incl'],
        ['product_id']
      ], { limit: 10, orderby: 'qty desc' }]
    });

    return (lines || []).map((l: any) => ({
      nombre: Array.isArray(l.product_id) ? l.product_id[1] : 'Producto',
      cantidad: l.qty,
      total_venta: l.price_subtotal_incl,
      margen: l.price_subtotal_incl * 0.35,
      categoria: 'General'
    }));
  }
}
