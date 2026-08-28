import axios, { type AxiosRequestConfig } from "axios";
import { useAppStore } from "../store/useAppStore";
import type { Manifest } from "../types/manifest";

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error("VITE_API_URL is not set");
}

type PostPayload = {
  code?: string | null;
  route?: string | null;
  key?: string | null;
};

export const HttpSvc = {
  async post(
    { code = null, route = null, key = null }: PostPayload = {},
    config?: AxiosRequestConfig,
  ) {
    const resolvedCode = code ?? useAppStore.getState().code ?? null;
    const response = await axios.post(
      BASE_URL,
      {
        code: resolvedCode,
        route,
        key,
      },
      config,
    );
    return response.data;
  },

  async isCodeValid(code: string) {
    return this.post({ route: "isCodeValid", code });
  },

  async listFolders() {
    return this.post({ route: "listFolders" });
  },

  async getManifest(folder: string): Promise<Manifest> {
    const presignResponse = await this.post({
      route: "getItem",
      key: `${folder}/manifest.json`,
    });
    const url = extractUrl(presignResponse);
    const response = await axios.get<Manifest>(url);
    return response.data;
  },

  async getItem(folder: string, filename: string): Promise<string> {
    const presignResponse = await this.post({
      route: "getItem",
      key: `${folder}/${filename}`,
    });
    return extractUrl(presignResponse);
  },
};

function extractUrl(responseData: unknown): string {
  if (
    responseData &&
    typeof responseData === "object" &&
    "url" in responseData &&
    typeof (responseData as { url: unknown }).url === "string"
  ) {
    return (responseData as { url: string }).url;
  }

  if (typeof responseData === "string") {
    try {
      const parsed = JSON.parse(responseData);
      if (parsed && typeof parsed.url === "string") {
        return parsed.url;
      }
    } catch (error) {
      console.error("Unable to parse presigned URL response", error);
    }
  }

  throw new Error("Presigned URL not found in response");
}

