import { CarrierDoc } from "./types/interface";

/**
 * Format CEP to standard format (xxxxx-xxx)
 */
function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cep;
}

/**
 * Fetch address data from ViaCEP API
 */
async function fetchAddressFromCEP(cep: string): Promise<{
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
} | null> {
  try {
    const cleanedCEP = cep.replace(/\D/g, "");
    
    if (cleanedCEP.length !== 8) {
      return null;
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanedCEP}/json/`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch CEP data");
    }

    const data = await response.json();

    if (data.erro) {
      frappe.msgprint({
        title: __("CEP Not Found"),
        indicator: "orange",
        message: __("The provided CEP was not found in the database"),
      });
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching CEP:", error);
    frappe.msgprint({
      title: __("Error"),
      indicator: "red",
      message: __("Failed to fetch address data. Please check your internet connection."),
    });
    return null;
  }
}

/**
 * Process CEP and fill address fields
 */
async function processCEPLookup(frm: any) {
  if (!frm.doc.cep) return;

  const cleanedCEP = frm.doc.cep.replace(/\D/g, "");
  
  // Only proceed if we have exactly 8 digits
  if (cleanedCEP.length !== 8) return;

  // Format the CEP field
  const formattedCEP = formatCEP(frm.doc.cep);
  if (frm.doc.cep !== formattedCEP) {
    frm.set_value("cep", formattedCEP);
  }

  // Fetch and auto-fill address fields based on CEP
  const addressData = await fetchAddressFromCEP(formattedCEP);

  if (addressData) {
    frm.set_value("address", addressData.logradouro || "");
    frm.set_value("neighborhood", addressData.bairro || "");
    frm.set_value("city", addressData.localidade || "");
    frm.set_value("state", addressData.uf || "");
    frm.set_value("ibge", addressData.ibge || "");

    frappe.show_alert({
      message: __("Address filled successfully"),
      indicator: "green",
    }, 3);
  }
}

/**
 * Setup CEP field with validation and auto-complete functionality
 */
function setupCEPField(frm: any) {
  // Set up state filter
  frm.set_query("state", function () {
    return {
      filters: {
        country: "Brazil",
      },
    };
  });

  // Add input event listener for real-time checking when 8 digits are entered
  const cepField = frm.fields_dict["cep"];
  if (cepField && cepField.$input) {
    // Restrict input to numbers only
    cepField.$input.on("keypress", function (e: JQuery.KeyPressEvent) {
      // Allow: backspace, delete, tab, escape, enter
      if (
        e.keyCode === 8 ||
        e.keyCode === 9 ||
        e.keyCode === 27 ||
        e.keyCode === 13 ||
        e.keyCode === 46 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)
      ) {
        return;
      }
      
      // Ensure that it is a number and stop the keypress if not
      if ((e.which < 48 || e.which > 57)) {
        e.preventDefault();
      }
    });

    // Handle paste event to remove non-numeric characters
    cepField.$input.on("paste", function () {
      setTimeout(function () {
        if (cepField.$input) {
          const pastedValue = cepField.$input.val() as string;
          const cleanedValue = pastedValue.replace(/\D/g, "");
          cepField.$input.val(cleanedValue);
          frm.set_value("cep", cleanedValue);
        }
      }, 10);
    });

    cepField.$input.on("input", function () {
      const cleanedCEP = frm.doc.cep ? frm.doc.cep.replace(/\D/g, "") : "";
      
      // Trigger lookup when exactly 8 digits are entered
      if (cleanedCEP.length === 8) {
        processCEPLookup(frm);
      }
    });
  }
}

frappe.ui.form.on<CarrierDoc>("Carrier", {
  onload: function (frm) {
    setupCEPField(frm);
  },

  // Trigger when field loses focus (clicked outside)
  cep: async function (frm) {
    await processCEPLookup(frm);
  },
});
