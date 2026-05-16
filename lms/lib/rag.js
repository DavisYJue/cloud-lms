const RAG_URL = process.env.RAG_URL ?? "http://localhost:8000";
const RAG_SECRET = process.env.RAG_INTERNAL_SECRET ?? "add-new-rag-secret-here";

export function toAbsolutePath(relativePath) {
  return `/app/public${relativePath}`;
}

/**
 * Tell the RAG to ingest a file
 * @param {string} relativePath
 */
export async function ragIngest(relativePath) {
  if (!relativePath.toLowerCase().endsWith(".pdf")) return;

  const absolutePath = toAbsolutePath(relativePath);

  try {
    const res = await fetch(`${RAG_URL}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_path: absolutePath, secret: RAG_SECRET }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`[RAG] Ingest failed for ${relativePath}:`, data);
    } else {
      console.log(`[RAG] Ingest result for ${relativePath}:`, data);
    }
  } catch (err) {
    console.error(`[RAG] Ingest error for ${relativePath}:`, err);
  }
}

/**
 * Tell the RAG to delete a file's chunks
 * If ingest is in progress, the RAG will cancel it and clean up
 * @param {string} relativePath
 */
export async function ragDelete(relativePath) {
  if (!relativePath.toLowerCase().endsWith(".pdf")) return;

  const absolutePath = toAbsolutePath(relativePath);

  try {
    const res = await fetch(`${RAG_URL}/ingest`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_path: absolutePath, secret: RAG_SECRET }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`[RAG] Delete failed for ${relativePath}:`, data);
    } else {
      console.log(`[RAG] Delete result for ${relativePath}:`, data);
    }
  } catch (err) {
    console.error(`[RAG] Delete error for ${relativePath}:`, err);
  }
}
