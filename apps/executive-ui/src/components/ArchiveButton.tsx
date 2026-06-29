"use client";

import { useRouter } from "next/navigation";

export function ArchiveButton({ slug }: { slug: string }) {
  const router = useRouter();

  async function handleArchive() {
    if (!confirm("Archive this situation?")) return;
    const res = await fetch(`/api/situations/${slug}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/situations");
      router.refresh();
    }
  }

  return (
    <button type="button" className="archive-btn" onClick={handleArchive}>
      Archive
    </button>
  );
}
