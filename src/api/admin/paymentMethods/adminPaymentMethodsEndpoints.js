import axiosInstance from "../../axiosInstance";
import { formValuesToRequest } from "../../../utils/paymentMethodFields";

const BASE = "/api/v2/admin/payment-methods";

export async function getAdminPaymentMethods() {
  const response = await axiosInstance.get(BASE);

  const methods = response.data?.data;

  if (Array.isArray(methods)) {
    response.data.data = [...methods].sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || (a.id ?? 0) - (b.id ?? 0)
    );
  }

  return response.data;
}

export async function getAdminPaymentMethod(id) {
  const response = await axiosInstance.get(`${BASE}/${id}`);

  return response.data;
}

export async function getAdminPaymentMethodTypes() {
  const response = await axiosInstance.get(`${BASE}/types`);

  return response.data;
}

export async function createAdminPaymentMethod(values) {
  const response = await axiosInstance.post(BASE, formValuesToRequest(values));

  return response.data;
}

/** Update. Answers with the updated `PaymentMethodDto`. */
export async function updateAdminPaymentMethod({ id, values }) {
  const response = await axiosInstance.put(
    `${BASE}/${id}`,
    formValuesToRequest(values)
  );

  return response.data;
}

export async function deleteAdminPaymentMethod(id) {
  const response = await axiosInstance.delete(`${BASE}/${id}`);

  return response.data;
}

/** Activate / deactivate. Answers with the updated `PaymentMethodDto`. */
export async function updateAdminPaymentMethodStatus({ id, isActive }) {
  const response = await axiosInstance.patch(`${BASE}/${id}/status`, {
    isActive: Boolean(isActive),
  });

  return response.data;
}
