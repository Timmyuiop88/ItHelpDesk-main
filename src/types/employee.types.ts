// TODO: update once backend docs confirm shape
export interface Employee {
  id: string;
}

export type CreateEmployeePayload = Omit<Employee, "id">;
export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;
