export interface Customer {
  id: string
  user_id: string
  name: string
  address: string
  cep: string
  phone: string
  email: string
  cpf: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  user_id: string
  customer_id: string
  description: string
  amount: number
  due_date: string
  has_interest: boolean
  interest_rate: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  barcode: string
  qr_code_data: string
  pdf_url?: string
  loc_id?: string
  transaction_id?: string
  linha_digitavel?: string
  nosso_numero?: string
  url_pdf?: string
  created_at: string
  updated_at: string
}

export interface InvoiceWithCustomer extends Invoice {
  customers: Customer
}
