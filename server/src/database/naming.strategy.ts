import { DefaultNamingStrategy, type Table } from 'typeorm';

/**
 * Human-readable constraint/index names instead of TypeORM's default hashes.
 * Format: <PREFIX>_<columns>_<table>, e.g. FK_account_id_transactions.
 * Must be used by BOTH the CLI data source and the Nest TypeORM config,
 * otherwise migration:generate will see a diff on every run.
 */
export class ReadableNamingStrategy extends DefaultNamingStrategy {
  override primaryKeyName(tableOrName: Table | string): string {
    return `PK_${this.getTableName(tableOrName)}`;
  }

  override foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
    return this.build('FK', tableOrName, columnNames);
  }

  override indexName(tableOrName: Table | string, columnNames: string[]): string {
    return this.build('IDX', tableOrName, columnNames);
  }

  override uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return this.build('UQ', tableOrName, columnNames);
  }

  override relationConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return this.build('REL', tableOrName, columnNames);
  }

  private build(prefix: string, tableOrName: Table | string, columnNames: string[]): string {
    return `${prefix}_${columnNames.join('_')}_${this.getTableName(tableOrName)}`;
  }
}
