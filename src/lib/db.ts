import path from "path";
import { initializeAdmin } from "./auth";
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

let db: any = null;

export async function getDb(): Promise<any> {
  if (db) return db;

  const dbPath = process.env.DB_DIR ?? path.join(process.cwd(), "data/secret-santa.db");
  
  const openFn = (global as any).__sqlite_open ?? open;
  db = await openFn({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Initialize tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS pools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      pool_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS restrictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      giver_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      FOREIGN KEY (giver_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES people(id) ON DELETE CASCADE,
      UNIQUE(giver_id, receiver_id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      giver_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      pool_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (giver_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE,
      UNIQUE(year, giver_id, pool_id)
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      link TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS email_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      smtp_server TEXT NOT NULL,
      smtp_port INTEGER NOT NULL,
      smtp_username TEXT NOT NULL,
      smtp_password TEXT NOT NULL,
      from_email TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      person_id INTEGER UNIQUE,
      must_change_password INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_person_id ON users(person_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_year ON assignments(year);
    CREATE INDEX IF NOT EXISTS idx_people_pool ON people(pool_id);
  `);

  // Initialize admin user
  await initializeAdmin();

  return db;
}