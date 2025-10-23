import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

// Common API types and utilities
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://192.168.31.136:8081/api";

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            const newToken = localStorage.getItem("access_token");
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh endpoint
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const {
          access_token,
          refresh_token: newRefreshToken,
          user,
        } = refreshResponse.data.data;

        // Update stored tokens
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", newRefreshToken);
        localStorage.setItem("user_data", JSON.stringify(user));

        // Process queued requests
        processQueue(null, access_token);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_data");

        // Process queued requests with error
        const err =
          refreshError instanceof Error
            ? refreshError
            : new Error("Token refresh failed");
        processQueue(err, null);

        // Redirect to login page
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }

        return Promise.reject(
          new ApiError(401, "Session expired. Please login again.")
        );
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    if (error.response) {
      const errorMessage =
        (error.response.data as { message?: string })?.message ||
        "Request failed";
      throw new ApiError(error.response.status, errorMessage);
    } else if (error.request) {
      throw new ApiError(0, "Network error");
    } else {
      throw new ApiError(0, error.message || "Unknown error");
    }
  }
);

// Export the apiRequest function that uses axios
export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  try {
    const { method = "GET", body, headers = {} } = options;

    const response = await axiosInstance.request({
      url: endpoint,
      method,
      data: body ? JSON.parse(body) : undefined,
      headers,
    });

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, "Network error");
  }
}

// Export axios instance for direct use if needed
export { axiosInstance };
