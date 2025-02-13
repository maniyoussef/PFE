export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string; // ✅ Add status property
  startDate?: string;
  endDate?: string;
}
