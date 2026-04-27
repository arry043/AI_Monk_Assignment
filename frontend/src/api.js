import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Fetch all saved trees from the backend.
 * @returns {Promise<Array>} List of { id, tree_json, created_at, updated_at }
 */
export async function getTrees() {
  const { data } = await api.get('/trees');
  return data;
}

/**
 * Save a new tree to the backend.
 * @param {object} tree - The clean tree object (name, children/data)
 * @returns {Promise<object>} Created record { id, tree_json, created_at }
 */
export async function postTree(tree) {
  const { data } = await api.post('/trees', { tree });
  return data;
}

/**
 * Update an existing tree by ID.
 * @param {number} id - Tree record ID
 * @param {object} tree - The clean tree object (name, children/data)
 * @returns {Promise<object>} Updated record { id, tree_json, updated_at }
 */
export async function putTree(id, tree) {
  const { data } = await api.put(`/trees/${id}`, { tree });
  return data;
}
