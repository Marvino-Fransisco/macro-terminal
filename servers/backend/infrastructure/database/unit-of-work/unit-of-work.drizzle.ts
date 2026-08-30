import { UnitOfWork } from "@/modules/shared";
import { AsyncLocalStorage } from "async_hooks";
import { Database, DatabaseContext, Transaction } from "../connections/supabase.connection";

const als = new AsyncLocalStorage<Transaction>();

export function createDrizzleUnitOfWork(db: Database): UnitOfWork {
  return {
    async run<T>(work: () => Promise<T>): Promise<T> {
      return db.transaction(async (tx) => {
        return als.run(tx, () => work());
      })
    }
  }
}

export function getConnection(db: Database): DatabaseContext {
  return als.getStore() ?? db;
}
