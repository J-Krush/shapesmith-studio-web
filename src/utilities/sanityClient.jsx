import { createClient } from "@sanity/client";

const sanityClient = createClient({
  projectId: "qx9kep1e",
  dataset: "production",
  useCdn: true,
  apiVersion: '2023-06-16'
});

export default sanityClient;