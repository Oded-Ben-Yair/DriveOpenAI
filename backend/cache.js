// backend/cache.js
// This file implements a simple in-memory cache using the "node-cache" library.
// It provides two functions: getCached() to retrieve a value by key, and
// setCached() to store a value with an optional TTL (time-to-live).
// The default TTL is set to 300 seconds (5 minutes), and expired keys are checked every 320 seconds.

import NodeCache from 'node-cache';

// Create a new NodeCache instance with a default TTL of 300 seconds.
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

/**
 * Retrieves a cached value by its key.
 * @param {string} key - The key for the cached value.
 * @returns {*} The cached value, or undefined if the key does not exist.
 */
export function getCached(key) {
  return cache.get(key);
}

/**
 * Stores a value in the cache with an optional TTL.
 * @param {string} key - The key under which to store the value.
 * @param {*} value - The value to cache.
 * @param {number} [ttlSeconds] - Optional TTL (in seconds) for this cache entry.
 */
export function setCached(key, value, ttlSeconds) {
  cache.set(key, value, ttlSeconds);
}
