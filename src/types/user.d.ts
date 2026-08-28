export type User = {
  id: number;
  email: string;
  fullName: string;
  password: string | null;
  appleId?: string | null;
};
