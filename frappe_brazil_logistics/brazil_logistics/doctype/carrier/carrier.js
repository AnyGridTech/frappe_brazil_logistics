// Copyright (c) 2025, AnyGridTech and contributors
// For license information, please see license.txt
"use strict";
(() => {
  // brazil_logistics/doctype/carrier/ts/cep.ts
  function formatCEP(cep) {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return cep;
  }
  async function fetchAddressFromCEP(cep) {
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
          message: __("The provided CEP was not found in the database")
        });
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error fetching CEP:", error);
      frappe.msgprint({
        title: __("Error"),
        indicator: "red",
        message: __("Failed to fetch address data. Please check your internet connection.")
      });
      return null;
    }
  }
  async function processCEPLookup(frm) {
    if (!frm.doc.cep) return;
    const cleanedCEP = frm.doc.cep.replace(/\D/g, "");
    if (cleanedCEP.length !== 8) return;
    const formattedCEP = formatCEP(frm.doc.cep);
    if (frm.doc.cep !== formattedCEP) {
      frm.set_value("cep", formattedCEP);
    }
    const addressData = await fetchAddressFromCEP(formattedCEP);
    if (addressData) {
      frm.set_value("address", addressData.logradouro || "");
      frm.set_value("neighborhood", addressData.bairro || "");
      frm.set_value("city", addressData.localidade || "");
      frm.set_value("state", addressData.uf || "");
      frm.set_value("ibge", addressData.ibge || "");
      frappe.show_alert({
        message: __("Address filled successfully"),
        indicator: "green"
      }, 3);
    }
  }
  function setupCEPField(frm) {
    frm.set_query("state", function() {
      return {
        filters: {
          country: "Brazil"
        }
      };
    });
    const cepField = frm.fields_dict["cep"];
    if (cepField && cepField.$input) {
      cepField.$input.on("keypress", function(e) {
        if (e.keyCode === 8 || e.keyCode === 9 || e.keyCode === 27 || e.keyCode === 13 || e.keyCode === 46 || // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        e.keyCode === 65 && e.ctrlKey === true || e.keyCode === 67 && e.ctrlKey === true || e.keyCode === 86 && e.ctrlKey === true || e.keyCode === 88 && e.ctrlKey === true) {
          return;
        }
        if (e.which < 48 || e.which > 57) {
          e.preventDefault();
        }
      });
      cepField.$input.on("paste", function() {
        setTimeout(function() {
          if (cepField.$input) {
            const pastedValue = cepField.$input.val();
            const cleanedValue = pastedValue.replace(/\D/g, "");
            cepField.$input.val(cleanedValue);
            frm.set_value("cep", cleanedValue);
          }
        }, 10);
      });
      cepField.$input.on("input", function() {
        const cleanedCEP = frm.doc.cep ? frm.doc.cep.replace(/\D/g, "") : "";
        if (cleanedCEP.length === 8) {
          processCEPLookup(frm);
        }
      });
    }
  }
  frappe.ui.form.on("Carrier", {
    onload: function(frm) {
      setupCEPField(frm);
    },
    // Trigger when field loses focus (clicked outside)
    cep: async function(frm) {
      await processCEPLookup(frm);
    }
  });

  // brazil_logistics/doctype/carrier/ts/index.ts
  function setupCNPJField(frm) {
    const cnpjField = frm.fields_dict["cnpj"];
    if (cnpjField && cnpjField.$input) {
      cnpjField.$input.on("keypress", function(e) {
        if (e.keyCode === 8 || e.keyCode === 9 || e.keyCode === 27 || e.keyCode === 13 || e.keyCode === 46 || // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        e.keyCode === 65 && e.ctrlKey === true || e.keyCode === 67 && e.ctrlKey === true || e.keyCode === 86 && e.ctrlKey === true || e.keyCode === 88 && e.ctrlKey === true) {
          return;
        }
        if (e.which < 48 || e.which > 57) {
          e.preventDefault();
        }
      });
      cnpjField.$input.on("paste", function() {
        setTimeout(function() {
          if (cnpjField.$input) {
            const pastedValue = cnpjField.$input.val();
            const cleanedValue = pastedValue.replace(/\D/g, "");
            cnpjField.$input.val(cleanedValue);
            frm.set_value("cnpj", cleanedValue);
          }
        }, 10);
      });
    }
  }
  frappe.ui.form.on("Carrier", {
    onload: function(frm) {
      setupCNPJField(frm);
    },
    cnpj: function(frm) {
      if (!frm.doc.cnpj) return;
      agt.utils.brazil.cnpj.format(frm, "cnpj");
      agt.utils.brazil.cnpj.validate(frm, "cnpj");
    }
  });
})();
