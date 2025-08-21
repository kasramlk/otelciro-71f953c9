import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  type: 'reservations' | 'analytics' | 'folio' | 'occupancy';
  format: 'csv' | 'pdf' | 'excel' | 'ppt';
  filters?: Record<string, any>;
  hotelId?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, format, filters = {}, hotelId = '550e8400-e29b-41d4-a716-446655440001', dateRange }: ExportRequest = await req.json();

    console.log(`Processing export request: ${type} as ${format} for hotel: ${hotelId}`);

    let data: any[] = [];
    let filename = '';

    // Fetch data based on type
    switch (type) {
      case 'reservations':
        const { data: reservations } = await supabase
          .from('reservations')
          .select(`
            *,
            guests (first_name, last_name, email, phone),
            hotels (name),
            room_types (name)
          `)
          .eq('hotel_id', hotelId)
          .order('created_at', { ascending: false });
        
        data = reservations || [];
        filename = `reservations_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'folio':
        const { data: folioItems } = await supabase
          .from('folio_items')
          .select(`
            *,
            reservations (code, guests (first_name, last_name))
          `)
          .eq('hotel_id', hotelId)
          .order('posted_at', { ascending: false });
        
        data = folioItems || [];
        filename = `folio_items_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'analytics':
        // Complex analytics query
        const { data: analytics } = await supabase
          .from('reservations')
          .select('check_in, check_out, total_price, status, source')
          .eq('hotel_id', hotelId);
        
        // Process analytics data
        data = analytics || [];
        filename = `analytics_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'occupancy':
        // Generate comprehensive occupancy data
        const { data: occupancyData } = await supabase
          .from('reservations')
          .select(`
            id,
            code,
            check_in,
            check_out,
            adults,
            children,
            total_price,
            status,
            source,
            created_at,
            room_types (name),
            guests (first_name, last_name, email)
          `)
          .eq('hotel_id', hotelId)
          .gte('check_in', dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .lte('check_out', dateRange?.to || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('check_in', { ascending: false });
        
        // Transform data for better export format
        data = (occupancyData || []).map(res => ({
          'Reservation Code': res.code,
          'Guest Name': res.guests ? `${res.guests.first_name} ${res.guests.last_name}` : 'N/A',
          'Guest Email': res.guests?.email || 'N/A',
          'Room Type': res.room_types?.name || 'N/A',
          'Check In': new Date(res.check_in).toLocaleDateString(),
          'Check Out': new Date(res.check_out).toLocaleDateString(),
          'Adults': res.adults || 0,
          'Children': res.children || 0,
          'Total Price': `$${res.total_price || 0}`,
          'Status': res.status,
          'Source': res.source || 'Direct',
          'Created': new Date(res.created_at).toLocaleDateString()
        }));
        
        filename = `occupancy_${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        throw new Error('Invalid export type');
    }

    // Generate export content based on format
    let content: string;
    let mimeType: string;

    switch (format) {
      case 'csv':
        content = generateCSV(data);
        mimeType = 'text/csv';
        filename += '.csv';
        break;

      case 'excel':
        // Simplified Excel format (XML-based)
        content = generateExcelXML(data);
        mimeType = 'application/vnd.ms-excel';
        filename += '.xls';
        break;

      case 'pdf':
        content = await generatePDF(data, type);
        mimeType = 'application/pdf';
        filename += '.pdf';
        break;

      case 'ppt':
        content = generatePowerPoint(data, type);
        mimeType = 'application/vnd.ms-powerpoint';
        filename += '.ppt';
        break;

      default:
        throw new Error('Invalid export format');
    }

    // Log export request
    await supabase.from('export_requests').insert({
      hotel_id: hotelId,
      user_id: req.headers.get('user-id') || 'unknown',
      export_type: type,
      format: format,
      status: 'Completed',
      filters: filters
    });

    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value || '').replace(/,/g, ';');
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

function generateExcelXML(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  
  let xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
<Worksheet ss:Name="Export">
<Table>
<Row>`;

  // Headers
  headers.forEach(header => {
    xml += `<Cell><Data ss:Type="String">${header}</Data></Cell>`;
  });
  xml += '</Row>';

  // Data rows
  data.forEach(row => {
    xml += '<Row>';
    headers.forEach(header => {
      const value = row[header];
      const type = typeof value === 'number' ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${type}">${value || ''}</Data></Cell>`;
    });
    xml += '</Row>';
  });

  xml += '</Table></Worksheet></Workbook>';
  return xml;
}

async function generatePDF(data: any[], type: string): Promise<string> {
  // Enhanced HTML with better formatting for PDF
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>${type.toUpperCase()} Report</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 20px; 
      color: #333;
      line-height: 1.4;
    }
    .header { 
      text-align: center; 
      margin-bottom: 30px; 
      padding-bottom: 20px;
      border-bottom: 3px solid #007bff;
    }
    .header h1 { 
      color: #007bff; 
      margin: 0; 
      font-size: 28px;
    }
    .header p { 
      margin: 10px 0 0 0; 
      color: #666; 
      font-size: 14px;
    }
    .summary {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      border-left: 4px solid #007bff;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    th { 
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
    }
    td { 
      border: 1px solid #dee2e6; 
      padding: 10px 8px; 
      font-size: 12px;
    }
    tbody tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    tbody tr:hover {
      background-color: #e3f2fd;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #dee2e6;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${type.toUpperCase()} Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
  <div class="summary">
    <strong>Total Records:</strong> ${data.length} | 
    <strong>Report Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)} | 
    <strong>Export Format:</strong> PDF
  </div>
  <table>`;

  if (data && data.length > 0) {
    const headers = Object.keys(data[0]);
    
    // Table headers
    html += '<thead><tr>';
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Table data
    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        const value = row[header];
        html += `<td>${typeof value === 'object' ? JSON.stringify(value) : (value || '')}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody>';
  }

  html += `</table>
  <div class="footer">
    <p>This report was generated by OtelCiro PMS - Property Management System</p>
    <p>For support, contact: support@otelciro.com</p>
  </div>
</body></html>`;

  // For a real PDF, you'd use a library like Puppeteer or similar
  // This returns HTML formatted for PDF printing
  return html;
}

function generatePowerPoint(data: any[], type: string): string {
  // Basic PowerPoint XML format
  let pptContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<presentation xmlns="http://schemas.openxmlformats.org/presentationml/2006/main">
  <slide>
    <title>${type.toUpperCase()} Report</title>
    <content>
      <summary>Total Records: ${data.length}</summary>
      <generated>Generated on ${new Date().toLocaleString()}</generated>
    </content>
  </slide>
</presentation>`;

  return pptContent;
}