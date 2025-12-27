
import { Empresa, ReporteCierre, ProductoVendido } from "../types";

// Utility to escape XML special characters
const xmlEscape = (str: string) => 
  str.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&apos;');

// Serializer for XML-RPC parameters
const serialize = (value: any): string => {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? `<int>${value}</int>` : `<double>${value}</double>`;
  }
  if (typeof value === 'string') {
    return `<string>${xmlEscape(value)}</string>`;
  }
  if (typeof value === 'boolean') {
    return `<boolean>${value ? '1' : '0'}</boolean>`;
  }
  if (Array.isArray(value)) {
    return `<array><data>${value.map(v => `<value>${serialize(v)}</value>`).join('')}</data></array>`;
  }
  if (typeof value === 'object' && value !== null) {
    if (value instanceof Date) {
        return `<string>${value.toISOString().replace('T', ' ').substring(0, 19)}</string>`;
    }
    return `<struct>${Object.entries(value).map(([k, v]) => 
      `<member><name>${k}</name><value>${serialize(v)}</value></member>`
    ).join('')}</struct>`;
  }
  return '';
};

// Parser for XML-RPC responses
const parseValue = (node: Element): any => {
  const child = node.firstElementChild;
  if (!child) return node.textContent?.trim(); 

  switch (child.tagName) {
    case 'string': return child.textContent;
    case 'int': 
    case 'i4': return parseInt(child.textContent || '0', 10);
    case 'double': return parseFloat(child.textContent || '0');
    case 'boolean': return child.textContent === '1';
    case 'array': 
      const dataNode = child.querySelector('data');
      if (!dataNode) return [];
      return Array.from(dataNode.children).map(n => parseValue(n as Element));
    case 'struct':
      const obj: any = {};
      Array.from(child.children).forEach(member => {
        const name = member.querySelector('name')?.textContent || '';
        const valNode = member.querySelector('value');
        if (name && valNode) {
          obj[name] = parseValue(valNode);
        }
      });
      return obj;
    default: return child.textContent;
  }
};

export class OdooService {
  private url: string;
  private db: string;
  private username: string;
  private apiKey: string;
  private useProxy: boolean;
  private uid: number | null = null;

  constructor(empresa: Empresa) {
    this.url = empresa.odoo_url.replace(/\/+$/, ''); 
    this.db = empresa.odoo_db;
    this.username = empresa.odoo_username;
    this.apiKey = empresa.odoo_api_key;
    this.useProxy = !!empresa.use_proxy;
  }

  private async rpcCall(endpoint: string, method: string, params: any[]) {
    const xml = `<?xml version="1.0"?>
<methodCall>
  <methodName>${method}</methodName>
  <params>
    ${params.map(p => `<param><value>${serialize(p)}</value></param>`).join('')}
  </params>
</methodCall>`;

    const targetUrl = `${this.url}/xmlrpc/2/${endpoint}`;
    const fetchUrl = this.useProxy 
      ? `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
      : targetUrl;

    try {
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
            },
            body: xml
        });

        if (!response.ok) {
            throw new Error(`Error de Red: ${response.status}`);
        }

        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/xml');
        
        const fault = doc.querySelector('fault');
        if (fault) {
            const faultStruct = parseValue(fault.querySelector('value')!);
            throw new Error(`Odoo Fault: ${faultStruct.faultString}`);
        }

        const paramNode = doc.querySelector('params param value');
        if (!paramNode) throw new Error('Respuesta XML inválida del servidor');
        
        return parseValue(paramNode);
    } catch (error: any) {
        console.error("RPC Sync Error:", error);
        throw error;
    }
  }

  async authenticate(): Promise<number> {
    const result = await this.rpcCall('common', 'authenticate', [
      this.db, 
      this.username, 
      this.apiKey, 
      {}
    ]);

    if (result === false || !result || typeof result !== 'number') {
      throw new Error(`Credenciales Inválidas para la base de datos "${this.db}".`);
    }

    this.uid = result;
    return result;
  }

  async getPosOrders(limit = 100, startDate?: string, endDate?: string): Promise<ReporteCierre[]> {
    if (!this.uid) await this.authenticate();
    
    const domain: any[] = [['state', 'in', ['paid', 'done', 'invoiced']]];
    
    if (startDate) domain.push(['date_order', '>=', startDate]);
    if (endDate) domain.push(['date_order', '<=', endDate]);

    const orders = await this.rpcCall('object', 'execute_kw', [
      this.db, 
      this.uid, 
      this.apiKey, 
      'pos.order', 
      'search_read', 
      [domain], 
      { 
        fields: ['id', 'name', 'date_order', 'amount_total', 'config_id'],
        limit: limit,
        order: 'date_order desc'
      }
    ]);

    return (orders || []).map((o: any) => ({
      id: o.id.toString(),
      fecha_reporte: o.date_order,
      total_ventas: parseFloat(o.amount_total) || 0,
      total_costo: (parseFloat(o.amount_total) || 0) * 0.65, 
      total_diferencia: 0,
      pos_name: Array.isArray(o.config_id) ? o.config_id[1] : 'Caja Principal',
      transacciones: 1
    }));
  }

  async getTopProducts(startDate?: string, endDate?: string): Promise<ProductoVendido[]> {
    if (!this.uid) await this.authenticate();
    
    const domain: any[] = [['order_id.state', 'in', ['paid', 'done', 'invoiced']]];
    if (startDate) domain.push(['order_id.date_order', '>=', startDate]);
    if (endDate) domain.push(['order_id.date_order', '<=', endDate]);

    const lines = await this.rpcCall('object', 'execute_kw', [
      this.db, 
      this.uid, 
      this.apiKey, 
      'pos.order.line', 
      'search_read', 
      [domain], 
      { 
        fields: ['product_id', 'qty', 'price_subtotal_incl'],
        limit: 150
      }
    ]);

    const productMap: Record<string, ProductoVendido> = {};
    (lines || []).forEach((l: any) => {
      const name = Array.isArray(l.product_id) ? l.product_id[1] : 'Producto';
      if (!productMap[name]) {
        productMap[name] = { nombre: name, cantidad: 0, total_venta: 0, margen: 0 };
      }
      productMap[name].cantidad += parseFloat(l.qty) || 0;
      productMap[name].total_venta += parseFloat(l.price_subtotal_incl) || 0;
      productMap[name].margen += (parseFloat(l.price_subtotal_incl) || 0) * 0.35;
    });

    return Object.values(productMap)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 15);
  }
}
