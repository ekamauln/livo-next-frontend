// Common API types and utilities
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const API_BASE_URL = "http://192.168.31.136:8081/api";

// Token refresh management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (error: ApiError | Error) => void;
}> = [];

const processQueue = (
  error: ApiError | Error | null,
  token: string | null = null
) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // If unauthorized and not already refreshing, try to refresh token
    if (response.status === 401 && token && endpoint !== "/auth/refresh") {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          // Retry with new token
          const newToken = localStorage.getItem("access_token");
          const newConfig = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            },
          };
          return fetch(`${API_BASE_URL}${endpoint}`, newConfig).then(
            async (retryResponse) => {
              if (!retryResponse.ok) {
                const errorData = await retryResponse
                  .json()
                  .catch(() => ({ message: "Request failed" }));
                throw new ApiError(
                  retryResponse.status,
                  errorData.message || "Request failed"
                );
              }
              return await retryResponse.json();
            }
          );
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh endpoint
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error("Token refresh failed");
        }

        const refreshData = await refreshResponse.json();
        const {
          access_token,
          refresh_token: newRefreshToken,
          user,
        } = refreshData.data;

        // Update stored tokens
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", newRefreshToken);
        localStorage.setItem("user_data", JSON.stringify(user));

        // Process queued requests
        processQueue(null, access_token);

        // Retry original request with new token
        const newConfig = {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${access_token}`,
          },
        };

        const retryResponse = await fetch(
          `${API_BASE_URL}${endpoint}`,
          newConfig
        );

        if (!retryResponse.ok) {
          const errorData = await retryResponse
            .json()
            .catch(() => ({ message: "Request failed" }));
          throw new ApiError(
            retryResponse.status,
            errorData.message || "Request failed"
          );
        }

        return await retryResponse.json();
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_data");

        // Process queued requests with error
        const error =
          refreshError instanceof Error
            ? refreshError
            : new Error("Token refresh failed");
        processQueue(error, null);

        // Redirect to login page
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }

        throw new ApiError(401, "Session expired. Please login again.");
      } finally {
        isRefreshing = false;
      }
    }

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new ApiError(
        response.status,
        errorData.message || "Request failed"
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, "Network error");
  }
}
