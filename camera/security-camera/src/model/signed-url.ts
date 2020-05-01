// SignedUrl interface
export interface SignedUrl {
  // Temporary signed url used for get or put operations
  url: string;

  // Time to live: when the signed url expires, no longer usable after that
  ttl: Date;
}
