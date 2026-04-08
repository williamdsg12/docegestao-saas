/**
 * Garante que a URL utilize HTTPS em ambientes que não sejam localhost.
 * Isso é um requisito obrigatório para redirects da Stripe em Livemode.
 */
export function ensureHttps(url: string | null | undefined): string {
    if (!url) return '';
    
    // Se for localhost ou 127.0.0.1, a Stripe permite HTTP
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
        return url;
    }
    
    // Em qualquer outro ambiente, forçar HTTPS
    if (url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    
    return url;
}
