import { FrappeDoc } from "@anygridtech/frappe-types/client/frappe/core";


export interface CarrierDoc extends FrappeDoc {
  // Info Section
  fantasy_name?: string;
  cnpj?: string;
  email?: string;
  company_name?: string;
  state_registration?: string;
  phone?: string;

  // Address Section
  cep?: string;
  address?: string;
  address_number?: string;
  address_type?: 
    | ""
    | "Billing"
    | "Shipping"
    | "Office"
    | "Personal"
    | "Plant"
    | "Postal"
    | "Shop"
    | "Subsidiary"
    | "Warehouse"
    | "Current"
    | "Permanent"
    | "Other";
  state?: string;
  city?: string;
  neighborhood?: string;
  ibge?: string;
}