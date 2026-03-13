import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { isFirebaseConnected } from '../config/firebase.js';
import { findLeadsToEmail, updateLead } from '../models/leadFirestore.js';
import type { LeadRecord } from '../models/leadFirestore.js';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initialize Mailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function generatePersonalizedEmail(lead: LeadRecord) {
  try {
    const prompt = `
      Write a professional, high-intent cold email to ${lead.founderName || 'the Founder'} of ${lead.companyName}.
      They are in the ${lead.industry} industry in ${lead.location}.
      
      My company, ProReckon Solutions, offers Business Loans and MSME Funding.
      
      The goal is to schedule a consultation call.
      Keep it under 150 words. Focus on their potential need for working capital or expansion.
      Tone: Professional, helpful, not spammy.
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return result.text;
  } catch (error) {
    console.error('AI Generation Error:', error);
    return `Hi ${lead.founderName},\n\nI noticed ${lead.companyName} is doing great work in the ${lead.industry} space. We help businesses like yours secure funding. Let's chat?`;
  }
}

export async function processEmailQueue() {
  if (!isFirebaseConnected()) return;

  const leadsToEmail = await findLeadsToEmail(5);

  for (const lead of leadsToEmail) {
    if (!lead.email) continue;
    try {
      const emailContent = await generatePersonalizedEmail(lead);

      if (process.env.SMTP_USER && process.env.SMTP_USER !== 'your-email@gmail.com') {
        await transporter.sendMail({
          from: '"ProReckon Solutions" <outreach@proreckon.com>',
          to: lead.email,
          subject: `Funding opportunities for ${lead.companyName}`,
          text: emailContent,
        });
        console.log(`📧 Sent email to ${lead.email}`);
      } else {
        console.log(`📧 [MOCK SEND] To: ${lead.email} | Content: ${emailContent.substring(0, 50)}...`);
      }

      const history = lead.emailSequence?.history ?? [];
      await updateLead(lead.id, {
        status: 'Contacted',
        emailSequence: {
          ...lead.emailSequence,
          lastEmailSentAt: new Date(),
          history: [
            ...history,
            {
              type: 'sent' as const,
              date: new Date(),
              subject: `Funding opportunities for ${lead.companyName}`,
              content: emailContent,
            },
          ],
        },
      });
    } catch (error) {
      console.error(`❌ Failed to email ${lead.email}:`, error);
    }
  }
}
