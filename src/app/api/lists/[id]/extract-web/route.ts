import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUser } from "@/lib/supabase";
import {
  fetchAndScrapePage,
  isCareerEmail,
  isGenericEmail,
  sortEmailsByPriority,
  generateFallbackEmails,
  derivePersonNameFromEmail,
  capitalize,
} from "@/lib/extractor";

export interface ExtractedWebLead {
  url: string;
  normalizedUrl: string;
  email: string;
  allEmails: string[];
  companyName: string;
  personName: string;
  isFallback?: boolean;
  error?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await prisma.mailingList.findFirst({
      where: { id, userId: user.id },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const body = await req.json();
    const { urls } = body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    const targetUrls = urls.slice(0, 30);
    const allExtracted: ExtractedWebLead[] = [];

    // Process in concurrency chunks of 5
    const chunkSize = 5;
    for (let i = 0; i < targetUrls.length; i += chunkSize) {
      const chunk = targetUrls.slice(i, i + chunkSize);

      const chunkResults = await Promise.all(
        chunk.map(async (rawUrl): Promise<ExtractedWebLead[] | null> => {
          const cleanInput = rawUrl.trim();
          if (!cleanInput) return null;

          let normalizedUrl = cleanInput;
          if (
            !normalizedUrl.startsWith("http://") &&
            !normalizedUrl.startsWith("https://")
          ) {
            normalizedUrl = `https://${normalizedUrl}`;
          }

          try {
            const urlObj = new URL(normalizedUrl);
            const domain = urlObj.hostname.replace(/^www\./, "");
            const baseHostname = domain.split(".")[0];

            // 1. Fetch main page
            const mainResult = await fetchAndScrapePage(
              normalizedUrl,
              domain,
              baseHostname,
            );

            const emails = new Set<string>(mainResult.emails);
            let companyName = mainResult.companyName;
            let personName = mainResult.personName;

            // 2. Explore sub-links if needed
            const hasCareerEmail = Array.from(emails).some((e) =>
              isCareerEmail(e),
            );
            if (!hasCareerEmail && mainResult.subLinks.length > 0) {
              const subResults = await Promise.all(
                mainResult.subLinks
                  .slice(0, 3)
                  .map((link) =>
                    fetchAndScrapePage(link, domain, baseHostname, true),
                  ),
              );

              for (const sub of subResults) {
                sub.emails.forEach((e) => emails.add(e));
                if (!companyName || companyName === capitalize(baseHostname)) {
                  if (
                    sub.companyName &&
                    sub.companyName !== capitalize(baseHostname)
                  ) {
                    companyName = sub.companyName;
                  }
                }
                if (!personName && sub.personName) {
                  personName = sub.personName;
                }
              }
            }

            const sortedEmails = sortEmailsByPriority(
              Array.from(emails),
              domain,
            );
            const finalCompanyName = companyName || capitalize(baseHostname);

            // 3. IF 0 direct emails found, generate multiple fallback candidates for this company!
            if (sortedEmails.length === 0) {
              const fallbackCandidates = generateFallbackEmails(domain);
              return fallbackCandidates.map((fEmail) => ({
                url: cleanInput,
                normalizedUrl,
                email: fEmail,
                allEmails: fallbackCandidates,
                companyName: finalCompanyName,
                personName: personName || derivePersonNameFromEmail(fEmail),
                isFallback: true,
              }));
            }

            // Otherwise return extracted emails
            const bestEmail = sortedEmails[0];
            if (!personName && bestEmail && !isGenericEmail(bestEmail)) {
              personName = derivePersonNameFromEmail(bestEmail);
            }

            return [
              {
                url: cleanInput,
                normalizedUrl,
                email: bestEmail,
                allEmails: sortedEmails,
                companyName: finalCompanyName,
                personName: personName || "",
                isFallback: false,
              },
            ];
          } catch (_err: unknown) {
            const err = _err as Error;
            console.error(`Error extracting from ${cleanInput}:`, err.message);
            const fallbackDomain = cleanInput
              .replace(/^(https?:\/\/)?(www\.)?/, "")
              .split("/")[0];
            const baseHostname = fallbackDomain.split(".")[0] || "Website";
            const fallbackCandidates = generateFallbackEmails(fallbackDomain);

            return fallbackCandidates.map((fEmail) => ({
              url: cleanInput,
              normalizedUrl: cleanInput,
              email: fEmail,
              allEmails: fallbackCandidates,
              companyName: capitalize(baseHostname),
              personName: derivePersonNameFromEmail(fEmail),
              isFallback: true,
              error: "Failed to connect to website (Using domain fallbacks)",
            }));
          }
        }),
      );

      chunkResults.forEach((res) => {
        if (res) allExtracted.push(...res);
      });
    }

    return NextResponse.json({ success: true, extracted: allExtracted });
  } catch (_error: unknown) {
    const error = _error as Error;
    console.error("Error in extract-web API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
