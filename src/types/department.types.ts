export interface DepartmentRef {
  id: string;
  name: string;
}

export interface Department extends DepartmentRef {
  description?: string | null;
  _count?: {
    employees?: number;
    technicians?: number;
  };
}
