import axios from 'axios';

interface EnrichedData {
  employeeCount?: number;
  foundedYear?: number;
  techStack?: string[];
  verifiedContacts?: Array<{ name: string; email: string; role: string }>;
  socialProfiles?: { linkedin?: string; twitter?: string; facebook?: string };
}

export async function enrichLead(websiteUrl: string): Promise<EnrichedData | null> {
  if (!websiteUrl) return null;

  const apiKey = process.env.ENRICHMENT_API_KEY;

  // If no API key is configured, return mock data for demonstration
  if (!apiKey || apiKey === 'YOUR_ENRICHMENT_API_KEY') {
    console.log(`⚠️ Enrichment: No API key found. Returning mock data for ${websiteUrl}`);
    return getMockEnrichmentData(websiteUrl);
  }

  try {
    // Example implementation for Clearbit (or similar)
    // const response = await axios.get(`https://person.clearbit.com/v2/companies/find?domain=${websiteUrl}`, {
    //   headers: { Authorization: `Bearer ${apiKey}` }
    // });
    // return mapClearbitResponse(response.data);
    
    // For now, we simulate an API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return getMockEnrichmentData(websiteUrl);

  } catch (error) {
    console.error(`❌ Enrichment failed for ${websiteUrl}:`, error);
    return null;
  }
}

function getMockEnrichmentData(url: string): EnrichedData {
  // Deterministic mock data based on URL length/char to seem varied
  const isTech = url.includes('tech') || url.includes('io') || url.includes('app');
  const isLarge = url.length % 2 === 0;

  return {
    employeeCount: isLarge ? 150 : 25,
    foundedYear: isLarge ? 2010 : 2022,
    techStack: isTech 
      ? ['Node.js', 'React', 'AWS', 'Stripe'] 
      : ['WordPress', 'WooCommerce', 'Google Analytics'],
    verifiedContacts: [
      {
        name: 'Mock CEO',
        email: `ceo@${url.replace('https://', '').replace('http://', '').split('/')[0]}`,
        role: 'CEO'
      }
    ],
    socialProfiles: {
      linkedin: `https://linkedin.com/company/${url.replace('https://', '').split('.')[0]}`
    }
  };
}
