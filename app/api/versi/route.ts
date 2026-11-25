import { NextResponse } from "next/server";
import { VERSI_PROMPT } from "@/lib/tiga-agen/prompt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Bukti versi: SHA commit GitHub yang dibangun. Deploy lewat CLI tidak membawa meta git, jadi SHA
// dimasukkan saat deploy sebagai env FEASIFLOW_COMMIT_SHA (build dan runtime). Deploy lewat integrasi
// Git Vercel memakai VERCEL_GIT_COMMIT_SHA.
export async function GET() {
  const sha = process.env.FEASIFLOW_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "";
  return NextResponse.json(
    {
      aplikasi: "FeasiFlow AI",
      commit: sha,
      repo: process.env.FEASIFLOW_REPO || "https://github.com/bryankwandou/feasiflow-ai",
      cabang: process.env.FEASIFLOW_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "",
      dibangun: process.env.FEASIFLOW_BUILD_TIME || "",
      deployment: process.env.VERCEL_DEPLOYMENT_ID || "",
      url_deployment: process.env.VERCEL_URL || "",
      lingkungan: process.env.VERCEL_ENV || "lokal",
      versi_prompt: { versi: VERSI_PROMPT.versi, sha256: VERSI_PROMPT.sha256 },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
