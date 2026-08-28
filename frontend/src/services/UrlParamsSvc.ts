function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

export const UrlParamsSvc = {
  getFolder(): string | null {
    return getSearchParams().get("folder");
  },
};

