export interface AiInsights {
  country_state?: string;
  formatted_plate?: string;
  plate_type?: string;
  is_valid_format?: boolean;
  explanation?: string;
  confidence_score?: number;
}

export interface DetectionResult {
  success: boolean;
  plate_number: string;
  confidence: number;
  bbox_coordinates: number[];
  cropped_image?: string;
  original_image_url?: string;
  cropped_image_url?: string;
  record_id?: number;
  ai_insights?: AiInsights;
  processing_time_ms?: number;
  message?: string;
}

export interface HistoryRecord {
  id: number;
  plate_number: string;
  confidence: number;
  bbox_coordinates?: string;
  original_image_url?: string;
  cropped_image_url?: string;
  ai_insights?: string | AiInsights;
  is_verified: boolean;
  created_at?: string;
}
