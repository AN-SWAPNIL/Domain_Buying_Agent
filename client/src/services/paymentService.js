import api from "./api";

export const paymentService = {
  // Create payment intent
  createPaymentIntent: async (amount, currency = "usd", metadata = {}) => {
    const response = await api.post("/payments/create-payment-intent", {
      amount,
      currency,
      metadata,
    });
    return response.data;
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId) => {
    const response = await api.post("/payments/confirm-payment", {
      paymentIntentId,
    });
    return response.data;
  },

  // Get payment methods
  getPaymentMethods: async () => {
    const response = await api.get("/payments/payment-methods");
    return response.data;
  },

  // Add payment method
  addPaymentMethod: async (paymentMethodId) => {
    const response = await api.post("/payments/payment-methods", {
      paymentMethodId,
    });
    return response.data;
  },

  // Remove payment method
  removePaymentMethod: async (paymentMethodId) => {
    const response = await api.delete(
      `/payments/payment-methods/${paymentMethodId}`
    );
    return response.data;
  },

  // Set default payment method
  setDefaultPaymentMethod: async (paymentMethodId) => {
    const response = await api.put("/payments/default-payment-method", {
      paymentMethodId,
    });
    return response.data;
  },

  // Get transaction history
  getTransactionHistory: async (page = 1, limit = 10) => {
    const response = await api.get("/payments/transactions", {
      params: { page, limit },
    });
    return response.data;
  },

  // Get transaction details
  getTransactionDetails: async (transactionId) => {
    const response = await api.get(`/payments/transactions/${transactionId}`);
    return response.data;
  },

  // Request refund
  requestRefund: async (transactionId, reason) => {
    const response = await api.post(
      `/payments/transactions/${transactionId}/refund`,
      {
        reason,
      }
    );
    return response.data;
  },

  // Get billing information
  getBillingInfo: async () => {
    const response = await api.get("/payments/billing-info");
    return response.data;
  },

  // Update billing information
  updateBillingInfo: async (billingInfo) => {
    const response = await api.put("/payments/billing-info", billingInfo);
    return response.data;
  },

  // Get invoices
  getInvoices: async (page = 1, limit = 10) => {
    const response = await api.get("/payments/invoices", {
      params: { page, limit },
    });
    return response.data;
  },

  // Download invoice
  downloadInvoice: async (invoiceId) => {
    const response = await api.get(`/payments/invoices/${invoiceId}/download`, {
      responseType: "blob",
    });
    return response.data;
  },
};

export default paymentService;
