import React, { useState } from 'react';
import { Send, CheckCircle, Calendar, MessageCircle } from 'lucide-react';

export default function ConsultationPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    turnover: '',
    loanAmount: '',
    phone: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <header className="bg-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Secure Funding for Your Business Growth
          </h1>
          <p className="text-xl text-indigo-200 mb-8">
            Fast approvals. Competitive rates. Tailored for MSMEs.
          </p>
          <div className="flex justify-center gap-4">
            <a href="#apply" className="bg-white text-indigo-900 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition">
              Check Eligibility
            </a>
            <a href="https://wa.me/1234567890" className="flex items-center gap-2 bg-green-500 text-white px-8 py-3 rounded-full font-bold hover:bg-green-600 transition">
              <MessageCircle size={20} />
              WhatsApp Us
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-16 px-4 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        <FeatureCard 
          title="Business Loans" 
          desc="Unsecured loans up to ₹50 Lakhs for working capital." 
        />
        <FeatureCard 
          title="MSME Funding" 
          desc="Government schemes and collateral-free options." 
        />
        <FeatureCard 
          title="Loan Against Property" 
          desc="High-value loans with extended repayment tenure." 
        />
      </section>

      {/* Application Form */}
      <section id="apply" className="py-16 bg-white">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Check Your Loan Eligibility
            </h2>
            
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Application Received!</h3>
                <p className="text-slate-500 mt-2">
                  Our financial advisor will call you within 24 hours.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-indigo-600 font-medium hover:underline"
                >
                  Submit another application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.businessName}
                    onChange={e => setFormData({...formData, businessName: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Annual Turnover</label>
                    <select 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      value={formData.turnover}
                      onChange={e => setFormData({...formData, turnover: e.target.value})}
                    >
                      <option value="">Select...</option>
                      <option value="<50L">Less than ₹50 Lakhs</option>
                      <option value="50L-2Cr">₹50 Lakhs - ₹2 Cr</option>
                      <option value="2Cr-10Cr">₹2 Cr - ₹10 Cr</option>
                      <option value=">10Cr">More than ₹10 Cr</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Loan Amount</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 25 Lakhs"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      value={formData.loanAmount}
                      onChange={e => setFormData({...formData, loanAmount: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Get Free Consultation
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Scheduler */}
      <section className="py-16 bg-slate-100 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Schedule a Call Directly</h2>
        <button className="bg-white text-slate-900 px-6 py-3 rounded-lg shadow-sm border border-slate-200 font-medium hover:bg-slate-50 inline-flex items-center gap-2">
          <Calendar size={20} />
          Open Calendar
        </button>
      </section>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition">
      <h3 className="text-xl font-bold text-indigo-900 mb-2">{title}</h3>
      <p className="text-slate-600">{desc}</p>
    </div>
  );
}
