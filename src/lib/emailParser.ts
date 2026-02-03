/**
 * Email Parser Utility
 * Extracts clean content from raw email data
 */

interface ParsedEmail {
    sender: string;
    subject: string;
    bodyText: string;
    bodyHtml?: string;
}

export function parseEmail(rawEmail: any): ParsedEmail {
    // Resend webhook payload structure
    const sender = rawEmail.from || rawEmail.sender || '';
    const subject = rawEmail.subject || '';
    let bodyText = rawEmail.text || rawEmail.body_text || '';
    const bodyHtml = rawEmail.html || rawEmail.body_html;

    // If HTML exists and text is empty/short, extract text from HTML
    if (bodyHtml && (!bodyText || bodyText.trim().length < 30)) {
        const htmlText = htmlToText(bodyHtml);
        bodyText = htmlText;
        console.log('📧 Usando texto extraído do HTML (text vazio/curto)');
    }

    // Clean the text body
    const cleanedBody = cleanEmailBody(bodyText);

    return {
        sender,
        subject,
        bodyText: cleanedBody,
        bodyHtml
    };
}

/**
 * Convert HTML to plain text (simple approach)
 */
function htmlToText(html: string): string {
    if (!html) return '';

    // Remove tags HTML e retorna texto limpo
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
        .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newline
        .replace(/<\/p>/gi, '\n\n') // Convert closing </p> to double newline
        .replace(/<[^>]+>/g, '') // Remove all other HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/&quot;/g, '"') // Replace &quot; with "
        .trim();
}

/**
 * Remove email signatures, threads, and common noise
 */
function cleanEmailBody(text: string): string {
    if (!text) return '';

    // Remove common email thread markers
    const threadMarkers = [
        /^On .* wrote:$/gm,
        /^Em .* escreveu:$/gm,
        /^[-]{2,}.*Forwarded message.*[-]{2,}/gim,
        /^[-]{2,}.*Mensagem encaminhada.*[-]{2,}/gim,
    ];

    let cleaned = text;
    threadMarkers.forEach(marker => {
        const match = text.search(marker);
        if (match !== -1) {
            cleaned = text.substring(0, match);
        }
    });

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    return cleaned;
}

export function extractUserIdFromEmail(emailAddress: string, profilesLookup: Map<string, string>): string | null {
    // Look up user_id by insighthub_email
    return profilesLookup.get(emailAddress) || null;
}
