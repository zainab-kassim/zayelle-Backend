export interface users {
  id: number;
  email: string;
  fullName: string;
  password: string | null;
  appleId?: string | null;
  createdat?: Date;
}
