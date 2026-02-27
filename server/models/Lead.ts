import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  founderName: String,
  email: String,
  phone: String,
  website: String,
  industry: String,
  location: String,
  linkedinUrl: String,
  businessSize: String,
  source: String, // e.g., 'Google Maps', 'LinkedIn'
  
  // Enrichment Data
  enrichmentData: {
    employeeCount: Number,
    foundedYear: Number,
    techStack: [String],
    verifiedContacts: [{
      name: String,
      email: String,
      role: String
    }],
    socialProfiles: {
      linkedin: String,
      twitter: String,
      facebook: String
    }
  },

  // Qualification
  score: { type: Number, default: 0 },
  loanIntentProbability: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  priorityLevel: { type: String, enum: ['Cold', 'Warm', 'Hot'], default: 'Cold' },
  isQualified: { type: Boolean, default: false },

  // CRM Status
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Interested', 'Meeting Scheduled', 'Proposal Sent', 'Converted', 'Rejected'],
    default: 'New'
  },
  
  // Outreach
  emailSequence: {
    currentStep: { type: Number, default: 0 },
    lastEmailSentAt: Date,
    nextFollowUp: Date,
    history: [{
      type: { type: String, enum: ['sent', 'opened', 'replied'] },
      date: { type: Date, default: Date.now },
      subject: String,
      content: String
    }]
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Calculate score before saving
LeadSchema.pre('save', function(this: any, next: any) {
  let score = 0;
  if (this.website) score += 10;
  if (this.industry && ['Manufacturing', 'Real Estate', 'Construction'].includes(this.industry)) score += 20;
  
  // Enrichment Scoring
  if (this.enrichmentData) {
    // Larger companies might have higher loan capacity
    if (this.enrichmentData.employeeCount && this.enrichmentData.employeeCount > 50) score += 15;
    
    // Tech stack indicating e-commerce or modern business
    if (this.enrichmentData.techStack && (
        this.enrichmentData.techStack.includes('Shopify') || 
        this.enrichmentData.techStack.includes('Stripe') ||
        this.enrichmentData.techStack.includes('AWS')
    )) {
      score += 10;
    }

    // Verified contacts increase reachability
    if (this.enrichmentData.verifiedContacts && this.enrichmentData.verifiedContacts.length > 0) score += 5;
  }

  // Add more scoring logic here
  this.score = score;
  
  if (score > 30) {
    this.loanIntentProbability = 'High';
    this.priorityLevel = 'Hot';
    this.isQualified = true;
  } else if (score > 15) {
    this.loanIntentProbability = 'Medium';
    this.priorityLevel = 'Warm';
  }
  
  next();
});

export const Lead = mongoose.model('Lead', LeadSchema);
