import axiosInstance from "../../../api/axiosInstance";

export interface AdminConfiguration {
  id?: string;
  enable_delivery_photo: boolean;
  require_signature: boolean;
  auto_assign_orders: boolean;
  max_cancellation_time: number;
  support_contact_number: string;
  support_email: string;
  company_name: string;
  theme_color: string;
  charge_bottle_penalty: boolean;
  bottle_penalty_amount: string | number;
  company_upi_id?: string;
  company_upi_name?: string;
  is_secured?: boolean;
}

export const adminApi = {
  getConfig: async (): Promise<AdminConfiguration> => {
    const response = await axiosInstance.get<AdminConfiguration>("/administration/config/");
    return response.data;
  },

  updateConfig: async (configData: Partial<AdminConfiguration>): Promise<AdminConfiguration> => {
    const response = await axiosInstance.post<AdminConfiguration>("/administration/config/", configData);
    return response.data;
  },
};
