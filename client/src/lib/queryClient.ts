import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Try to parse JSON error response
    try {
      const errorData = JSON.parse(text);
      const message = errorData.message || text;
      throw new Error(message);
    } catch {
      // If not JSON, throw the text as-is
      throw new Error(text || res.statusText);
    }
  }
}

function getActiveCompanyId(): string | null {
  try {
    const stored = sessionStorage.getItem('activeCompany');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.id || null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function apiRequest(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const activeCompanyId = getActiveCompanyId();
  const headers = new Headers(options?.headers);
  
  if (activeCompanyId) {
    headers.set('X-Company-Id', activeCompanyId);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const activeCompanyId = getActiveCompanyId();
    const headers = new Headers();
    
    if (activeCompanyId) {
      headers.set('X-Company-Id', activeCompanyId);
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
