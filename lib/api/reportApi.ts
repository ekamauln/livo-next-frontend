import {
  ComplainReportResponse,
  OutboundReportResponse,
  ReturnReportResponse,
} from "@/types/report";
import { apiRequest } from "@/lib/api/types";

export const reportApi = {
  getOutboundReports: async (
    date?: string,
    search?: string,
    expeditionSlug?: string
  ): Promise<OutboundReportResponse> => {
    const params = new URLSearchParams();

    // Use expedition slug as search parameter (backend expects 'search' for expedition filtering)
    const searchQuery = expeditionSlug || search;

    // Add search parameter if provided
    if (searchQuery) params.append("search", searchQuery);

    // Add date parameter if provided
    if (date) params.append("date", date);

    const queryString = params.toString();
    const endpoint = `/reports/handout-outbounds${
      queryString ? `?${queryString}` : ""
    }`;

    return apiRequest<OutboundReportResponse>(endpoint);
  },

  getReturnReports: async (
    date?: string,
    search?: string,
    returnType?: string
  ): Promise<ReturnReportResponse> => {
    const params = new URLSearchParams();

    // Use return type as search parameter (backend expects 'search' for return type filtering)
    const searchQuery = returnType || search;

    // Add search parameter if provided
    if (searchQuery) params.append("search", searchQuery);

    // Add date parameter if provided
    if (date) params.append("date", date);

    const queryString = params.toString();
    const endpoint = `/reports/handout-returns${
      queryString ? `?${queryString}` : ""
    }`;

    return apiRequest<ReturnReportResponse>(endpoint);
  },

  getComplainReports: async (
    date?: string
  ): Promise<ComplainReportResponse> => {
    const params = new URLSearchParams();

    // Add date parameter if provided
    if (date) params.append("date", date);

    const queryString = params.toString();
    const endpoint = `/reports/handout-complains${
      queryString ? `?${queryString}` : ""
    }`;

    return apiRequest<ComplainReportResponse>(endpoint);
  },
};
