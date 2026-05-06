"use strict";

const { Pool } = require("pg");

let pool;

/**
 * Return the value of a required environment variable, or throw.
 * @param {object} env - Node-RED environment accessor
 * @param {string} name - Variable name
 * @returns {string}
 */
function requiredEnv(env, name) {
  const value = env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getPool(env) {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: env.get("POSTGRES_HOST") || "postgres",
    port: Number(env.get("POSTGRES_PORT") || 5432),
    database: requiredEnv(env, "POSTGRES_DB"),
    user: requiredEnv(env, "POSTGRES_USER"),
    password: requiredEnv(env, "POSTGRES_PASSWORD"),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  return pool;
}

/**
 * Execute a parameterised SQL query against the shared pool.
 * @param {object} env - Node-RED environment accessor
 * @param {string} text - SQL statement with $1, $2, … placeholders
 * @param {any[]} [values] - Bind values
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(env, text, values = []) {
  if (!Array.isArray(values)) {
    throw new Error("Database query values must be an array.");
  }

  return getPool(env).query(text, values);
}

/**
 * Gracefully shut down the connection pool.
 * Call this when Node-RED stops flows to avoid leaked connections.
 */
async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  query,
  close
};
