export interface users {
  id: number;
  email: string;
  fullName: string;
  password: string | null;
  createdat?: Date;
}
