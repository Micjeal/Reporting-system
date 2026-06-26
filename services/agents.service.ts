export async function listAgents() {
  const res = await fetch('/api/agents', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch agents');
  }

  const data = await res.json();
  // The API returns { data: [...] }, so extract the array
  return Array.isArray(data) ? data : data.data || [];
}

export async function getCurrentAgent() {
  const res = await fetch('/api/agents/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch current agent');
  }

  const data = await res.json();
  // The API returns { data: {...} }, so extract the object
  return data.data || data;
}


export async function updateCurrentAgent(updates: {
  name?: string;
  phone?: string;
  region?: string;
}) {
  const res = await fetch('/api/agents/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update agent profile');
  }

  const data = await res.json();
  return data.data || data;
}
