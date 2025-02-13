export interface User {
  id?: number;
  name: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  hasContract: boolean;
  countryId: number;
  roleId: number;
  password?: string;
  country?: {
    id: number;
    name: string;
  };
  role?: {
    id: number;
    name: string;
  };
}
