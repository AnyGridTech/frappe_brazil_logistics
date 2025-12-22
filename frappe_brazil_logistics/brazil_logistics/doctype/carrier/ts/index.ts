import { CarrierDoc } from "./types/interface";

/**
 * Setup CNPJ field with validation and formatting
 */
function setupCNPJField(frm: any) {
  const cnpjField = frm.fields_dict["cnpj"];
  
  if (cnpjField && cnpjField.$input) {
    // Restrict input to numbers only
    cnpjField.$input.on("keypress", function (e: JQuery.KeyPressEvent) {
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
    cnpjField.$input.on("paste", function () {
      setTimeout(function () {
        if (cnpjField.$input) {
          const pastedValue = cnpjField.$input.val() as string;
          const cleanedValue = pastedValue.replace(/\D/g, "");
          cnpjField.$input.val(cleanedValue);
          frm.set_value("cnpj", cleanedValue);
        }
      }, 10);
    });
  }
}

frappe.ui.form.on<CarrierDoc>("Carrier", {
  onload: function (frm) {
    setupCNPJField(frm);
  },

  cnpj: function (frm) {
    if (!frm.doc.cnpj) return;

    // Format CNPJ to standard format (xx.xxx.xxx/xxxx-xx)
    agt.utils.brazil.cnpj.format(frm, "cnpj");

    // Validate CNPJ
    agt.utils.brazil.cnpj.validate(frm, "cnpj");
  },
});
