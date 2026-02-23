import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../../supabase/migrations/001_checklist_schema.sql',
);

describe('001_checklist_schema.sql', () => {
  let sql: string;

  it('migration file exists', () => {
    expect(fs.existsSync(MIGRATION_PATH)).toBe(true);
    sql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
  });

  describe('checklist_items table', () => {
    it('creates table with all required columns', () => {
      sql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(sql).toContain('CREATE TABLE checklist_items');
      const requiredColumns = [
        'id UUID PRIMARY KEY',
        'user_id UUID NOT NULL',
        'trip_id TEXT NOT NULL',
        'item_name TEXT NOT NULL',
        'category TEXT NOT NULL',
        'quantity INTEGER NOT NULL DEFAULT 1',
        'priority TEXT NOT NULL',
        'assigned_day INTEGER',
        'activity_ref TEXT',
        'reasoning TEXT',
        'checked BOOLEAN NOT NULL DEFAULT FALSE',
        'booking_link TEXT',
        'source TEXT NOT NULL',
        'created_at TIMESTAMPTZ NOT NULL DEFAULT now()',
        'updated_at TIMESTAMPTZ NOT NULL DEFAULT now()',
      ];
      for (const col of requiredColumns) {
        expect(sql).toContain(col);
      }
    });

    it('has CHECK constraints for priority, quantity, source, and mutual exclusion', () => {
      sql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(sql).toMatch(/CHECK\s*\(\s*priority\s+IN/);
      expect(sql).toMatch(/CHECK\s*\(\s*quantity\s*>=\s*1\s*\)/);
      expect(sql).toMatch(/CHECK\s*\(\s*source\s+IN/);
      expect(sql).toMatch(
        /CHECK\s*\(\s*NOT\s*\(\s*assigned_day\s+IS\s+NOT\s+NULL\s+AND\s+activity_ref\s+IS\s+NOT\s+NULL\s*\)\s*\)/,
      );
    });

    it('has foreign key to auth.users', () => {
      sql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(sql).toMatch(
        /user_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+auth\.users\(id\)\s+ON\s+DELETE\s+CASCADE/,
      );
    });
  });

  describe('dismissed_suggestions table', () => {
    it('creates table with required columns and UNIQUE constraint', () => {
      sql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(sql).toContain('CREATE TABLE dismissed_suggestions');
      expect(sql).toContain('item_name TEXT NOT NULL');
      expect(sql).toMatch(
        /UNIQUE\s*\(\s*user_id\s*,\s*trip_id\s*,\s*item_name\s*,\s*category\s*\)/,
      );
    });
  });

  describe('user_categories table', () => {
    it('creates table with required columns and UNIQUE constraint', () => {
      sql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(sql).toContain('CREATE TABLE user_categories');
      expect(sql).toContain('category_name TEXT NOT NULL');
      expect(sql).toContain('display_order INTEGER NOT NULL DEFAULT 0');
      expect(sql).toMatch(
        /UNIQUE\s*\(\s*user_id\s*,\s*trip_id\s*,\s*category_name\s*\)/,
      );
    });
  });

  describe('indexes', () => {
    it('creates performance indexes', () => {
      sql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(sql).toContain('idx_checklist_items_user_trip');
      expect(sql).toContain('idx_dismissed_user_trip');
      expect(sql).toContain('idx_user_categories_user_trip');
    });
  });

  describe('RLS policies', () => {
    it('enables RLS on all tables', () => {
      sql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(sql).toMatch(
        /ALTER\s+TABLE\s+checklist_items\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/,
      );
      expect(sql).toMatch(
        /ALTER\s+TABLE\s+dismissed_suggestions\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/,
      );
      expect(sql).toMatch(
        /ALTER\s+TABLE\s+user_categories\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/,
      );
    });

    it('creates policies using auth.uid() = user_id', () => {
      sql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(sql).toMatch(/CREATE\s+POLICY[\s\S]*?ON\s+checklist_items/);
      expect(sql).toMatch(/CREATE\s+POLICY[\s\S]*?ON\s+dismissed_suggestions/);
      expect(sql).toMatch(/CREATE\s+POLICY[\s\S]*?ON\s+user_categories/);
      expect(sql).toMatch(/auth\.uid\(\)\s*=\s*user_id/);
    });
  });

  describe('trigger', () => {
    it('creates update_updated_at function and trigger', () => {
      sql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION update_updated_at()');
      expect(sql).toContain('NEW.updated_at = now()');
      expect(sql).toMatch(
        /CREATE\s+TRIGGER\s+checklist_items_updated_at/,
      );
      expect(sql).toContain('BEFORE UPDATE ON checklist_items');
      expect(sql).toContain('EXECUTE FUNCTION update_updated_at()');
    });
  });
});
