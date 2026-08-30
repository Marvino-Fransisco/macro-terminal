export type Entity = {
  id: string;

  createdBy: string;
  createdAt: Date;

  updatedBy: string | null;
  updatedAt: Date;

  deletedBy: string | null;
  deletedAt: Date | null;
}
